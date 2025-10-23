import * as React from 'react'

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
    // Simple browser alert for now - can be replaced with a proper toast library
    const message = props.description 
      ? `${props.title}\n${props.description}` 
      : props.title
    
    if (props.variant === 'destructive') {
      alert(`❌ ${message}`)
    } else {
      alert(`✅ ${message}`)
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
