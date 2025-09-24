-- Seed data for Pleasant Cove Design
-- This creates sample companies and projects for testing

-- Insert sample companies
INSERT INTO companies (name, email, phone, address, city, state, industry, website, priority) VALUES
('Coastal Maine Restaurant', 'john@coastalmainerestaurant.com', '(207) 555-0123', '123 Harbor View Rd', 'Portland', 'ME', 'Restaurant', 'https://coastalmainerestaurant.com', 'high'),
('Portland Tech Solutions', 'sarah@portlandtech.com', '(207) 555-0456', '456 Innovation Way', 'Portland', 'ME', 'Technology', 'https://portlandtech.com', 'medium'),
('Maine Lobster Co.', 'mike@mainelobster.com', '(207) 555-0789', '789 Wharf St', 'Bar Harbor', 'ME', 'Seafood', 'https://mainelobster.com', 'high'),
('Green Mountain Wellness', 'lisa@greenmountainwellness.com', '(802) 555-0321', '321 Wellness Blvd', 'Burlington', 'VT', 'Healthcare', 'https://greenmountainwellness.com', 'medium'),
('Acadia Adventure Tours', 'tom@acadiaadventure.com', '(207) 555-0654', '654 Park Loop Rd', 'Bar Harbor', 'ME', 'Tourism', NULL, 'low')
ON CONFLICT (email) DO NOTHING;

-- Get company IDs for projects
WITH company_ids AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM companies
  WHERE email IN (
    'john@coastalmainerestaurant.com',
    'sarah@portlandtech.com',
    'mike@mainelobster.com',
    'lisa@greenmountainwellness.com',
    'tom@acadiaadventure.com'
  )
)
-- Insert projects for each company
INSERT INTO projects (
  company_id, 
  title, 
  type, 
  stage, 
  status,
  score,
  notes, 
  total_amount, 
  paid_amount,
  access_token,
  payment_status
) 
SELECT 
  c.id,
  CASE c.email
    WHEN 'john@coastalmainerestaurant.com' THEN 'Restaurant Website Redesign'
    WHEN 'sarah@portlandtech.com' THEN 'Tech Company Brand Identity'
    WHEN 'mike@mainelobster.com' THEN 'E-commerce Seafood Platform'
    WHEN 'lisa@greenmountainwellness.com' THEN 'Wellness Portal Development'
    WHEN 'tom@acadiaadventure.com' THEN 'Adventure Booking System'
  END,
  CASE c.email
    WHEN 'john@coastalmainerestaurant.com' THEN 'Website Design'
    WHEN 'sarah@portlandtech.com' THEN 'Branding'
    WHEN 'mike@mainelobster.com' THEN 'E-commerce'
    WHEN 'lisa@greenmountainwellness.com' THEN 'Web Application'
    WHEN 'tom@acadiaadventure.com' THEN 'Booking System'
  END,
  CASE c.email
    WHEN 'john@coastalmainerestaurant.com' THEN 'Development'
    WHEN 'sarah@portlandtech.com' THEN 'Design'
    WHEN 'mike@mainelobster.com' THEN 'Development'
    WHEN 'lisa@greenmountainwellness.com' THEN 'Planning'
    WHEN 'tom@acadiaadventure.com' THEN 'Discovery'
  END,
  'active',
  CASE c.email
    WHEN 'john@coastalmainerestaurant.com' THEN 85
    WHEN 'sarah@portlandtech.com' THEN 60
    WHEN 'mike@mainelobster.com' THEN 75
    WHEN 'lisa@greenmountainwellness.com' THEN 30
    WHEN 'tom@acadiaadventure.com' THEN 15
  END,
  CASE c.email
    WHEN 'john@coastalmainerestaurant.com' THEN 'Modern responsive design with online ordering integration'
    WHEN 'sarah@portlandtech.com' THEN 'Complete brand identity package including logo and guidelines'
    WHEN 'mike@mainelobster.com' THEN 'Full e-commerce platform with inventory management'
    WHEN 'lisa@greenmountainwellness.com' THEN 'Patient portal with appointment scheduling'
    WHEN 'tom@acadiaadventure.com' THEN 'Custom booking system for tours and activities'
  END,
  CASE c.email
    WHEN 'john@coastalmainerestaurant.com' THEN 4500
    WHEN 'sarah@portlandtech.com' THEN 3200
    WHEN 'mike@mainelobster.com' THEN 8500
    WHEN 'lisa@greenmountainwellness.com' THEN 6000
    WHEN 'tom@acadiaadventure.com' THEN 5500
  END,
  CASE c.email
    WHEN 'john@coastalmainerestaurant.com' THEN 2250
    WHEN 'sarah@portlandtech.com' THEN 1600
    WHEN 'mike@mainelobster.com' THEN 4250
    WHEN 'lisa@greenmountainwellness.com' THEN 0
    WHEN 'tom@acadiaadventure.com' THEN 0
  END,
  -- Generate unique access tokens
  CASE c.email
    WHEN 'john@coastalmainerestaurant.com' THEN 'tok_coastal_' || gen_random_uuid()::text
    WHEN 'sarah@portlandtech.com' THEN 'tok_portland_' || gen_random_uuid()::text
    WHEN 'mike@mainelobster.com' THEN 'tok_lobster_' || gen_random_uuid()::text
    WHEN 'lisa@greenmountainwellness.com' THEN 'tok_wellness_' || gen_random_uuid()::text
    WHEN 'tom@acadiaadventure.com' THEN 'tok_acadia_' || gen_random_uuid()::text
  END,
  CASE c.email
    WHEN 'john@coastalmainerestaurant.com' THEN 'partial'
    WHEN 'sarah@portlandtech.com' THEN 'partial'
    WHEN 'mike@mainelobster.com' THEN 'partial'
    WHEN 'lisa@greenmountainwellness.com' THEN 'pending'
    WHEN 'tom@acadiaadventure.com' THEN 'pending'
  END
FROM company_ids c
ON CONFLICT (access_token) DO NOTHING;

-- Add sample messages to the first project
WITH first_project AS (
  SELECT p.id 
  FROM projects p 
  JOIN companies c ON p.company_id = c.id 
  WHERE c.email = 'john@coastalmainerestaurant.com'
  LIMIT 1
)
INSERT INTO project_messages (project_id, sender_type, sender_name, content)
SELECT 
  fp.id,
  msg.sender_type,
  msg.sender_name,
  msg.content
FROM first_project fp
CROSS JOIN (VALUES
  ('admin', 'Sarah - Project Manager', 'Welcome to your project! We''re excited to work with you on your restaurant website redesign.'),
  ('client', 'John Smith', 'Thank you! Looking forward to seeing the designs.'),
  ('admin', 'Sarah - Project Manager', 'I''ve uploaded the initial wireframes for your review. Please let me know your thoughts!'),
  ('client', 'John Smith', 'The layout looks great! Can we add a section for daily specials?'),
  ('admin', 'Mike - Lead Designer', 'Absolutely! I''ll add a prominent daily specials section to the homepage.')
) AS msg(sender_type, sender_name, content);

-- Add sample files to projects
WITH project_files_data AS (
  SELECT 
    p.id as project_id,
    f.filename,
    f.file_url,
    f.file_size,
    f.mime_type,
    f.uploaded_by
  FROM projects p
  JOIN companies c ON p.company_id = c.id
  CROSS JOIN LATERAL (VALUES
    ('Website_Mockups_v2.pdf', '/files/mockups-v2.pdf', 2400000, 'application/pdf', 'Design Team'),
    ('Brand_Guidelines.pdf', '/files/brand-guidelines.pdf', 1800000, 'application/pdf', 'Design Team'),
    ('Content_Strategy.docx', '/files/content-strategy.docx', 450000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content Team')
  ) AS f(filename, file_url, file_size, mime_type, uploaded_by)
  WHERE c.email IN ('john@coastalmainerestaurant.com', 'mike@mainelobster.com')
)
INSERT INTO project_files (project_id, filename, file_url, file_size, mime_type, uploaded_by)
SELECT * FROM project_files_data;

-- Add sample progress entries
WITH project_progress AS (
  SELECT 
    p.id as project_id,
    pe.title,
    pe.description,
    pe.status
  FROM projects p
  JOIN companies c ON p.company_id = c.id
  CROSS JOIN LATERAL (VALUES
    ('Initial Consultation', 'Discuss project requirements and goals', 'completed'),
    ('Wireframe Design', 'Create initial layout and structure', 'completed'),
    ('Visual Design', 'Develop the look and feel', 'pending'),
    ('Development', 'Build the website functionality', 'pending'),
    ('Testing & Launch', 'Test and deploy the final site', 'pending')
  ) AS pe(title, description, status)
  WHERE c.email = 'john@coastalmainerestaurant.com'
)
INSERT INTO progress_entries (project_id, title, description, status)
SELECT * FROM project_progress;

-- Update project progress percentages based on milestones
UPDATE projects p
SET progress = (
  SELECT COALESCE(
    ROUND(
      (COUNT(CASE WHEN pe.status = 'completed' THEN 1 END)::numeric / 
       NULLIF(COUNT(*), 0)::numeric) * 100
    ), 
    0
  )
  FROM progress_entries pe
  WHERE pe.project_id = p.id
)
WHERE EXISTS (
  SELECT 1 FROM progress_entries pe WHERE pe.project_id = p.id
);

-- Add sample activities
INSERT INTO activities (type, description, company_id, project_id)
SELECT 
  a.type,
  a.description,
  c.id,
  p.id
FROM companies c
JOIN projects p ON p.company_id = c.id
CROSS JOIN (VALUES
  ('project_created', 'Project created'),
  ('payment_received', 'Initial payment received'),
  ('milestone_completed', 'Discovery phase completed')
) AS a(type, description)
WHERE c.email = 'john@coastalmainerestaurant.com'
LIMIT 3;

-- Output summary
SELECT 
  'Seed data created successfully!' as message,
  (SELECT COUNT(*) FROM companies) as companies_count,
  (SELECT COUNT(*) FROM projects) as projects_count,
  (SELECT COUNT(*) FROM project_messages) as messages_count,
  (SELECT COUNT(*) FROM project_files) as files_count;
