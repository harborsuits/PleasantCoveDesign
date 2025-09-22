import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Types
interface ConversationThread {
  id: number;
  projectId: number;
  title: string;
  status: 'active' | 'resolved' | 'archived';
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdBy: 'admin' | 'client';
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  unreadCount?: number;
}

interface ThreadMessage {
  id: number;
  threadId: number;
  content: string;
  senderName: string;
  senderType: 'admin' | 'client';
  attachments?: string[];
  readAt?: string;
  createdAt: string;
}

// Get all conversation threads for admin inbox
router.get('/api/admin/conversations', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('📬 [CONVERSATIONS] Fetching threaded conversations for admin...');
    
    // Query to get all threads with summary info
    const query = `
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
        c.email as company_email,
        COUNT(DISTINCT pm.id) as message_count,
        SUM(CASE WHEN pm.sender_type = 'client' AND pm.read_at IS NULL THEN 1 ELSE 0 END) as unread_count,
        MAX(pm.created_at) as last_message_time,
        (
          SELECT json_build_object(
            'id', last_msg.id,
            'content', last_msg.content,
            'senderName', last_msg.sender_name,
            'senderType', last_msg.sender_type,
            'createdAt', last_msg.created_at
          )
          FROM project_messages last_msg
          WHERE last_msg.thread_id = ct.id
          ORDER BY last_msg.created_at DESC
          LIMIT 1
        ) as last_message
      FROM conversation_threads ct
      JOIN projects p ON ct.project_id = p.id
      LEFT JOIN companies c ON p.company_id = c.id
      LEFT JOIN project_messages pm ON ct.id = pm.thread_id
      WHERE ct.status != 'archived'
      GROUP BY ct.id, p.id, c.id
      ORDER BY ct.last_message_at DESC
    `;
    
    const result = await storage.query(query);
    const threads = result.rows;
    
    console.log(`✅ [CONVERSATIONS] Found ${threads.length} conversation threads`);
    
    res.json({
      success: true,
      threads: threads
    });
    
  } catch (error) {
    console.error('❌ [CONVERSATIONS] Error fetching threads:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific thread
router.get('/api/threads/:threadId/messages', async (req: Request, res: Response) => {
  try {
    const threadId = parseInt(req.params.threadId);
    
    const query = `
      SELECT 
        pm.*,
        ct.project_id,
        p.access_token as project_token
      FROM project_messages pm
      JOIN conversation_threads ct ON pm.thread_id = ct.id
      JOIN projects p ON ct.project_id = p.id
      WHERE pm.thread_id = $1
      ORDER BY pm.created_at ASC
    `;
    
    const result = await storage.query(query, [threadId]);
    const messages = result.rows;
    
    res.json({
      success: true,
      messages: messages
    });
    
  } catch (error) {
    console.error('Error fetching thread messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a new conversation thread
router.post('/api/projects/:projectId/threads', requireAdmin, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { title, category = 'general', priority = 'normal' } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Thread title is required' });
    }
    
    const query = `
      INSERT INTO conversation_threads (project_id, title, category, priority, created_by)
      VALUES ($1, $2, $3, $4, 'admin')
      RETURNING *
    `;
    
    const result = await storage.query(query, [projectId, title, category, priority]);
    const thread = result.rows[0];
    
    console.log(`✅ Created new thread: ${title} for project ${projectId}`);
    
    res.json({
      success: true,
      thread: thread
    });
    
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// Send a message to a specific thread
router.post('/api/threads/:threadId/messages', async (req: Request, res: Response) => {
  try {
    const threadId = parseInt(req.params.threadId);
    const { content, senderName, senderType = 'admin', attachments = [] } = req.body;
    
    // First, get the project ID from the thread
    const threadQuery = `
      SELECT ct.*, p.access_token 
      FROM conversation_threads ct
      JOIN projects p ON ct.project_id = p.id
      WHERE ct.id = $1
    `;
    const threadResult = await storage.query(threadQuery, [threadId]);
    
    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    const thread = threadResult.rows[0];
    
    // Insert the message
    const messageQuery = `
      INSERT INTO project_messages (project_id, thread_id, sender_type, sender_name, content, attachments)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const messageResult = await storage.query(messageQuery, [
      thread.project_id,
      threadId,
      senderType,
      senderName,
      content,
      JSON.stringify(attachments)
    ]);
    
    const message = messageResult.rows[0];
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Emit to project room
      io.to(thread.access_token).emit('newMessage', {
        ...message,
        threadId: threadId,
        threadTitle: thread.title,
        projectToken: thread.access_token
      });
      
      // Emit to admin room
      io.to('admin-room').emit('newMessage', {
        ...message,
        threadId: threadId,
        threadTitle: thread.title,
        projectToken: thread.access_token
      });
    }
    
    res.json({
      success: true,
      message: message
    });
    
  } catch (error) {
    console.error('Error sending message to thread:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Update thread status
router.patch('/api/threads/:threadId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const threadId = parseInt(req.params.threadId);
    const { status, priority } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    
    if (priority) {
      updates.push(`priority = $${paramCount}`);
      values.push(priority);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(threadId);
    
    const query = `
      UPDATE conversation_threads
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await storage.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    res.json({
      success: true,
      thread: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating thread:', error);
    res.status(500).json({ error: 'Failed to update thread' });
  }
});

// Mark messages as read
router.post('/api/threads/:threadId/mark-read', async (req: Request, res: Response) => {
  try {
    const threadId = parseInt(req.params.threadId);
    const readAt = new Date().toISOString();
    
    const query = `
      UPDATE project_messages
      SET read_at = $1
      WHERE thread_id = $2 
      AND sender_type = 'client' 
      AND read_at IS NULL
      RETURNING id
    `;
    
    const result = await storage.query(query, [readAt, threadId]);
    const updatedIds = result.rows.map(row => row.id);
    
    // Emit read receipts via socket
    const io = req.app.get('io');
    if (io && updatedIds.length > 0) {
      io.to('admin-room').emit('messagesRead', {
        threadId: threadId,
        messageIds: updatedIds,
        readAt: readAt
      });
    }
    
    res.json({
      success: true,
      markedCount: updatedIds.length,
      messageIds: updatedIds
    });
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;
