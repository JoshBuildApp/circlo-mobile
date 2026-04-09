import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CommunityEmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export const CommunityEmptyState = ({ 
  title = "No community posts yet",
  description = "Be the first to share something with your community",
  actionLabel = "Create Post",
  onAction
}: CommunityEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      {onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}