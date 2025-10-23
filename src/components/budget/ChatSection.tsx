import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Send, Bot, User, Loader2, Paperclip } from 'lucide-react'
import { type ChatMessage } from '~/lib/ai-service'
import { formatFileSize, type UploadedFile } from '~/lib/file-upload'
import { cn } from '~/lib/utils'

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0 && onUploadFiles) {
      onUploadFiles(selectedFiles)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-600" />
            AI Assistant
          </CardTitle>
          {files.length > 0 && (
            <span className="text-sm text-gray-500">{files.length} files uploaded</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streamingMessage && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
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

              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-3',
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

        {/* File Attachments */}
        {files.length > 0 && (
          <div className="border-t p-4 bg-gray-50">
            <p className="text-xs font-medium text-gray-700 mb-2">Attached Files:</p>
            <div className="space-y-1">
              {files.slice(0, 3).map((file, index) => (
                <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                  <Paperclip className="w-3 h-3" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-gray-400">({formatFileSize(file.size)})</span>
                </div>
              ))}
              {files.length > 3 && (
                <p className="text-xs text-gray-500">+{files.length - 3} more files</p>
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        {onSendMessage && (
          <div className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.currentTarget
                const input = form.elements.namedItem('message') as HTMLInputElement
                if (input.value.trim() && !disabled) {
                  onSendMessage(input.value.trim())
                  input.value = ''
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
                  title="Upload additional files"
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
        )}
      </CardContent>
    </Card>
  )
}
