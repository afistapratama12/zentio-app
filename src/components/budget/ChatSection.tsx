import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Send, Bot, User, Loader2, Paperclip, FileText, Image as ImageIcon, Video } from 'lucide-react'
import { type ChatMessage } from '../../lib/ai-service'
import { formatFileSize, type UploadedFile } from '../../lib/file-upload'
import { cn } from '../../lib/utils'

interface ChatSectionProps {
  messages: ChatMessage[]
  onSendMessage?: (message: string) => void
  onUploadFiles?: (files: File[]) => void
  isStreaming?: boolean
  streamingMessage?: string
  files?: UploadedFile[]
  disabled?: boolean
}

export function ChatSection({
  messages,
  onSendMessage,
  onUploadFiles,
  isStreaming = false,
  streamingMessage = '',
  files = [],
  disabled = false,
}: ChatSectionProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...selectedFiles])
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (type: string) => {
    if (type === 'csv' || type.includes('csv')) return <FileText className="w-4 h-4" />
    if (type === 'image' || type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
    if (type === 'video' || type.startsWith('video/')) return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-6rem)] min-h-[720px]">
      <CardHeader className="border-b flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-600" />
            AI Assistant
          </CardTitle>
          {files.length > 0 && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              {files.length} file{files.length > 1 ? 's' : ''} attached
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Container with ScrollArea */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-4">
            {messages.length === 0 && !streamingMessage && (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-gray-500 space-y-4">
                <Bot className="w-16 h-16 text-gray-300" />
                <div>
                  <h3 className="font-semibold text-lg text-gray-700 mb-2">AI Budget Assistant</h3>
                  <p className="text-sm">
                    I'll help you create and optimize your budget plan.
                    <br />
                    Upload your transaction data to get started!
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-emerald-600" />
                  </div>
                )}

                <div className={cn('max-w-[80%] space-y-2')}>
                  {/* Show files attached to this message if it's the first user message with files */}
                  {message.role === 'user' && index === 0 && files.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-2 space-y-1">
                      {files.map((file, fileIndex) => (
                        <div key={fileIndex} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5">
                          {getFileIcon(file.type)}
                          <span className="flex-1 truncate font-medium">{file.name}</span>
                          <span className="text-gray-400 text-[10px]">{formatFileSize(file.size)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      'rounded-lg px-4 py-3',
                      message.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    {message.timestamp && (
                      <div
                        className={cn(
                          'text-xs mt-1',
                          message.role === 'user' ? 'text-emerald-100' : 'text-gray-500'
                        )}
                      >
                        {new Date(message.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming Message */}
            {isStreaming && streamingMessage && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 text-gray-900">
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {streamingMessage}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    <span className="text-xs text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Always at bottom */}
        {onSendMessage && (
          <div className="border-t flex-shrink-0 bg-white">
            {/* Pending files preview */}
            {pendingFiles.length > 0 && (
              <div className="px-4 pt-3 pb-2 border-b bg-gray-50">
                <div className="flex items-center gap-2 flex-wrap">
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
                      {getFileIcon(file.type)}
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        onClick={() => removePendingFile(index)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const form = e.currentTarget
                  const input = form.elements.namedItem('message') as HTMLInputElement
                  if (input.value.trim() && !disabled) {
                    onSendMessage(input.value.trim())
                    input.value = ''
                    // Upload pending files if any
                    if (pendingFiles.length > 0 && onUploadFiles) {
                      onUploadFiles(pendingFiles)
                      setPendingFiles([])
                    }
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept=".csv,image/*,video/*"
                  onChange={handleFileSelect}
                  disabled={disabled}
                />
                
                {onUploadFiles && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    title="Attach files"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                )}

                <Input
                  name="message"
                  placeholder={
                    disabled
                      ? 'Please generate budget first...'
                      : 'Ask me anything about your budget...'
                  }
                  disabled={disabled || isStreaming}
                  className="flex-1"
                />

                <Button
                  type="submit"
                  size="icon"
                  disabled={disabled || isStreaming}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
