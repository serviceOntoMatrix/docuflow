-- Add schedule and recurrence support to reminders
-- When status=pending and scheduled_at <= NOW(), process (send notification, set sent).
-- recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly'; recurrence_end_at: optional end for recurring

ALTER TABLE reminders ADD COLUMN recurrence_type VARCHAR(20) NOT NULL DEFAULT 'none';
ALTER TABLE reminders ADD COLUMN recurrence_end_at DATETIME NULL;
