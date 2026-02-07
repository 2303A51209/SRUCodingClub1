/**
 * Hackathons Platform - Email Service
 * Dual SMTP: Supabase for system emails, Gmail for bulk
 */
const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');
const { supabaseAdmin } = require('./supabase');

// Gmail SMTP transporter for bulk emails
const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.gmail.user,
        pass: config.gmail.appPassword,
    },
});

/**
 * Select SMTP based on email type
 * @param {string} emailType - 'system' | 'bulk'
 */
const selectSMTP = (emailType) => {
    if (emailType === 'system') {
        // System emails use Supabase Auth (password reset, etc.)
        return 'supabase';
    }
    return 'gmail';
};

/**
 * Send email via Gmail SMTP
 */
const sendGmailEmail = async ({ to, subject, html, text }) => {
    const mailOptions = {
        from: `"${config.email.fromName}" <${config.gmail.user}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
    };

    const result = await gmailTransporter.sendMail(mailOptions);
    logger.info({ to, subject, messageId: result.messageId }, 'Email sent via Gmail');
    return result;
};

/**
 * Queue email for async processing
 */
const queueEmail = async ({
    hackathonId,
    template,
    recipientEmail,
    recipientName,
    subject,
    bodyHtml,
    smtpType = 'bulk',
}) => {
    const { data, error } = await supabaseAdmin
        .from('email_queue')
        .insert({
            hackathon_id: hackathonId,
            template,
            recipient_email: recipientEmail,
            recipient_name: recipientName,
            subject,
            body_html: bodyHtml,
            smtp_type: smtpType,
            status: 'pending',
        })
        .select()
        .single();

    if (error) {
        logger.error({ error }, 'Failed to queue email');
        throw error;
    }

    return data;
};

/**
 * Process pending emails from queue
 */
const processEmailQueue = async (limit = 50) => {
    const { data: pending, error } = await supabaseAdmin
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .limit(limit);

    if (error) {
        logger.error({ error }, 'Failed to fetch email queue');
        return;
    }

    for (const email of pending) {
        try {
            // Mark as sending
            await supabaseAdmin
                .from('email_queue')
                .update({ status: 'sending' })
                .eq('id', email.id);

            // Send via appropriate SMTP
            if (email.smtp_type === 'bulk') {
                await sendGmailEmail({
                    to: email.recipient_email,
                    subject: email.subject,
                    html: email.body_html,
                });
            }

            // Mark as sent
            await supabaseAdmin
                .from('email_queue')
                .update({
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                })
                .eq('id', email.id);

        } catch (err) {
            await handleEmailRetry(email, err);
        }
    }
};

/**
 * Handle email retry logic
 */
const handleEmailRetry = async (email, error) => {
    const maxRetries = 3;

    if (email.retry_count < maxRetries) {
        await supabaseAdmin
            .from('email_queue')
            .update({
                retry_count: email.retry_count + 1,
                error_message: error.message,
                status: 'pending',
            })
            .eq('id', email.id);

        logger.warn({ emailId: email.id, retry: email.retry_count + 1 }, 'Email retry scheduled');
    } else {
        await supabaseAdmin
            .from('email_queue')
            .update({
                status: 'failed',
                error_message: error.message,
            })
            .eq('id', email.id);

        logger.error({ emailId: email.id, error: error.message }, 'Email permanently failed');
    }
};

/**
 * Log email send to email_logs table
 */
const logEmailSend = async ({
    hackathonId,
    subject,
    template,
    recipientsCount,
    sentBy,
}) => {
    await supabaseAdmin
        .from('email_logs')
        .insert({
            hackathon_id: hackathonId,
            subject,
            template,
            recipients_count: recipientsCount,
            sent_by: sentBy,
        });
};

module.exports = {
    selectSMTP,
    sendGmailEmail,
    queueEmail,
    processEmailQueue,
    logEmailSend,
    gmailTransporter,
};
