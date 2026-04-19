"use client";

import { usePublicNote, useReplicateNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Plus, FileText, Share2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { NotionEditor } from "@/components/editor";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function PublicNoteView({ noteId }: { noteId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("shareToken") || undefined;
  
  const { data, isLoading, error } = usePublicNote(noteId, shareToken);
  const replicate = useReplicateNote();
  const [replicatedId, setReplicatedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 space-y-8 animate-pulse">
        <Skeleton className="h-12 w-2/3 rounded-xl" />
        <Skeleton className="h-[60vh] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-6">
          <Share2 className="size-10" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p className="text-muted-foreground max-w-sm">This note is private, has been deleted, or the shared link has expired.</p>
        <Button variant="outline" className="mt-8 rounded-full" onClick={() => router.push("/")}>Return Home</Button>
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
      setReplicatedId(result.id);
      router.push(`/notes/${result.id}`);
    } catch (e: any) {
      alert("Failed to copy note: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Top Banner Navigation */}
      <nav className="border-b border-border/40 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Public Shared Note</p>
              <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-sm">{data.note.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              size="sm" 
              className="rounded-full shadow-lg shadow-primary/20 group px-4" 
              onClick={handleReplicate}
              disabled={replicate.isPending}
            >
              <Plus className="size-3.5 mr-2 group-hover:rotate-90 transition-transform" />
              {replicate.isPending ? "Cloning..." : "Add to library"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-4xl mx-auto py-12 px-6 sm:px-12">
        <header className="mb-12 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground block">{data.note.title}</h2>
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground/60">
            <Badge variant="outline" className="bg-muted/30 border-none px-2 py-0.5 rounded-full">Read Only</Badge>
            <span>Updated {new Date(data.note.updated_at).toLocaleDateString()}</span>
          </div>
        </header>

        <div className="prose prose-invert max-w-none">
          <NotionEditor 
            content={data.note.content as any} 
            onChange={() => {}} 
            showToolbar={false}
            editorClassName="min-h-[60vh] pb-32"
          />

        </div>
      </main>

      {/* Bottom Floating CTA */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6">
        <div className="bg-card/80 backdrop-blur-2xl border border-border/40 p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="size-8 rounded-full border-2 border-background bg-muted-foreground/20" />
            ))}
          </div>
          <p className="text-xs font-medium flex-1">This note is shared with you. Want your own copy?</p>
          <Button variant="secondary" size="sm" className="rounded-xl h-9 whitespace-nowrap" onClick={handleReplicate}>
            Copy Note
          </Button>
        </div>
      </div>
    </div>
  );
}
