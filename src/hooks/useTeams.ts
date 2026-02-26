"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Team, TeamMember, User, TeamRole } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Получаем команды, где пользователь является участником
      const { data: memberTeams, error } = await supabase
        .from('team_members')
        .select(`
          team:teams (
            id,
            name,
            description,
            owner_id,
            created_at,
            updated_at,
            owner:profiles!teams_owner_id_fkey (
              id,
              email,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const teamsList = memberTeams?.map(m => m.team) || [];
      setTeams(teamsList as unknown as Team[]);

      // Устанавливаем текущую команду (первую в списке)
      if (teamsList.length > 0 && !currentTeam) {
        setCurrentTeam(teamsList[0] as unknown as Team);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTeam]);

  const fetchMembers = useCallback(async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          joined_at,
          user:profiles!team_members_user_id_fkey (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      setMembers(data as unknown as TeamMember[]);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, []);

  const createTeam = useCallback(async (name: string, description: string = '') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Создаем команду
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name,
          description,
          owner_id: user.id,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Добавляем создателя как владельца
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      await fetchTeams();
      return { data: team, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Failed to create team') };
    }
  }, [fetchTeams]);

  const addMember = useCallback(async (teamId: string, userId: string, role: TeamRole = 'member') => {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
        });

      if (error) throw error;
      await fetchMembers(teamId);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to add member') };
    }
  }, [fetchMembers]);

  const removeMember = useCallback(async (teamId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
      await fetchMembers(teamId);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to remove member') };
    }
  }, [fetchMembers]);

  const deleteTeam = useCallback(async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      await fetchTeams();
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to delete team') };
    }
  }, [fetchTeams]);

  const inviteMember = useCallback(async (teamId: string, email: string) => {
    try {
      // Ищем пользователя по email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        return { error: new Error('User not found') };
      }

      // Проверяем, не является ли он уже участником
      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', profile.id)
        .single();

      if (existing) {
        return { error: new Error('User is already a member') };
      }

      return await addMember(teamId, profile.id);
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to invite member') };
    }
  }, [addMember]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (currentTeam) {
      fetchMembers(currentTeam.id);
    }
  }, [currentTeam, fetchMembers]);

  // Realtime подписка на изменения в команде
  useEffect(() => {
    if (!currentTeam) return;

    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`team-${currentTeam.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_members',
            filter: `team_id=eq.${currentTeam.id}`,
          },
          () => {
            fetchMembers(currentTeam.id);
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentTeam, fetchMembers]);

  return {
    teams,
    currentTeam,
    setCurrentTeam,
    members,
    loading,
    createTeam,
    addMember,
    removeMember,
    deleteTeam,
    inviteMember,
    refreshTeams: fetchTeams,
  };
}
