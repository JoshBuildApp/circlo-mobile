import { useState, useCallback } from 'react'

export interface ToastMessage {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastMessage = { id, title, description, variant }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
    
    return { id }
  }, [])

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      setToasts(prev => prev.filter(t => t.id !== toastId))
    } else {
      setToasts([])
    }
  }, [])

  return {
    toast,
    dismiss,
    toasts
  }
}