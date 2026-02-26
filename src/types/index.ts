export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  user?: User;
}

export interface Presence {
  user_id: string;
  user?: User;
  last_seen: string;
}

export type TeamRole = 'owner' | 'admin' | 'member';

export type TaskScope = 'personal' | 'team';

export interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner?: User;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  user?: User;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  deadline: string | null;
  assignee_id: string | null;
  created_by: string;
  team_id: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  team?: Team;
  assignee?: User;
  creator?: User;
}
