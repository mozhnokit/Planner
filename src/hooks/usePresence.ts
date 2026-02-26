"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Presence } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<(Presence & { user?: User })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from('presence')
          .select(`
            *,
            user:profiles!presence_user_id_fkey (
              id,
              email,
              full_name,
              avatar_url
            )
          `)
          .gte('last_seen', fiveMinutesAgo)
          .order('last_seen', { ascending: false });

        if (error) throw error;
        setOnlineUsers(data || []);
      } catch (error) {
        console.error('Error fetching presence:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();

    let channel: RealtimeChannel;

    const setupRealtime = () => {
      channel = supabase
        .channel('presence-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'presence',
          },
          () => {
            fetchOnlineUsers();
          }
        )
        .subscribe();
    };

    setupRealtime();

    const interval = setInterval(fetchOnlineUsers, 30000);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      clearInterval(interval);
    };
  }, []);

  return { onlineUsers, loading };
}
