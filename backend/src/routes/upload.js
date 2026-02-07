/**
 * Upload Routes - Handle file uploads (avatars, gallery images)
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { catchAsync, ApiError } = require('../utils/errors');
const { getSupabaseAdmin } = require('../config/supabase');

const router = express.Router();

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /upload/avatar - Upload user avatar
 * Expects multipart/form-data with 'avatar' field containing base64 image data
 * Or JSON with { image: "data:image/...;base64,..." }
 */
router.post(
    '/avatar',
    authenticate,
    catchAsync(async (req, res) => {
        const { image } = req.body;

        if (!image) {
            throw new ApiError(400, 'No image provided');
        }

        // Parse base64 image data
        const matches = image.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            throw new ApiError(400, 'Invalid image format. Expected base64 data URL.');
        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        // Validate file type
        if (!ALLOWED_TYPES.includes(mimeType)) {
            throw new ApiError(400, `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
        }

        // Decode base64 and check size
        const buffer = Buffer.from(base64Data, 'base64');
        if (buffer.length > MAX_FILE_SIZE) {
            throw new ApiError(400, `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        }

        const supabase = getSupabaseAdmin();

        // Generate unique filename
        const ext = mimeType.split('/')[1];
        const filename = `${req.user.id}-${Date.now()}.${ext}`;
        const filePath = `avatars/${filename}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, buffer, {
                contentType: mimeType,
                upsert: true
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new ApiError(500, 'Failed to upload image');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        const avatarUrl = urlData.publicUrl;

        // Update user profile with new avatar URL
        const { data: user, error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: avatarUrl })
            .eq('id', req.user.id)
            .select('id, avatar_url')
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            throw new ApiError(500, 'Failed to update profile');
        }

        res.json({
            success: true,
            data: {
                avatar_url: avatarUrl
            },
            message: 'Avatar uploaded successfully'
        });
    })
);

/**
 * DELETE /upload/avatar - Remove user avatar
 */
router.delete(
    '/avatar',
    authenticate,
    catchAsync(async (req, res) => {
        const supabase = getSupabaseAdmin();

        // Get current avatar URL to find the file
        const { data: user } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('id', req.user.id)
            .single();

        if (user?.avatar_url && user.avatar_url.includes('avatars/')) {
            // Extract filename from URL
            const urlParts = user.avatar_url.split('/');
            const filename = urlParts[urlParts.length - 1];

            // Delete from storage
            await supabase.storage
                .from('avatars')
                .remove([`avatars/${filename}`]);
        }

        // Clear avatar URL in profile
        await supabase
            .from('users')
            .update({ avatar_url: null })
            .eq('id', req.user.id);

        res.json({
            success: true,
            message: 'Avatar removed successfully'
        });
    })
);

module.exports = router;
