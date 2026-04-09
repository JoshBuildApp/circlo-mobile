import { useToast } from '@/hooks/use-toast'

export const useBookingToast = () => {
  const { toast } = useToast()

  const showBookingSuccess = (message: string = 'Booking confirmed successfully') => {
    toast({
      title: 'Success',
      description: message,
      variant: 'default'
    })
  }

  const showBookingError = (message: string = 'Failed to process booking') => {
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive'
    })
  }

  const showBookingCancelled = (message: string = 'Booking cancelled successfully') => {
    toast({
      title: 'Cancelled',
      description: message,
      variant: 'default'
    })
  }

  return {
    showBookingSuccess,
    showBookingError,
    showBookingCancelled
  }
}