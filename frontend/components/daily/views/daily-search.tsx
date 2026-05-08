"use client";

import React, { useState, useEffect } from "react";
import { Search, Sparkles, Calendar, ArrowRight, History, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { useSearchDailyLogs } from "@/hooks/use-daily";
import { useDebounce } from "@/hooks/use-debounce";

export function DailySearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const searchMutation = useSearchDailyLogs();

  useEffect(() => {
    if (debouncedQuery.length > 2) {
      searchMutation.mutate(debouncedQuery);
    }
  }, [debouncedQuery]);

  const results = searchMutation.data?.results || [];
  const isSearching = searchMutation.isPending;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-background/50">
      <div className="max-w-4xl mx-auto space-y-12 pt-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-bold uppercase tracking-widest text-primary">
             <Sparkles className="size-3" /> Semantic Exploration
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Search your history</h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Find specific moments, tasks, or insights from your past daily logs using natural language.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-3xl opacity-0 group-focus-within:opacity-100 transition-all" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for 'the day I finished the project' or 'algorithms study'..."
            className="h-20 pl-16 pr-6 bg-card border-border/10 rounded-3xl shadow-xl text-xl focus-visible:ring-primary/10 relative z-10"
          />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 z-10" />
          {isSearching && (
             <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10">
                <div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
             </div>
          )}
        </div>

        {/* Suggestions / History */}
        {!query && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 text-center">Recent Searches</h3>
            <div className="flex flex-wrap justify-center gap-2">
               {["last week progress", "exam preparation", "project milestones", "meditation streak"].map((s, i) => (
                 <Button key={i} variant="outline" className="rounded-full h-8 px-4 text-xs bg-card/50 border-border/5 hover:bg-card">
                   {s}
                 </Button>
               ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Found {results.length} related moments</h3>
             </div>
             <div className="grid gap-4">
                {results.map((res) => (
                  <Card key={res.id} className="group border-border/5 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border/10 transition-all shadow-sm cursor-pointer overflow-hidden">
                    <CardContent className="p-0">
                       <div className="p-6 flex items-start gap-6">
                          <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                             <Calendar className="size-5 text-primary/40" />
                             <span className="text-[10px] font-bold text-muted-foreground/30">{format(parseISO(res.date), "MMM d")}</span>
                          </div>
                          <div className="flex-1 space-y-2">
                             <div className="flex items-center justify-between">
                                <h4 className="font-bold tracking-tight text-lg">{res.highlight}</h4>
                                <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-bold uppercase tracking-widest">
                                   {Math.round(res.similarity * 100)}% Match
                                </Badge>
                             </div>
                             <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                               {res.content_text || "No detailed notes found for this day."}
                             </p>
                             <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                   <History className="size-3" /> {format(parseISO(res.date), "yyyy")}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                   <MessageSquare className="size-3" /> Log Detail
                                </div>
                             </div>
                          </div>
                          <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <ArrowRight className="size-5 text-primary" />
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
