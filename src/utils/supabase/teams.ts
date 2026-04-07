import { createClient } from '@/utils/supabase/client';
import { Team, TeamMember, Profile, TeamRole } from '@/types';

const supabase = createClient();

export async function fetchUserTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*');

  if (error) {
    console.error('Error fetching teams:', error);
    return [];
  }

  return data || [];
}

export async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*, profile:profiles(*)')
    .eq('team_id', teamId);

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }

  return data || [];
}

export async function getUserRoleInTeam(teamId: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single();

  if (error) return null;
  return data.role;
}

export async function createNewTeam(name: string): Promise<Team | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Create the team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name: name, owner_id: user.id })
    .select()
    .single();

  if (teamError) {
    console.error('Error creating team:', teamError);
    return null;
  }

  // 2. Add creator as admin
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'admin'
    });

  if (memberError) {
    console.error('Error adding admin member:', memberError);
    return null;
  }

  return team;
}

export async function inviteMemberByEmail(teamId: string, email: string, role: TeamRole = 'member'): Promise<{ success: boolean; error?: string }> {
  // 1. Get profile ID by email using our SQL function
  const { data: profileId, error: profileError } = await supabase
    .rpc('get_profile_id_by_email', { p_email: email });

  if (profileError || !profileId) {
    return { success: false, error: 'Usuario no encontrado. Asegúrate de que el correo esté registrado en TaskZen.' };
  }

  // 2. Insert into team_members
  const { error: inviteError } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: profileId,
      role: role
    });

  if (inviteError) {
    if (inviteError.code === '23505') return { success: false, error: 'El usuario ya es miembro de este equipo.' };
    return { success: false, error: inviteError.message };
  }

  return { success: true };
}

export async function removeTeamMember(teamId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  return !error;
}

export async function updateMemberRole(teamId: string, userId: string, newRole: TeamRole): Promise<boolean> {
  const { error } = await supabase
    .from('team_members')
    .update({ role: newRole })
    .eq('team_id', teamId)
    .eq('user_id', userId);

  return !error;
}
