import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Clock, Users } from "lucide-react";
import { useTrainingTemplates, type TrainingTemplate } from "@/hooks/use-training-templates";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { EditTemplateDialog } from "./EditTemplateDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface TrainingTemplatesProps {
  coachId: string;
  className?: string;
}

export function TrainingTemplates({ coachId, className }: TrainingTemplatesProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TrainingTemplate | null>(null);

  const { templates, loading, refresh } = useTrainingTemplates(coachId);

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    const { error } = await supabase.from("training_templates").delete().eq("id", templateId);
    if (error) {
      toast.error("Failed to delete template");
    } else {
      toast.success("Template deleted");
      refresh();
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader><div className="h-6 bg-secondary rounded w-1/3" /></CardHeader>
            <CardContent><div className="h-4 bg-secondary rounded w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Training Templates</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <div className="text-lg font-medium mb-2">No templates yet</div>
              <p className="mb-4">Create your first training template to save time.</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg line-clamp-1">{template.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {template.duration_minutes} min
                      <Users className="h-4 w-4 ml-2" />
                      {template.max_participants} max
                    </div>
                  </div>
                  <Badge variant="secondary">{template.training_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{template.description}</p>
                {template.price != null && (
                  <p className="text-sm font-semibold text-foreground mb-4">₪{template.price}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingTemplate(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteTemplate(template.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTemplateDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async () => { setIsCreateOpen(false); refresh(); }}
      />

      {editingTemplate && (
        <EditTemplateDialog
          template={editingTemplate}
          onClose={() => { setEditingTemplate(null); refresh(); }}
          onSubmit={async () => { setEditingTemplate(null); refresh(); }}
        />
      )}
    </div>
  );
}
