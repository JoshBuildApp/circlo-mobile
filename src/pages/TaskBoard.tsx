import React from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';

const TaskBoard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <KanbanBoard />
    </div>
  );
};

export default TaskBoard;