-- Migration: Add Conversation Threading Support
-- This migration adds support for organizing messages into conversation threads
-- within projects, making it easier to track different topics and discussions

-- 1. Create conversation threads table
CREATE TABLE IF NOT EXISTS conversation_threads (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
    category VARCHAR(100) DEFAULT 'general' CHECK (category IN ('general', 'support', 'billing', 'design_feedback', 'technical', 'content', 'other')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_by VARCHAR(50) NOT NULL CHECK (created_by IN ('admin', 'client')),
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add thread_id to project_messages
ALTER TABLE project_messages 
ADD COLUMN IF NOT EXISTS thread_id INTEGER REFERENCES conversation_threads(id) ON DELETE SET NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_threads_project_id ON conversation_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_status ON conversation_threads(status);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_category ON conversation_threads(category);
CREATE INDEX IF NOT EXISTS idx_project_messages_thread_id ON project_messages(thread_id);

-- 4. Create default threads for existing projects with messages
INSERT INTO conversation_threads (project_id, title, category, created_by)
SELECT DISTINCT 
    pm.project_id,
    'General Discussion',
    'general',
    'admin'
FROM project_messages pm
WHERE NOT EXISTS (
    SELECT 1 FROM conversation_threads ct 
    WHERE ct.project_id = pm.project_id
)
AND pm.project_id IS NOT NULL;

-- 5. Assign existing messages to default threads
UPDATE project_messages pm
SET thread_id = ct.id
FROM conversation_threads ct
WHERE pm.project_id = ct.project_id
AND pm.thread_id IS NULL
AND ct.title = 'General Discussion';

-- 6. Create function to update thread last_message_at
CREATE OR REPLACE FUNCTION update_thread_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversation_threads
    SET last_message_at = NEW.created_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to update thread timestamp on new message
DROP TRIGGER IF EXISTS update_thread_timestamp ON project_messages;
CREATE TRIGGER update_thread_timestamp
AFTER INSERT ON project_messages
FOR EACH ROW
WHEN (NEW.thread_id IS NOT NULL)
EXECUTE FUNCTION update_thread_last_message_at();

-- 8. Add thread summary view for easier querying
CREATE OR REPLACE VIEW thread_summary AS
SELECT 
    ct.id as thread_id,
    ct.project_id,
    ct.title,
    ct.status,
    ct.category,
    ct.priority,
    ct.created_by,
    ct.created_at,
    ct.last_message_at,
    p.title as project_title,
    p.access_token as project_token,
    c.name as company_name,
    COUNT(pm.id) as message_count,
    SUM(CASE WHEN pm.sender_type = 'client' AND pm.read_at IS NULL THEN 1 ELSE 0 END) as unread_count
FROM conversation_threads ct
JOIN projects p ON ct.project_id = p.id
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN project_messages pm ON ct.id = pm.thread_id
GROUP BY ct.id, p.id, c.id
ORDER BY ct.last_message_at DESC;
