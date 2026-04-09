import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: File[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function ChatInput({
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 1000,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (isLoading) return;

    setIsLoading(true);
    try {
      await onSendMessage(message.trim(), attachments);
      setMessage("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2",
                "transition-all duration-200 hover:bg-gray-200 active:scale-[0.97]"
              )}
            >
              <span className="text-sm text-gray-700 truncate max-w-32">
                {file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className={cn(
                  "text-gray-500 hover:text-red-500 transition-colors duration-200",
                  "hover:scale-110 active:scale-95"
                )}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 transition-all duration-200",
            "hover:bg-gray-100 hover:brightness-105 active:scale-[0.97]"
          )}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            maxLength={maxLength}
            className={cn(
              "resize-none min-h-[44px] max-h-[120px] transition-all duration-200",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:opacity-50"
            )}
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {message.length}/{maxLength}
          </div>
        </div>

        {/* Emoji button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 transition-all duration-200",
            "hover:bg-gray-100 hover:brightness-105 active:scale-[0.97]"
          )}
          disabled={disabled || isLoading}
        >
          <Smile className="w-5 h-5" />
        </Button>

        {/* Send button */}
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={
            disabled ||
            isLoading ||
            (!message.trim() && attachments.length === 0)
          }
          className={cn(
            "shrink-0 transition-all duration-200",
            "hover:brightness-110 active:scale-[0.97]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,video/*,.pdf,.doc,.docx"
      />
    </div>
  );
}