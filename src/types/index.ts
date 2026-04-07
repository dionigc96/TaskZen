export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TeamRole = 'admin' | 'product_owner' | 'member';

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  parent_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  profile?: Profile;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
  due_date?: string | null;
  team_id?: string | null;
  assigned_to?: string | null;
  tags?: Tag[];
  assignee?: Profile | null;
}
