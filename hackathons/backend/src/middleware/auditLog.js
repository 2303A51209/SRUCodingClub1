/**
 * Hackathons Platform - Audit Logger Middleware
 * Logs all admin actions for security compliance
 */
const { supabaseAdmin } = require('../services/supabase');
const logger = require('../utils/logger');

/**
 * Log admin action to audit_logs table
 */
const logAuditEvent = async ({
    adminId,
    action,
    entityType,
    entityId,
    details,
    ipAddress,
}) => {
    try {
        await supabaseAdmin
            .from('audit_logs')
            .insert({
                admin_id: adminId,
                action,
                entity_type: entityType,
                entity_id: entityId,
                details: details || {},
                ip_address: ipAddress,
            });
    } catch (error) {
        // Don't fail the request if audit logging fails
        logger.error({ error }, 'Failed to log audit event');
    }
};

/**
 * Middleware to automatically log admin mutations
 */
const auditMiddleware = (action, entityType) => {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            // Log successful mutations (2xx responses)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const entityId = data?.data?.id || req.params.id || null;

                logAuditEvent({
                    adminId: req.user?.id,
                    action,
                    entityType,
                    entityId,
                    details: {
                        method: req.method,
                        path: req.path,
                        body: req.body,
                    },
                    ipAddress: req.ip,
                });
            }

            return originalJson(data);
        };

        next();
    };
};

module.exports = {
    logAuditEvent,
    auditMiddleware,
};
