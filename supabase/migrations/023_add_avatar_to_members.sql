-- Add avatar_url column to project_members table
-- This allows syncing user avatars to all their project memberships

ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_members_user_id 
ON project_members(user_id);
