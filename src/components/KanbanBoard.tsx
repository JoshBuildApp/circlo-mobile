import React, { useState, useEffect } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { CreateTaskModal } from './CreateTaskModal';
import { useOptimisticTasks, Task } from '@/hooks/use-optimistic-tasks';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const KanbanBoard: React.FC = () => {
  const {
    tasks,
    isLoading,
    updateTaskStatusOptimistically,
    createTaskOptimistically,
    deleteTaskOptimistically,
    isPending,
    refreshTasks,
    setTasks,
  } = useOptimisticTasks();

  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const { toast } = useToast();

  // Load initial tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const { data, error } = await (supabase
          .from('tasks' as any)
          .select('*')
          .order('created_at', { ascending: false }) as any);

        if (error) throw error;
        setTasks((data || []) as Task[]);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        toast({
          title: 'Failed to load tasks',
          description: 'Please refresh the page to try again.',
          variant: 'destructive',
        });
      }
    };

    loadTasks();
  }, [setTasks, toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('Real-time task update:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setTasks(prev => {
                // Avoid duplicate if optimistic update already added it
                const exists = prev.some(task => task.id === payload.new.id);
                if (exists) return prev;
                return [payload.new as Task, ...prev];
              });
              break;
              
            case 'UPDATE':
              setTasks(prev =>
                prev.map(task =>
                  task.id === payload.new.id ? (payload.new as Task) : task
                )
              );
              break;
              
            case 'DELETE':
              setTasks(prev =>
                prev.filter(task => task.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setTasks]);

  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const doneTasks = tasks.filter(task => task.status === 'done');

  const handleAddTask = (status: 'todo' | 'in_progress' | 'done') => {
    setCreateModalStatus(status);
    setShowCreateModal(true);
  };

  const handleCreateTask = async (newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    await createTaskOptimistically(newTask);
    setShowCreateModal(false);
  };

  const handleDragEnter = (status: string) => {
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Task Board</h1>
        <Button
          variant="outline"
          onClick={refreshTasks}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onDragEnter={() => handleDragEnter('todo')}
          onDragLeave={handleDragLeave}
        >
          <KanbanColumn
            title="To Do"
            status="todo"
            tasks={todoTasks}
            onTaskStatusChange={updateTaskStatusOptimistically}
            onTaskDelete={deleteTaskOptimistically}
            onAddTask={handleAddTask}
            isPending={isPending}
            isDragOver={dragOverColumn === 'todo'}
          />
        </div>

        <div
          onDragEnter={() => handleDragEnter('in_progress')}
          onDragLeave={handleDragLeave}
        >
          <KanbanColumn
            title="In Progress"
            status="in_progress"
            tasks={inProgressTasks}
            onTaskStatusChange={updateTaskStatusOptimistically}
            onTaskDelete={deleteTaskOptimistically}
            onAddTask={handleAddTask}
            isPending={isPending}
            isDragOver={dragOverColumn === 'in_progress'}
          />
        </div>

        <div
          onDragEnter={() => handleDragEnter('done')}
          onDragLeave={handleDragLeave}
        >
          <KanbanColumn
            title="Done"
            status="done"
            tasks={doneTasks}
            onTaskStatusChange={updateTaskStatusOptimistically}
            onTaskDelete={deleteTaskOptimistically}
            onAddTask={handleAddTask}
            isPending={isPending}
            isDragOver={dragOverColumn === 'done'}
          />
        </div>
      </div>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTask={handleCreateTask}
        initialStatus={createModalStatus}
      />
    </div>
  );
};