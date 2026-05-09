"use client";

import React, { useState } from "react";
import { Sparkles, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

interface DailyAssistantProps {
  onClose: () => void;
}

export function DailyAssistant({ onClose }: DailyAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your Daily Assistant. I can help you reflect on your day, summarize your progress, or help you plan tomorrow. What's on your mind?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };
    
    setMessages([...messages, userMsg]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm currently being integrated with your daily logs. Soon I'll be able to analyze your tasks and provide deep insights!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/5 bg-sidebar/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Assistant</h3>
          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Beta
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-accent/50 size-8">
          <X className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}>
              <div className={cn(
                "size-8 rounded-full flex items-center justify-center shrink-0 border border-border/10",
                msg.role === "assistant" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {msg.role === "assistant" ? <Bot className="size-4" /> : <User className="size-4" />}
              </div>
              <div className={cn(
                "p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                msg.role === "assistant" ? "bg-accent/50 text-foreground" : "bg-primary text-primary-foreground"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/5">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center"
        >
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your day..."
            className="pr-12 bg-accent/20 border-none focus-visible:ring-1 ring-primary/20 h-10 rounded-xl text-xs"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 size-8 rounded-lg bg-primary hover:bg-primary/90 transition-all"
            disabled={!input.trim()}
          >
            <Send className="size-3" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground/30 mt-3 uppercase tracking-tighter font-medium">
          Powered by Cortex AI
        </p>
      </div>
    </div>
  );
}
