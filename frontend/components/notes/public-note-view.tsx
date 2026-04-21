"use client";

import { usePublicNote, useReplicateNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Plus, FileText, Share2, Sparkles, MessageSquare, ArrowRight, UserCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlateEditor } from "@/components/editor";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function PublicNoteView({ noteId }: { noteId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("shareToken") || undefined;
  
  const { data, isLoading, error } = usePublicNote(noteId, shareToken);
  const replicate = useReplicateNote();
  const [commentText, setCommentText] = useState("");

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 space-y-12 animate-pulse">
        <div className="space-y-4">
          <Skeleton className="h-16 w-3/4 rounded-2xl opacity-20" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full opacity-10" />
            <Skeleton className="h-6 w-32 rounded-full opacity-10" />
          </div>
        </div>
        <Skeleton className="h-[60vh] w-full rounded-3xl opacity-5" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background">
        <div className="size-20 rounded-3xl bg-destructive/5 flex items-center justify-center text-destructive mb-8">
          <Share2 className="size-10" />
        </div>
        <h1 className="text-3xl font-bold mb-3 tracking-tight">Access Restricted</h1>
        <p className="text-muted-foreground max-w-sm text-lg mb-10">This note is private, has been deleted, or the shared link has expired.</p>
        <Button variant="outline" className="rounded-2xl px-10 h-12 text-base font-semibold" onClick={() => router.push("/")}>Return Home</Button>
      </div>
    );
  }

  const handleReplicate = async () => {
    try {
      const result = await replicate.mutateAsync({
        title: data.note.title + " (Copy)",
        content: data.note.content,
        contentText: data.note.content_text || "",
      });
      router.push(`/notes/${result.id}`);
    } catch (e: any) {
      alert("Failed to copy note: " + e.message);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative flex flex-col min-h-screen bg-background selection:bg-primary/20 overflow-y-auto custom-scrollbar">
        {/* TOP NAVIGATION BAR */}
        <nav className="sticky top-0 z-50 w-full border-b border-border/5 bg-background/80 backdrop-blur-2xl">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push("/")}>
              <div className="bg-primary/10 p-2 rounded-xl text-primary group-hover:scale-110 transition-transform">
                <FileText className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 leading-none mb-1">Cortex Public</p>
                <h1 className="text-sm font-bold truncate max-w-[150px] sm:max-w-xs">{data.note.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-xl h-9 px-4 text-xs font-bold text-muted-foreground hover:text-foreground hidden sm:flex"
               >
                 <MessageSquare className="size-4 mr-2" />
                 Discuss
               </Button>
              <Button 
                size="sm" 
                className="rounded-xl h-9 px-5 font-bold shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all" 
                onClick={handleReplicate}
                disabled={replicate.isPending}
              >
                <Plus className="size-4 mr-2 stroke-[3]" />
                {replicate.isPending ? "Adding..." : "Add to Library"}
              </Button>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-16 pb-32">
          <header className="mb-16 space-y-6">
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold px-2.5 h-6 uppercase tracking-wider">Public Shared</Badge>
                <Badge variant="outline" className="border-border/40 text-muted-foreground/60 text-[10px] font-bold px-2.5 h-6 uppercase tracking-wider">Read Only</Badge>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">{data.note.title || "Untitled Document"}</h1>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/30">
               <div className="flex items-center gap-1.5">
                  <UserCircle className="size-3.5" />
                  <span>Author Content</span>
               </div>
               <span className="opacity-20">•</span>
               <span>Last updated {new Date(data.note.updated_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </header>

          <div className="relative">
            {/* The Editor */}
            <PlateEditor 
              content={data.note.content as any} 
              onChange={() => {}} 
              readOnly={true}
              variant="none"
              editorClassName="pb-20 text-lg md:text-xl leading-relaxed"
            />
            
            {/* Visual separator */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border/10 to-transparent my-20" />
            
            {/* COMMENTS SECTION */}
            <section id="comments" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
               <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground">
                    <MessageSquare className="size-5" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Discussions</h3>
                  <Badge variant="secondary" className="bg-muted/10 text-muted-foreground/40 font-bold ml-auto">0 Comments</Badge>
               </div>

               <div className="rounded-3xl border border-border/40 bg-card/30 p-1">
                  <textarea 
                    placeholder="Add your thoughts or questions about this note..."
                    className="w-full bg-transparent border-none focus:ring-0 p-6 text-base resize-none min-h-[120px] placeholder:text-muted-foreground/20"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="flex items-center justify-between p-3 border-t border-border/5 bg-muted/5 rounded-b-3xl">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 px-3">You must be signed in to comment</p>
                     <Button 
                        size="sm" 
                        className="rounded-xl h-8 px-4 font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all gap-2"
                        onClick={() => router.push("/auth/login")}
                     >
                        Post Comment
                        <ArrowRight className="size-3.5" />
                     </Button>
                  </div>
               </div>
            </section>
          </div>
        </main>

        {/* BOTTOM FLOATING ACTIONS */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 pointer-events-none">
          <div className="bg-card/40 backdrop-blur-3xl border border-white/5 p-2 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between gap-4 pointer-events-auto group animate-in slide-in-from-bottom-12 duration-1000">
            <div className="flex items-center gap-4 pl-4">
                <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="size-10 rounded-full border-4 border-[#121212] bg-muted flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-inner">
                             <UserCircle className="size-6 text-muted-foreground/30" />
                        </div>
                    ))}
                </div>
                <div className="hidden md:block">
                    <p className="text-[13px] font-bold leading-tight">Shared Workspace</p>
                    <p className="text-[11px] font-medium text-muted-foreground/60 leading-none">Clone this note to your library</p>
                </div>
            </div>
            <Button 
                className="rounded-[1.5rem] h-12 px-8 font-bold bg-white text-black hover:bg-primary hover:text-white shadow-xl hover:shadow-primary/40 transition-all gap-2" 
                onClick={handleReplicate}
                disabled={replicate.isPending}
            >
              {replicate.isPending ? "Cloning..." : "Get This Note"}
              <Sparkles className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
