import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | null;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

interface OptimisticUpdate {
  id: string;
  previousStatus: string;
  newStatus: string;
  timestamp: number;
}

export const useOptimisticTasks = (initialTasks: Task[] = []) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [pendingUpdates, setPendingUpdates] = useState<OptimisticUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updateTaskStatusOptimistically = useCallback(
    async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const previousStatus = task.status;
      const optimisticUpdate: OptimisticUpdate = {
        id: taskId,
        previousStatus,
        newStatus,
        timestamp: Date.now(),
      };

      // Optimistic update - immediately update UI
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? { ...t, status: newStatus, updated_at: new Date().toISOString() }
            : t
        )
      );

      setPendingUpdates(prev => [...prev, optimisticUpdate]);

      try {
        // Background DB update
        const { error } = await (supabase as any)
          .from('tasks')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (error) throw error;

        // Remove from pending updates on success
        setPendingUpdates(prev =>
          prev.filter(update => update.id !== taskId)
        );

      } catch (error) {
        console.error('Failed to update task status:', error);

        // Revert optimistic update on failure
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === taskId
              ? { ...t, status: previousStatus as Task['status'] }
              : t
          )
        );

        setPendingUpdates(prev =>
          prev.filter(update => update.id !== taskId)
        );

        toast({
          title: 'Update failed',
          description: 'Failed to update task status. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [tasks, toast]
  );

  const createTaskOptimistically = useCallback(
    async (newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      const optimisticTask: Task = {
        ...newTask,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic update
      setTasks(prevTasks => [...prevTasks, optimisticTask]);
      setIsLoading(true);

      try {
        const { data, error } = await (supabase as any)
          .from('tasks')
          .insert([{
            title: newTask.title,
            description: newTask.description ?? null,
            status: newTask.status,
            priority: newTask.priority ?? null,
            assigned_to: newTask.assigned_to ?? null,
            completed_at: newTask.completed_at ?? null,
          }])
          .select()
          .single();

        if (error) throw error;

        // Replace optimistic task with real task
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === optimisticTask.id
              ? {
                  ...(data as any),
                  status: (data as any).status as Task['status'],
                  priority: (data as any).priority as Task['priority'],
                }
              : t
          )
        );

      } catch (error) {
        console.error('Failed to create task:', error);

        // Remove optimistic task on failure
        setTasks(prevTasks =>
          prevTasks.filter(t => t.id !== optimisticTask.id)
        );

        toast({
          title: 'Creation failed',
          description: 'Failed to create task. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const deleteTaskOptimistically = useCallback(
    async (taskId: string) => {
      const taskToDelete = tasks.find(t => t.id === taskId);
      if (!taskToDelete) return;

      // Optimistic update
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));

      try {
        const { error } = await (supabase as any)
          .from('tasks')
          .delete()
          .eq('id', taskId);

        if (error) throw error;

      } catch (error) {
        console.error('Failed to delete task:', error);

        // Restore task on failure
        setTasks(prevTasks => [...prevTasks, taskToDelete]);

        toast({
          title: 'Deletion failed',
          description: 'Failed to delete task. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [tasks, toast]
  );

  const isPending = useCallback((taskId: string) => {
    return pendingUpdates.some(update => update.id === taskId);
  }, [pendingUpdates]);

  const refreshTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(
        (data || []).map((row: any) => ({
          ...row,
          status: row.status as Task['status'],
          priority: row.priority as Task['priority'],
        }))
      );
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh tasks. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    tasks,
    pendingUpdates,
    isLoading,
    updateTaskStatusOptimistically,
    createTaskOptimistically,
    deleteTaskOptimistically,
    isPending,
    refreshTasks,
    setTasks,
  };
};
