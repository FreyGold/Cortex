"use client";

import {
  CalendarDays,
  ChevronDown,
  Settings,
  UserCircle,
  Clock,
  Sparkles,
  Search,
  PanelLeftClose,
  LayoutDashboard,
  TrendingUp,
  Target,
  Database,
  SquarePen as NotePencil,
  ShieldCheck,
  History,
  ArrowLeft,
  Users,
  Wand2,
  GraduationCap,
  Settings2
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import React, { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useJoinedWorkspaces, useWorkspaces } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppSidebarProps {
  onToggle?: () => void;
  activeDailyTab?: string;
  onDailyTabChange?: (tab: string) => void;
  isOpen?: boolean;
}

export function AppSidebar({ onToggle, activeDailyTab, onDailyTabChange, isOpen = true }: AppSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const isDailyPage = pathname.startsWith("/daily");
  const isSettingsPage = pathname.startsWith("/settings");
  const currentTab = searchParams.get("tab") || "profile";

  const currentWorkspaceId = searchParams.get("workspaceId") || undefined;
  const { data: profileData } = useCurrentProfile();
  const { data: joinedWorkspaces } = useJoinedWorkspaces();
  const { data: ownedWorkspaces } = useWorkspaces();

  const profile = profileData?.profile;

  const activeWorkspaceName = useMemo(() => {
    if (!currentWorkspaceId) return "Home";
    const joined = joinedWorkspaces?.find((w: any) => w.id === currentWorkspaceId);
    if (joined) return joined.name;
    const owned = ownedWorkspaces?.find((w: any) => w.id === currentWorkspaceId);
    if (owned) return owned.name;
    return "Workspace";
  }, [currentWorkspaceId, joinedWorkspaces, ownedWorkspaces]);

  const updateUrl = (updates: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) p.set(key, value); else p.delete(key);
    });
    const newUrl = `${pathname}?${p.toString()}`;
    router.replace(newUrl);
  };

  const NavButton = ({ icon: Icon, label, onClick, active, variant = "default", className }: any) => (
    <button 
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all group select-none overflow-hidden",
            active 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
              : variant === "ghost" 
                ? "text-muted-foreground/50 hover:text-foreground hover:bg-accent/40"
                : "text-muted-foreground/70 hover:bg-accent/40 hover:text-foreground",
            className
        )}
    >
        <Icon className={cn("size-4 shrink-0 transition-colors", active ? "text-primary-foreground" : "text-muted-foreground/40 group-hover:text-muted-foreground")} />
        <span className="truncate flex-1 text-left">{label}</span>
    </button>
  );

  const navigateTo = (path: string, tab?: string) => {
    const workspaceId = searchParams.get("workspaceId");
    let url = path;
    const params = new URLSearchParams();
    if (workspaceId) params.set("workspaceId", workspaceId);
    if (tab) params.set("tab", tab);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    router.push(url);
  };

  return (
    <div className={cn(
        "flex flex-col h-full bg-sidebar select-none border-r border-border/5 overflow-x-hidden transition-all duration-300",
        isOpen ? "w-[260px]" : "w-0 opacity-0"
    )}>
      {/* Header / Workspace */}
      <div className="px-3 pt-6 pb-4">
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-accent/40 cursor-pointer transition-colors flex-1 min-w-0 border border-transparent hover:border-border/10">
                      <Avatar className="size-6 rounded-lg border border-border/10">
                          <AvatarImage src={(currentWorkspaceId ? joinedWorkspaces?.find((w: any) => w.id === currentWorkspaceId)?.avatar_url : profile?.avatar_url) || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{activeWorkspaceName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[13px] font-bold truncate tracking-tight">{activeWorkspaceName}</span>
                      <ChevronDown className="size-3 text-muted-foreground/30 ml-auto" />
                  </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 rounded-2xl p-2 shadow-2xl border-border/10">
                  <DropdownMenuItem className="rounded-xl gap-2 text-xs py-2" onClick={() => updateUrl({ workspaceId: undefined })}>
                      <UserCircle className="size-4" /> My Workspace
                  </DropdownMenuItem>
                  
                  {joinedWorkspaces && joinedWorkspaces.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="bg-border/5" />
                      <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">Shared Workspaces</div>
                      {joinedWorkspaces.map((w: any) => (
                        <DropdownMenuItem key={w.id} className="rounded-xl gap-2 text-xs py-2" onClick={() => updateUrl({ workspaceId: w.id })}>
                          <Avatar className="size-4 rounded-md">
                            <AvatarImage src={w.avatar_url || undefined} />
                            <AvatarFallback className="text-[8px]">{w.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {w.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}

                  <DropdownMenuSeparator className="bg-border/5" />
                  <DropdownMenuItem className="rounded-xl gap-2 text-xs py-2 text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => window.location.href = "/auth/logout/submit"}>
                      Logout
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
      </div>

      {/* Dynamic Content */}
      <div className="flex-1 px-3 space-y-8 mt-4 overflow-y-auto custom-scrollbar">
          {isDailyPage ? (
            <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-300">
               <NavButton 
                 variant="ghost" 
                 icon={ArrowLeft} 
                 label="Exit Tracker" 
                 onClick={() => navigateTo("/notes")} 
               />
               <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">Daily Track</div>
               <NavButton icon={CalendarDays} label="Calendar" onClick={() => onDailyTabChange?.("calendar")} active={activeDailyTab === "calendar"} />
               <NavButton icon={TrendingUp} label="Insights" onClick={() => onDailyTabChange?.("stats")} active={activeDailyTab === "stats"} />
               <NavButton icon={Target} label="Habits" onClick={() => onDailyTabChange?.("habits")} active={activeDailyTab === "habits"} />
               <NavButton icon={Search} label="Search" onClick={() => onDailyTabChange?.("search")} active={activeDailyTab === "search"} />
               <div className="pt-4 mt-4 border-t border-border/5">
                 <NavButton icon={Sparkles} label="Daily Assistant" onClick={() => onDailyTabChange?.("assistant")} active={false} />
               </div>
            </div>
          ) : isSettingsPage ? (
            <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-300">
                <NavButton 
                  variant="ghost" 
                  icon={ArrowLeft} 
                  label="Back to Hub" 
                  onClick={() => navigateTo("/notes")} 
                />
                <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">Configuration</div>
                <NavButton 
                  icon={UserCircle} 
                  label="Profile Settings" 
                  onClick={() => navigateTo("/settings", "profile")} 
                  active={currentTab === "profile"} 
                />
                <NavButton 
                  icon={Users} 
                  label="Workspace & Team" 
                  onClick={() => navigateTo("/settings", "team")} 
                  active={currentTab === "team"} 
                />
                <NavButton 
                  icon={Wand2} 
                  label="AI Integration" 
                  onClick={() => navigateTo("/settings", "ai")} 
                  active={currentTab === "ai"} 
                />
                <NavButton 
                  icon={GraduationCap} 
                  label="Academic Path" 
                  onClick={() => navigateTo("/settings", "academic")} 
                  active={currentTab === "academic"} 
                />
                <NavButton 
                  icon={Settings2} 
                  label="Preferences" 
                  onClick={() => navigateTo("/settings", "preferences")} 
                  active={currentTab === "preferences"} 
                />
            </div>
          ) : (
            <div className="space-y-1 animate-in fade-in duration-300">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">University Hub</div>
                <NavButton 
                  icon={NotePencil} 
                  label="Notes & Docs" 
                  onClick={() => navigateTo("/notes")} 
                  active={pathname.startsWith("/notes")} 
                />
                <NavButton 
                  icon={Database} 
                  label="Resources" 
                  onClick={() => navigateTo("/data")} 
                  active={pathname.startsWith("/data")} 
                />
                <NavButton 
                  icon={CalendarDays} 
                  label="Daily Track" 
                  onClick={() => navigateTo("/daily")} 
                  active={pathname.startsWith("/daily")} 
                />
                
                <div className="pt-6 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">Account</div>
                <NavButton 
                  icon={Settings} 
                  label="Settings" 
                  onClick={() => navigateTo("/settings")} 
                  active={pathname.startsWith("/settings")} 
                />
                {profile?.role === "admin" && (
                   <NavButton 
                     icon={ShieldCheck} 
                     label="Admin Panel" 
                     onClick={() => navigateTo("/admin")} 
                     active={pathname.startsWith("/admin")} 
                   />
                )}
            </div>
          )}
      </div>

      <div className="p-4 border-t border-border/5">
          <button 
            onClick={onToggle}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tighter text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            <PanelLeftClose className="size-3" /> Hide Sidebar
          </button>
      </div>
    </div>
  );
}
