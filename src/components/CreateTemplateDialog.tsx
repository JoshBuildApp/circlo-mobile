import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: string;
  rest?: number;
  notes?: string;
}

interface CreateTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (templateData: any) => void;
}

const categories = [
  "Strength Training",
  "Cardio",
  "HIIT",
  "Functional Training",
  "Flexibility",
  "Sports Specific",
  "Rehabilitation",
  "Bodybuilding",
  "Powerlifting",
  "CrossFit"
];

export function CreateTemplateDialog({
  isOpen,
  onClose,
  onSubmit,
}: CreateTemplateDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    duration: 60,
    difficulty_level: "intermediate",
    max_participants: 1,
    notes: "",
  });

  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "", sets: 3, reps: 10 }
  ]);

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: 10 }]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category) {
      return;
    }

    const validExercises = exercises.filter(ex => ex.name.trim());
    
    onSubmit({
      ...formData,
      exercises: validExercises,
    });

    // Reset form
    setFormData({
      name: "",
      description: "",
      category: "",
      duration: 60,
      difficulty_level: "intermediate",
      max_participants: 1,
      notes: "",
    });
    setExercises([{ name: "", sets: 3, reps: 10 }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Training Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Full Body Strength"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                min="15"
                max="180"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 1 })}
                min="1"
                max="20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the workout..."
              rows={3}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Exercises</CardTitle>
              <Button type="button" onClick={addExercise} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Exercise
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {exercises.map((exercise, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">Exercise {index + 1}</h4>
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Exercise Name</Label>
                      <Input
                        value={exercise.name}
                        onChange={(e) => updateExercise(index, 'name', e.target.value)}
                        placeholder="e.g., Push-ups"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Sets</Label>
                      <Input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Reps</Label>
                      <Input
                        type="number"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Weight (optional)</Label>
                      <Input
                        value={exercise.weight || ""}
                        onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                        placeholder="e.g., 50kg, bodyweight"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Rest (seconds)</Label>
                      <Input
                        type="number"
                        value={exercise.rest || ""}
                        onChange={(e) => updateExercise(index, 'rest', parseInt(e.target.value) || 0)}
                        placeholder="60"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Notes (optional)</Label>
                      <Input
                        value={exercise.notes || ""}
                        onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                        placeholder="Form tips, modifications..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="notes">Template Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="General notes about this template..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}