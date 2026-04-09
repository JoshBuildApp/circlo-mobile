import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Clock, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Task } from '@/hooks/use-optimistic-tasks';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
  onDelete: (taskId: string) => void;
  isDragging?: boolean;
  isPending?: boolean;
  className?: string;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onDelete,
  isDragging = false,
  isPending = false,
  className,
}) => {
  return (
    <Card
      className={cn(
        'cursor-move transition-all duration-200 hover:shadow-md',
        isDragging && 'opacity-50 rotate-3 shadow-lg',
        isPending && 'opacity-75 border-blue-300 bg-blue-50/50',
        className
      )}
      data-task-id={task.id}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-semibold line-clamp-2">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onStatusChange(task.id, 'todo')}
                disabled={task.status === 'todo'}
              >
                Move to Todo
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange(task.id, 'in_progress')}
                disabled={task.status === 'in_progress'}
              >
                Move to In Progress
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange(task.id, 'done')}
                disabled={task.status === 'done'}
              >
                Move to Done
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.priority && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs px-2 py-0.5',
                  priorityColors[task.priority]
                )}
              >
                {task.priority}
              </Badge>
            )}
            
            {isPending && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 border-blue-300 text-blue-600">
                Updating...
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(task.updated_at).toLocaleDateString()}
          </div>
        </div>
        
        {task.assigned_to && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            Assigned
          </div>
        )}
      </CardContent>
    </Card>
  );
};