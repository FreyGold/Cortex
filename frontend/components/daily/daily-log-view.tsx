"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useDailyLogDetail, useUpdateDailyLog, useCreateDailyTask, useUpdateDailyTask, useDeleteDailyTask, useCreateDailyLog } from "@/hooks/use-daily";
import { PlateEditor } from "@/components/editor";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X, Loader2, Sparkles, Smile, MessageSquare, History, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface DailyLogViewProps {
  date: string;
  workspaceId?: string;
  onClose?: () => void;
}

export function DailyLogView({ date, workspaceId, onClose }: DailyLogViewProps) {
  const { data, isLoading } = useDailyLogDetail(date, workspaceId);
  const updateLog = useUpdateDailyLog(data?.log?.id || "");
  const createTask = useCreateDailyTask();
  const updateTask = useUpdateDailyTask();
  const deleteTask = useDeleteDailyTask();

  const [newTaskText, setNewTaskText] = useState("");
  const [highlight, setHighlight] = useState("");
  const [editorContent, setEditorContent] = useState<any[] | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);

  const log = data?.log;

  useEffect(() => {
    if (log) {
      setHighlight(log.highlight || "");
      setEditorContent(log.content || [{ type: "p", children: [{ text: "" }] }]);
    }
  }, [log]);

  // Auto-save logic
  useEffect(() => {
    if (!isDirty || !log) return;
    const timer = setTimeout(() => {
      updateLog.mutate({
        highlight: highlight.trim() || null,
        content: editorContent,
      });
      setIsDirty(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [highlight, editorContent, isDirty, log, updateLog]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !log) return;
    createTask.mutate({ logId: log.id, text: newTaskText.trim() });
    setNewTaskText("");
  };

  const createLog = useCreateDailyLog();

  const handleStartLog = () => {
    createLog.mutate({ date, workspaceId });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground/20" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20 text-center">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
           <History className="size-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-xl font-bold mb-2">No record for this day</h3>
        <p className="text-muted-foreground max-w-xs mb-6">You haven't started tracking your productivity for this day yet.</p>
        <Button onClick={handleStartLog} disabled={createLog.isPending}>
          {createLog.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing...
            </>
          ) : (
            "Start Daily Log"
          )}
        </Button>
      </div>
    );
  }

  const completedTasks = log.tasks?.filter(t => t.is_completed).length || 0;
  const totalTasks = log.tasks?.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden min-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border/5 bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col">
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Daily Track</span>
              <span className="text-muted-foreground/20 text-lg">/</span>
              <h2 className="text-xl font-bold tracking-tight">{format(parseISO(date), "MMMM do, yyyy")}</h2>
           </div>
           <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] uppercase tracking-tighter h-5 px-1.5 font-bold pt-2">
                 {format(parseISO(date), "EEEE")}
              </Badge>
              {totalTasks > 0 && (
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                  {completedTasks}/{totalTasks} Tasks Completed ({Math.round(progress)}%)
                </span>
              )}
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto px-8 py-12 space-y-12">          
          {/* Highlight Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
               <Smile className="size-4" />
               <h3 className="text-xs font-bold uppercase tracking-widest">Main Highlight / Focus</h3>
            </div>
            <Input 
              value={highlight}
              onChange={(e) => { setHighlight(e.target.value); setIsDirty(true); }}
              placeholder="What's the one thing that defined this day?"
              className="text-2xl font-bold bg-transparent border-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/10"
            />
          </section>

          <Separator className="bg-border/5" />

          {/* Tasks Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                 <Plus className="size-4" />
                 <h3 className="text-xs font-bold uppercase tracking-widest">Daily Tasks & Routines</h3>
              </div>
              {progress === 100 && totalTasks > 0 && (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 px-2">
                   <Sparkles className="size-3" /> Perfect Day
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {log.tasks?.map((task) => (
                <div key={task.id} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors">
                  <Checkbox 
                    checked={task.is_completed} 
                    onCheckedChange={(checked) => updateTask.mutate({ taskId: task.id, payload: { is_completed: !!checked } })}
                    className="size-5 rounded-md"
                  />
                  <input 
                    value={task.text}
                    onChange={(e) => updateTask.mutate({ taskId: task.id, payload: { text: e.target.value } })}
                    className={cn(
                      "flex-1 bg-transparent border-none focus:outline-none text-[15px] font-medium leading-none",
                      task.is_completed && "text-muted-foreground/40 line-through transition-all"
                    )}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteTask.mutate(task.id)}
                    className="size-8 opacity-0 group-hover:opacity-100 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}

              <form onSubmit={handleAddTask} className="flex items-center gap-3 p-3 rounded-xl bg-accent/20 ring-1 ring-border/5 mt-4">
                 <div className="size-5 rounded-md border-2 border-dashed border-muted-foreground/20" />
                 <input 
                   value={newTaskText}
                   onChange={(e) => setNewTaskText(e.target.value)}
                   placeholder="Add a new task or routine..."
                   className="flex-1 bg-transparent border-none focus:outline-none text-[15px] font-medium placeholder:text-muted-foreground/30"
                 />
                 <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 font-bold text-[10px] uppercase tracking-tighter">
                   Add Task
                 </Button>
              </form>
            </div>
          </section>

          <Separator className="bg-border/5" />

          {/* Journaling Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                 <MessageSquare className="size-4" />
                 <h3 className="text-xs font-bold uppercase tracking-widest">Reflection & Notes</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditorMaximized(true)}
                className="size-8 text-muted-foreground/40 hover:text-foreground rounded-lg transition-colors"
              >
                <Maximize2 className="size-4" />
              </Button>
            </div>
            <div className="min-h-[600px]">
              <PlateEditor 
                content={editorContent}
                onChange={(val) => { setEditorContent(val); setIsDirty(true); }}
                editorClassName="text-lg leading-relaxed outline-none min-h-[600px]"
              />
            </div>
          </section>

          {/* Maximized Editor Modal */}
          <Dialog open={isEditorMaximized} onOpenChange={setIsEditorMaximized}>
            <DialogContent className="min-w-[80vw] w-full h-[90vh] gap-0 pt-0 p-0 overflow-hidden rounded-2xl border-border/10 shadow-2xl flex flex-col bg-background">
              <DialogTitle className="sr-only">Maximized Reflection Editor</DialogTitle>
              <div className="flex items-center justify-between px-8 py-4 border-b border-border/5 bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                   <MessageSquare className="size-4" />
                   <h3 className="text-xs font-bold uppercase tracking-widest">Journaling / {format(parseISO(date), "MMMM do, yyyy")}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsEditorMaximized(false)} className="rounded-full hover:bg-accent/50">
                  <X className="size-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar ">
                <div className="px-12">
                  <PlateEditor 
                    content={editorContent}
                    onChange={(val) => { setEditorContent(val); setIsDirty(true); }}
                    editorClassName="text-xl leading-relaxed outline-none min-h-[70vh] min-w-[75vh]"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
