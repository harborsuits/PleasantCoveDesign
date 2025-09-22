-- Pleasant Cove Design - Squarespace Client Module Database Schema

-- Link Squarespace members to projects
CREATE TABLE IF NOT EXISTS project_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  squarespace_member_id VARCHAR(255) UNIQUE,
  member_email VARCHAR(255),
  member_name VARCHAR(255),
  access_level VARCHAR(50) DEFAULT 'client',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project messages (chat)
CREATE TABLE IF NOT EXISTS project_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  sender VARCHAR(50), -- 'client' or 'team'
  sender_name VARCHAR(255),
  sender_email VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  order_index INTEGER,
  due_date DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project files
CREATE TABLE IF NOT EXISTS project_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  name VARCHAR(255),
  url TEXT,
  size INTEGER,
  type VARCHAR(100),
  uploaded_by VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project designs
CREATE TABLE IF NOT EXISTS project_designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  name VARCHAR(255),
  url TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Design feedback
CREATE TABLE IF NOT EXISTS design_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  design_id INTEGER REFERENCES project_designs(id),
  member_id VARCHAR(255),
  x_position FLOAT,
  y_position FLOAT,
  content TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add columns to projects table if they don't exist
-- Note: SQLite doesn't support "ADD COLUMN IF NOT EXISTS" so handle these separately
-- ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 0;
-- ALTER TABLE projects ADD COLUMN current_stage VARCHAR(50) DEFAULT 'Planning';
-- ALTER TABLE projects ADD COLUMN estimated_completion DATE;

-- Sample test data
INSERT INTO projects (id, name, companyId, status) 
VALUES (1, 'Bob''s Plumbing Website', 1, 'active')
ON CONFLICT DO NOTHING;

INSERT INTO project_members (project_id, squarespace_member_id, member_email, member_name)
VALUES (1, 'sq_member_12345', 'bob@bobsplumbing.com', 'Bob Smith')
ON CONFLICT DO NOTHING;

INSERT INTO project_milestones (project_id, title, description, status, order_index)
VALUES 
  (1, 'Discovery & Planning', 'Initial consultation and requirements gathering', 'completed', 1),
  (1, 'Design Phase', 'Create mockups and get approval', 'in_progress', 2),
  (1, 'Development', 'Build the website', 'pending', 3),
  (1, 'Testing & Launch', 'Test and deploy live', 'pending', 4)
ON CONFLICT DO NOTHING;

INSERT INTO project_messages (project_id, sender, sender_name, content)
VALUES 
  (1, 'team', 'Pleasant Cove Design', 'Welcome to your project workspace! Feel free to message us anytime.'),
  (1, 'client', 'Bob Smith', 'Thanks! Excited to get started.')
ON CONFLICT DO NOTHING;
