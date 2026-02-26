-- Team Flow Planner - Supabase Schema
-- Version 6.0 - Clean Slate (Drop & Recreate)
-- Execute this ENTIRE script in Supabase SQL Editor

-- ============================================
-- DROP OLD TABLES
-- ============================================

DROP TABLE IF EXISTS task_history CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS presence CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- CREATE NEW TABLES
-- ============================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(team_id, user_id)
);

CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'done')),
  deadline TIMESTAMP WITH TIME ZONE,
  assignee_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id) NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE task_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE presence (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_team_id ON tasks(team_id);
CREATE INDEX idx_tasks_is_private ON tasks(is_private);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);

-- ============================================
-- RLS POLICIES - SIMPLE, NO RECURSION
-- ============================================

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles view" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams view" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teams insert" ON teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Teams update" ON teams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Teams delete" ON teams FOR DELETE TO authenticated USING (true);

-- team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members view" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team members insert" ON team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team members delete" ON team_members FOR DELETE TO authenticated USING (true);

-- tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks view" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tasks insert" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Tasks update" ON tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Tasks delete" ON tasks FOR DELETE TO authenticated USING (true);

-- comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments view" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Comments insert" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comments delete" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- task_history
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Task history view" ON task_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Task history insert" ON task_history FOR INSERT TO authenticated WITH CHECK (true);

-- presence
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Presence view" ON presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Presence insert" ON presence FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Presence update" ON presence FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE presence;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE task_history;
