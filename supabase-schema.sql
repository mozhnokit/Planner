-- Team Flow Planner - Supabase Schema
-- Execute this in Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Профили пользователей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Команды
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Участники команд
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(team_id, user_id)
);

-- Задачи
CREATE TABLE IF NOT EXISTS tasks (
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

-- Комментарии
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- История изменений
CREATE TABLE IF NOT EXISTS task_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Присутствие (онлайн статус)
CREATE TABLE IF NOT EXISTS presence (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_private ON tasks(is_private);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teams are viewable by members" ON teams;
CREATE POLICY "Teams are viewable by members" ON teams FOR SELECT TO authenticated USING (
  id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()) OR owner_id = auth.uid()
);
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
CREATE POLICY "Authenticated users can create teams" ON teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
CREATE POLICY "Team owners can update their teams" ON teams FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Team owners can delete their teams" ON teams;
CREATE POLICY "Team owners can delete their teams" ON teams FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team members are viewable by members" ON team_members;
CREATE POLICY "Team members are viewable by members" ON team_members FOR SELECT TO authenticated USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Team owners can manage members" ON team_members;
CREATE POLICY "Team owners can manage members" ON team_members FOR INSERT TO authenticated WITH CHECK (
  team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
);
DROP POLICY IF EXISTS "Team owners can remove members" ON team_members;
CREATE POLICY "Team owners can remove members" ON team_members FOR DELETE TO authenticated USING (
  team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
);

-- tasks (с поддержкой личных и командных задач)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tasks are viewable by authorized users" ON tasks;
CREATE POLICY "Tasks are viewable by authorized users" ON tasks FOR SELECT TO authenticated USING (
  (is_private = true AND created_by = auth.uid())
  OR (is_private = false AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))
  OR created_by = auth.uid()
);
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
CREATE POLICY "Authenticated users can create tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Authorized users can update tasks" ON tasks;
CREATE POLICY "Authorized users can update tasks" ON tasks FOR UPDATE TO authenticated USING (
  created_by = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Authorized users can delete tasks" ON tasks;
CREATE POLICY "Authorized users can delete tasks" ON tasks FOR DELETE TO authenticated USING (
  created_by = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments are viewable by authenticated users" ON comments;
CREATE POLICY "Comments are viewable by authenticated users" ON comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- task_history
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Task history is viewable by authenticated users" ON task_history;
CREATE POLICY "Task history is viewable by authenticated users" ON task_history FOR SELECT TO authenticated USING (true);

-- presence
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Presence is viewable by authenticated users" ON presence;
CREATE POLICY "Presence is viewable by authenticated users" ON presence FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert their own presence" ON presence;
CREATE POLICY "Users can insert their own presence" ON presence FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own presence" ON presence;
CREATE POLICY "Users can update their own presence" ON presence FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Авто-создание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Авто-обновление updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- REALTIME
-- ============================================

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE tasks; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE comments; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE presence; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE teams; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE team_members; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
