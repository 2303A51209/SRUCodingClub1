const { getSupabaseAdmin, getSupabaseClient } = require('../config/supabase');
const { ApiError } = require('../utils/errors');

/**
 * Pure Supabase Auth Service
 * No custom JWTs - let Supabase handle sessions
 */
class AuthService {
    /**
     * Register a new user
     */
    async register(email, password, fullName) {
        // Use client for auth operations to avoid admin context pollution
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });

        if (error) {
            if (error.message.includes('already registered')) {
                throw new ApiError(400, 'Email already taken');
            }
            throw new ApiError(400, error.message);
        }

        if (!data.user) {
            throw new ApiError(500, 'Registration failed');
        }

        // Ensure profile exists (safety net for trigger)
        // Must use admin here to bypass potential RLS during profile creation
        await this.ensureProfile(data.user.id, email, fullName);

        return {
            user: data.user,
            session: data.session,
        };
    }

    /**
     * Login user
     */
    async login(email, password) {
        // Use client for login
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw new ApiError(401, 'Invalid email or password');
        }

        // Ensure profile exists (safety net)
        const profile = await this.ensureProfile(
            data.user.id,
            data.user.email,
            data.user.user_metadata?.full_name
        );

        return {
            user: data.user,
            session: data.session,
            profile,
        };
    }

    /**
     * Refresh session
     */
    async refreshSession(refreshToken) {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (error) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        return {
            session: data.session,
            user: data.user,
        };
    }

    /**
     * Logout user
     */
    async logout() {
        // Supabase admin can't really "logout" - that's client-side
        // This is a no-op, client should clear its session
        return { success: true };
    }

    /**
     * Send password reset email
     */
    async forgotPassword(email) {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:3000/reset-password.html', // Make sure this page exists or points to a valid handler
        });

        if (error) {
            throw new ApiError(400, error.message);
        }

        return { success: true };
    }

    /**
     * Reset password using access token
     */
    async resetPassword(accessToken, newPassword) {
        // 1. Verify the token and get the user
        const supabase = getSupabaseClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

        if (userError || !user) {
            throw new ApiError(401, 'Invalid or expired reset token');
        }

        // 2. Update the user's password using Admin client
        const supabaseAdmin = getSupabaseAdmin();
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) {
            throw new ApiError(400, 'Failed to update password: ' + updateError.message);
        }

        return { success: true };
    }

    /**
     * Get user by access token
     */
    async getUser(accessToken) {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getUser(accessToken);

        if (error || !data.user) {
            throw new ApiError(401, 'Invalid or expired token');
        }

        // Get profile using Admin to ensure we can read it regardless of potential RLS quirks
        // (Though usually users can read their own profile)
        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        return {
            user: data.user,
            profile,
        };
    }

    /**
     * Ensure user profile exists (safety net)
     */
    async ensureProfile(userId, email, fullName = null) {
        const supabaseAdmin = getSupabaseAdmin();

        // Try to get existing profile
        let { data: profile } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        // Auto-create if missing
        if (!profile) {
            const { data: newProfile, error } = await supabaseAdmin
                .from('users')
                .insert({
                    id: userId,
                    email: email,
                    full_name: fullName,
                    role: 'member',
                })
                .select()
                .single();

            if (error) {
                console.error('Profile creation error:', error);
                // Don't throw - profile can be created later
            }
            profile = newProfile;
        }

        return profile;
    }
}

module.exports = new AuthService();
