import * as React from 'react'
import { toast as sonnerToast } from 'sonner'

type ToastProps = {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

type ToastContextType = {
  toast: (props: ToastProps) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = React.useCallback((props: ToastProps) => {
    const message = props.description 
      ? `${props.title} - ${props.description}` 
      : props.title
    
    if (props.variant === 'destructive') {
      sonnerToast.error(message)
    } else {
      sonnerToast.success(message)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
