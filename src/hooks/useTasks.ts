"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task, Priority, TaskStatus, User } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseTasksOptions {
  filter?: 'all' | 'my-tasks' | 'urgent';
  statusFilter?: TaskStatus[];
  priorityFilter?: Priority[];
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (options.filter === 'my-tasks') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq('assignee_id', user.id);
        }
      } else if (options.filter === 'urgent') {
        query = query.eq('priority', 'urgent');
      }

      if (options.statusFilter && options.statusFilter.length > 0) {
        query = query.in('status', options.statusFilter);
      }

      if (options.priorityFilter && options.priorityFilter.length > 0) {
        query = query.in('priority', options.priorityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [options.filter, options.statusFilter, options.priorityFilter]);

  useEffect(() => {
    fetchTasks();

    // Подписка на изменения в реальном времени
    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('tasks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setTasks(prev => [payload.new as Task, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setTasks(prev =>
                prev.map(task =>
                  task.id === payload.new.id ? { ...payload.new } as Task : task
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setTasks(prev => prev.filter(task => task.id !== payload.old.id));
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
  }, [fetchTasks]);

  const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...task,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Добавляем запись в историю
      await supabase.from('task_history').insert({
        task_id: data.id,
        user_id: user.id,
        action: 'created',
      });

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error('Failed to create task') };
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Добавляем запись в историю
      if (updates.status) {
        await supabase.from('task_history').insert({
          task_id: taskId,
          user_id: user.id,
          action: 'status_changed',
          old_value: data.status,
          new_value: updates.status,
        });
      }

      if (updates.priority) {
        await supabase.from('task_history').insert({
          task_id: taskId,
          user_id: user.id,
          action: 'priority_changed',
          old_value: data.priority,
          new_value: updates.priority,
        });
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error('Failed to update task') };
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to delete task') };
    }
  };

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
