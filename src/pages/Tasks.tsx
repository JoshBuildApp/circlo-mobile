import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar,
  User,
  Clock,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Circle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: {
    name: string;
    avatar: string;
  };
  dueDate?: string;
  tags: string[];
}

interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_completed' | 'comment_added' | 'status_changed';
  message: string;
  timestamp: string;
  user: {
    name: string;
    avatar: string;
  };
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: 'optimization' | 'reminder' | 'insight';
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Update coach profile',
    description: 'Add new certifications and update bio',
    status: 'todo',
    priority: 'high',
    assignee: {
      name: 'John Doe',
      avatar: '/avatars/01.png'
    },
    dueDate: '2024-01-20',
    tags: ['profile', 'urgent']
  },
  {
    id: '2',
    title: 'Review client feedback',
    description: 'Go through recent session feedback and address concerns',
    status: 'in-progress',
    priority: 'medium',
    assignee: {
      name: 'Jane Smith',
      avatar: '/avatars/02.png'
    },
    dueDate: '2024-01-22',
    tags: ['feedback', 'review']
  },
  {
    id: '3',
    title: 'Prepare training material',
    description: 'Create new workout plans for next week',
    status: 'review',
    priority: 'medium',
    tags: ['training', 'content']
  },
  {
    id: '4',
    title: 'Schedule team meeting',
    description: 'Organize monthly team sync',
    status: 'done',
    priority: 'low',
    assignee: {
      name: 'Mike Johnson',
      avatar: '/avatars/03.png'
    },
    tags: ['meeting', 'team']
  }
];

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'task_completed',
    message: 'completed "Schedule team meeting"',
    timestamp: '2 hours ago',
    user: {
      name: 'Mike Johnson',
      avatar: '/avatars/03.png'
    }
  },
  {
    id: '2',
    type: 'task_created',
    message: 'created "Update coach profile"',
    timestamp: '4 hours ago',
    user: {
      name: 'John Doe',
      avatar: '/avatars/01.png'
    }
  },
  {
    id: '3',
    type: 'status_changed',
    message: 'moved "Review client feedback" to In Progress',
    timestamp: '1 day ago',
    user: {
      name: 'Jane Smith',
      avatar: '/avatars/02.png'
    }
  }
];

const mockSuggestions: Suggestion[] = [
  {
    id: '1',
    title: 'Optimize workflow',
    description: 'Consider grouping similar tasks to improve efficiency',
    type: 'optimization'
  },
  {
    id: '2',
    title: 'Upcoming deadline',
    description: 'You have 3 tasks due this week',
    type: 'reminder'
  },
  {
    id: '3',
    title: 'Productivity insight',
    description: 'Your completion rate increased by 15% this month',
    type: 'insight'
  }
];

const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs px-2 py-0', priorityColors[task.priority])}>
              {task.priority}
            </Badge>
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {task.dueDate}
              </div>
            )}
          </div>
          
          {task.assignee && (
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar} />
              <AvatarFallback className="text-xs">
                {task.assignee.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const KanbanColumn: React.FC<{ 
  title: string; 
  status: Task['status']; 
  tasks: Task[];
  icon: React.ReactNode;
}> = ({ title, status, tasks, icon }) => {
  const filteredTasks = tasks.filter(task => task.status === status);

  return (
    <div className="flex-shrink-0 w-72 md:w-80">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {filteredTasks.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[calc(100vh-300px)] md:h-[calc(100vh-250px)]">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

const ActivitySidebar: React.FC = () => (
  <Card className="h-fit">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Recent Activity
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <ScrollArea className="h-64 md:h-80">
        <div className="space-y-3">
          {mockActivity.map((item) => (
            <div key={item.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={item.user.avatar} />
                <AvatarFallback className="text-xs">
                  {item.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{item.user.name}</span>{' '}
                  <span className="text-muted-foreground">{item.message}</span>
                </p>
                <p className="text-xs text-muted-foreground">{item.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
);

const SuggestionPanel: React.FC = () => {
  const suggestionIcons = {
    optimization: <Target className="h-4 w-4" />,
    reminder: <AlertCircle className="h-4 w-4" />,
    insight: <TrendingUp className="h-4 w-4" />
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {mockSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-2 mb-1">
                {suggestionIcons[suggestion.type]}
                <h5 className="font-medium text-sm">{suggestion.title}</h5>
              </div>
              <p className="text-xs text-muted-foreground">
                {suggestion.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const Tasks: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);

  const columns = [
    {
      title: 'To Do',
      status: 'todo' as const,
      icon: <Circle className="h-4 w-4" />
    },
    {
      title: 'In Progress',
      status: 'in-progress' as const,
      icon: <Clock className="h-4 w-4" />
    },
    {
      title: 'Review',
      status: 'review' as const,
      icon: <AlertCircle className="h-4 w-4" />
    },
    {
      title: 'Done',
      status: 'done' as const,
      icon: <CheckCircle2 className="h-4 w-4" />
    }
  ];

  const nextColumn = () => {
    setCurrentColumnIndex((prev) => 
      prev < columns.length - 1 ? prev + 1 : prev
    );
  };

  const prevColumn = () => {
    setCurrentColumnIndex((prev) => prev > 0 ? prev - 1 : prev);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage your coaching tasks and workflow
          </p>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile/Desktop Layout Toggle */}
      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="kanban">Board View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-0">
          {/* Desktop Kanban Board */}
          <div className="hidden md:block">
            <div className="flex gap-4 overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-fit">
                {columns.map((column) => (
                  <KanbanColumn
                    key={column.status}
                    title={column.title}
                    status={column.status}
                    tasks={mockTasks}
                    icon={column.icon}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Kanban Board with Navigation */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-lg">
                {columns[currentColumnIndex].title}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevColumn}
                  disabled={currentColumnIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentColumnIndex + 1} of {columns.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextColumn}
                  disabled={currentColumnIndex === columns.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="w-full">
              <KanbanColumn
                title={columns[currentColumnIndex].title}
                status={columns[currentColumnIndex].status}
                tasks={mockTasks}
                icon={columns[currentColumnIndex].icon}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {mockTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sidebar Layout */}
      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        {/* Activity - Hidden on mobile, shown in drawer on desktop */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <ActivitySidebar />
        </div>
        
        {/* Suggestions - Hidden on mobile, shown on tablet and up */}
        <div className="hidden sm:block lg:col-span-2 order-1 lg:order-2">
          <SuggestionPanel />
        </div>
      </div>

      {/* Mobile Suggestions in Collapsible Section */}
      <div className="sm:hidden mt-6">
        <details className="group">
          <summary className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer">
            <span className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              View Suggestions
            </span>
            <ChevronRight className="h-4 w-4 transform transition-transform group-open:rotate-90" />
          </summary>
          <div className="mt-4">
            <SuggestionPanel />
          </div>
        </details>
      </div>
    </div>
  );
};

export default Tasks;