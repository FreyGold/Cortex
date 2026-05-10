"use client";

import {
  ArrowRight,
  Copy,
  FileText,
  MessageSquare,
  Plus,
  Share2,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { PlateEditor } from "@/components/editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePublicNote, useReplicateNote } from "@/hooks/use-notes";
import { cn } from "@/lib/utils";

export function PublicNoteView({ noteId }: { noteId: string }) {
  const router = useRouter();

  const { data, isLoading, error } = usePublicNote(noteId);
  const replicate = useReplicateNote();
  const [commentText, setCommentText] = useState("");

  React.useEffect(() => {
    const handleAddQuote = (e: any) => {
      const text = e.detail?.text;
      if (text) {
        setCommentText((prev) => `> ${text}\n\n${prev}`);
      }
      const commentsSection = document.getElementById("comments");
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          const textarea = commentsSection.querySelector("textarea");
          if (textarea) {
            textarea.focus();
            textarea.classList.add("ring-2", "ring-primary/50");
            setTimeout(
              () => textarea.classList.remove("ring-2", "ring-primary/50"),
              2000,
            );
          }
        }, 500);
      }
    };
    window.addEventListener("add-note-comment", handleAddQuote);
    return () => window.removeEventListener("add-note-comment", handleAddQuote);
  }, []);

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
        <h1 className="text-3xl font-bold mb-3 tracking-tight">
          Access Restricted
        </h1>
        <p className="text-muted-foreground max-w-sm text-lg mb-10">
          This note is private, has been deleted, or the shared link has
          expired.
        </p>
        <Button
          variant="outline"
          className="rounded-2xl px-10 h-12 text-base font-semibold"
          onClick={() => router.push("/")}
        >
          Return Home
        </Button>
      </div>
    );
  }

  const handleReplicate = async () => {
    try {
      const result = await replicate.mutateAsync({
        title: data.note.title,
        content: data.note.content,
        contentText: data.note.content_text || "",
      });
      router.push(`/notes/${result.id}`);
    } catch (e: any) {
      alert("Error adding to library: " + e.message);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full overflow-y-auto custom-scrollbar bg-[#fbfbfa] dark:bg-[#0a0a0a]">
        {/* HERO HEADER */}
        <header className="relative w-full py-16 md:py-24 border-b border-border/5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,var(--primary-muted)/15%,transparent_70%)] pointer-events-none" />

          <div className="max-w-4xl mx-auto px-6 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-primary border-primary/20 rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  >
                    Public Note
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-muted/10 text-muted-foreground/60 border-none rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <FileText className="size-2.5" />
                    Read Only
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground leading-[1.1]">
                  {data.note.title}
                </h1>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  onClick={handleReplicate}
                  className="h-12 px-6 rounded-2xl gap-2 font-bold shadow-xl shadow-primary/20 group"
                  disabled={replicate.isPending}
                >
                  <Plus className="size-4 group-hover:rotate-90 transition-transform duration-300" />
                  {replicate.isPending ? "Adding..." : "Add to Library"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground/50 border-t border-border/5 pt-8">
              <div className="flex items-center gap-2">
                <UserCircle className="size-3.5" />
                <span>Author Content</span>
              </div>
              <span className="opacity-20">•</span>
              <span>
                Last updated{" "}
                {new Date(data.note.updated_at).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-12 px-6">
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
            <section
              id="comments"
              className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground">
                  <MessageSquare className="size-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  Discussions
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-muted/10 text-muted-foreground/40 font-bold ml-auto"
                >
                  0 Comments
                </Badge>
              </div>

              <div className="rounded-3xl border border-border/40 bg-card/30 p-1">
                <textarea
                  placeholder="Add your thoughts or questions about this note..."
                  className="w-full bg-transparent border-none focus:ring-0 p-6 text-base resize-none min-h-[120px] placeholder:text-muted-foreground/20"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="flex items-center justify-between p-3 border-t border-border/5 bg-muted/5 rounded-b-3xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 px-3">
                    You must be signed in to comment
                  </p>
                  <Button
                    size="sm"
                    className="h-9 px-5 rounded-xl font-bold gap-2"
                  >
                    Post Comment
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Floating Action for Replicate (Sticky on mobile) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 md:hidden">
          <Button
            onClick={handleReplicate}
            className="rounded-full h-14 px-8 shadow-2xl shadow-primary/40 font-bold gap-2"
            disabled={replicate.isPending}
          >
            <Plus className="size-5" />
            {replicate.isPending ? "Cloning..." : "Get This Note"}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
