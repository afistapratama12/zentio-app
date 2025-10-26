import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Send,
  Bot,
  User,
  Loader2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Video,
  Check,
  X,
  PencilRulerIcon,
} from "lucide-react";
import { type ChatMessage } from "../../lib/ai-service";
import { formatFileSize, type UploadedFile } from "../../lib/file-upload";
import { cn } from "../../lib/utils";

interface ChatSectionProps {
  messages: ChatMessage[];
  onSendMessage?: (message: string) => void;
  onUploadFiles?: (files: File[]) => void;
  isStreaming?: boolean;
  streamingMessage?: string;
  files?: UploadedFile[];
  disabled?: boolean;
  hasPendingBudgetChange?: boolean;
  onApplyBudgetChange?: () => void;
  onRejectBudgetChange?: () => void;
}

export function ChatSection({
  messages,
  onSendMessage,
  onUploadFiles,
  isStreaming = false,
  streamingMessage = "",
  files = [],
  disabled = false,
  hasPendingBudgetChange = false,
  onApplyBudgetChange,
  onRejectBudgetChange,
}: ChatSectionProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [inputValue, setInputValue] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 192); // 192px = 8 lines * 24px
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...selectedFiles]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type === "csv" || type.includes("csv"))
      return <FileText className="w-4 h-4" />;
    if (type === "image" || type.startsWith("image/"))
      return <ImageIcon className="w-4 h-4" />;
    if (type === "video" || type.startsWith("video/"))
      return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

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
              {files.length} file{files.length > 1 ? "s" : ""} attached
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
                  <h3 className="font-semibold text-lg text-gray-700 mb-2">
                    AI Budget Assistant
                  </h3>
                  <p className="text-sm">
                    I&apos;ll help you create and optimize your budget plan.
                    <br />
                    Upload your transaction data to get started!
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => {
              const attachedFiles =
                (typeof message.content !== "string" &&
                  Array.isArray(message.content) &&
                  message.content.filter((c: any) => c.type === "image_url")) ||
                [];

              // Handle content - could be string, array of content parts, or array of {type, content}
              let contentParts: Array<{ type: 'text' | 'budget-change'; content: string }> = []

              const isLastIndex = index === messages.length - 1;

              if (typeof message.content === "string") {
                contentParts.push({ type: 'text', content: message.content })
              } else {
                if (message.role === 'user') {
                  // get rirst text
                  const messageText = message.content[0]
                  contentParts.push({
                    type: 'text',
                    content: messageText.text,
                  })
                } else {
                  contentParts = message.content as Array<{ type: 'text' | 'budget-change'; content: string }>
  
                  // remove \n in first text in last part
                  if (contentParts.length == 3) {
                    const lastPart = contentParts[2]
                    if (lastPart.type === 'text') {
                      if (lastPart.content.startsWith('\n\n')) {
                        lastPart.content = lastPart.content.slice(2)
                      } else if (lastPart.content.startsWith('\n')) {
                        lastPart.content = lastPart.content.slice(1)
                      }
                    }
  
                    contentParts[2] = lastPart
                  } 
                }
              }

              return (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-emerald-600" />
                    </div>
                  )}

                  <div className={cn("max-w-[80%] space-y-2")}>
                    {/* Show files attached to this message if it's the first user message with files */}
                    {message.role === "user" &&
                      index === 0 &&
                      files.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-2 space-y-1">
                          {files.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5"
                            >
                              {getFileIcon(file.type)}
                              <span className="flex-1 truncate font-medium">
                                {file.name}
                              </span>
                              <span className="text-gray-400 text-[10px]">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                    <div
                      className={cn(
                        "rounded-lg px-4 py-3",
                        message.role === "user"
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      { attachedFiles.length > 0 && (
                        <div className="flex flex-wrap mb-4 gap-2 justify-start flex-wrap">
                          {
                            attachedFiles.map((file: Record<string, any>, fileIdx: number) => (
                              <div
                                key={fileIdx}
                                className="w-1/4 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded p-2"
                              >
                                <div>
                                  {getFileIcon(file.image_url.type)}
                                </div>
                                <span className="max-w-[80px] truncate font-medium">
                                  {file.image_url.filename}
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      )}

                      {message.role === "assistant" ? (
                        <div className="space-y-4">
                          {contentParts.map((part, partIdx) => (
                            <div key={partIdx}>
                              {part.type === "text" ? (
                                <div className="text-sm whitespace-pre-wrap break-words">
                                  {part.content}
                                </div>
                              ) : (
                                <div className="flex flex-col items-start gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="cursor-default bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  >
                                    <PencilRulerIcon className="w-3 h-3 mr-2" /> 
                                    <span>Change budget</span>
                                  </Button>
                                  
                                  {hasPendingBudgetChange && isLastIndex && onApplyBudgetChange && onRejectBudgetChange && (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={onApplyBudgetChange}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                      >
                                        <Check className="w-4 h-4 mr-1" />
                                        Apply
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onRejectBudgetChange}
                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                      >
                                        <X className="w-4 h-4 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {contentParts.length > 0 && contentParts[0].type === 'text' 
                            ? contentParts[0].content 
                            : ''}
                        </div>
                      )}
                      {message.timestamp && (
                        <div
                          className={cn(
                            "text-xs mt-1",
                            message.role === "user"
                              ? "text-emerald-100"
                              : "text-gray-500"
                          )}
                        >
                          {new Date(message.timestamp).toLocaleTimeString(
                            "id-ID",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>
              );
            })}

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
                    <span className="text-xs text-gray-500">
                      AI is thinking...
                    </span>
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
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                    >
                      {getFileIcon(file.type)}
                      <span className="max-w-[120px] truncate">
                        {file.name}
                      </span>
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
                  e.preventDefault();
                  if (inputValue.trim() && !disabled) {
                    onSendMessage(inputValue.trim());
                    setInputValue("");
                    // Upload pending files if any
                    if (pendingFiles.length > 0 && onUploadFiles) {
                      onUploadFiles(pendingFiles);
                      setPendingFiles([]);
                    }
                  }
                }}
                className="flex gap-2 items-end"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept=".csv,image/*,video/*"
                  onChange={handleFileSelect}
                  disabled={disabled || isStreaming || hasPendingBudgetChange}
                />

                {onUploadFiles && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isStreaming || hasPendingBudgetChange}
                    title="Attach files"
                    className="hover:cursor-pointer flex-shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                )}

                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    // Submit on Enter (without Shift)
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (inputValue.trim() && !disabled && !isStreaming && !hasPendingBudgetChange) {
                        onSendMessage(inputValue.trim());
                        setInputValue("");
                        // Upload pending files if any
                        if (pendingFiles.length > 0 && onUploadFiles) {
                          onUploadFiles(pendingFiles);
                          setPendingFiles([]);
                        }
                      }
                    }
                    // Allow new line on Shift+Enter (default behavior)
                  }}
                  placeholder={
                    disabled
                      ? "Please generate budget first..."
                      : "Ask me anything about your budget... (Shift+Enter for new line)"
                  }
                  disabled={disabled || isStreaming || hasPendingBudgetChange}
                  className="flex-1 resize-none min-h-[44px] max-h-[192px] overflow-y-auto"
                  rows={1}
                />

                <Button
                  type="submit"
                  size="icon"
                  disabled={disabled || isStreaming || hasPendingBudgetChange || !inputValue.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
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
  );
}
