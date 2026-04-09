import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Task } from '@/hooks/use-optimistic-tasks';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  tasks: Task[];
  onTaskStatusChange: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
  onTaskDelete: (taskId: string) => void;
  onAddTask: (status: 'todo' | 'in_progress' | 'done') => void;
  isPending: (taskId: string) => boolean;
  isDragOver?: boolean;
  className?: string;
}

const statusColors = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  tasks,
  onTaskStatusChange,
  onTaskDelete,
  onAddTask,
  isPending,
  isDragOver = false,
  className,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.status !== status) {
      onTaskStatusChange(taskId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card
      className={cn(
        'h-fit min-h-[400px] transition-colors duration-200',
        isDragOver && 'ring-2 ring-blue-300 bg-blue-50/50',
        className
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <Badge
              variant="secondary"
              className={cn('text-xs px-2 py-0.5', statusColors[status])}
            >
              {tasks.length}
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddTask(status)}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
          >
            <TaskCard
              task={task}
              onStatusChange={onTaskStatusChange}
              onDelete={onTaskDelete}
              isPending={isPending(task.id)}
            />
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No tasks yet</p>
            <Button
              variant="ghost"
              onClick={() => onAddTask(status)}
              className="mt-2 text-xs"
            >
              Add your first task
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};