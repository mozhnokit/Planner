"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Comment } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useComments(taskId: string | undefined) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!taskId) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      // Простой запрос без JOIN
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Загружаем профили пользователей отдельно
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);

      const commentsWithUsers = data.map(c => ({
        ...c,
        user: profilesData?.find(p => p.id === c.user_id) || undefined,
      }));

      setComments(commentsWithUsers as unknown as Comment[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();

    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`comments-${taskId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `task_id=eq.${taskId}`,
          },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              // Fetch the user data for the new comment
              const newComment = payload.new as Comment;
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, email, full_name, avatar_url')
                .eq('id', newComment.user_id)
                .single();
              
              setComments(prev => [...prev, { ...newComment, user: userData || undefined }]);
            } else if (payload.eventType === 'DELETE') {
              setComments(prev => prev.filter(c => c.id !== payload.old.id));
            }
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
  }, [taskId, fetchComments]);

  const addComment = async (content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error('Failed to add comment') };
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to delete comment') };
    }
  };

  return {
    comments,
    loading,
    addComment,
    deleteComment,
  };
}
