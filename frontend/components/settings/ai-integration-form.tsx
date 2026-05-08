"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Eye, EyeOff, Wand2Icon, Bot, Cpu, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAISettings } from "@/hooks/use-ai-settings";
import { models } from "@/components/editor/settings-dialog";
import { toast } from "sonner";

export function AIIntegrationForm() {
  const { settings, updateSettings, isLoaded } = useAISettings();
  
  // Editor Settings
  const [editorApiKey, setEditorApiKey] = useState("");
  const [editorModel, setEditorModel] = useState("google/gemini-2.0-flash");
  const [editorProvider, setEditorProvider] = useState("google");
  const [showEditorKey, setShowEditorKey] = useState(false);
  const [openEditorModel, setOpenEditorModel] = useState(false);

  // Assistant Settings
  const [assistantApiKey, setAssistantApiKey] = useState("");
  const [assistantModel, setAssistantModel] = useState("google/gemini-2.0-flash");
  const [assistantProvider, setAssistantProvider] = useState("google");
  const [showAssistantKey, setShowAssistantKey] = useState(false);
  const [openAssistantModel, setOpenAssistantModel] = useState(false);

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setEditorApiKey(settings.editorApiKey ?? settings.aiApiKey ?? "");
      setEditorModel(settings.editorModel ?? settings.aiModel ?? "google/gemini-2.0-flash");
      setEditorProvider(settings.editorProvider ?? settings.aiProvider ?? "google");

      setAssistantApiKey(settings.assistantApiKey ?? settings.aiApiKey ?? "");
      setAssistantModel(settings.assistantModel ?? settings.aiModel ?? "google/gemini-2.0-flash");
      setAssistantProvider(settings.assistantProvider ?? settings.aiProvider ?? "google");
    }
  }, [isLoaded, settings]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simulate a small delay for better UX feel
      await new Promise(resolve => setTimeout(resolve, 600));

      updateSettings({
        editorApiKey: editorApiKey || null,
        editorModel: editorModel || null,
        editorProvider: editorProvider,
        assistantApiKey: assistantApiKey || null,
        assistantModel: assistantModel || null,
        assistantProvider: assistantProvider,
      });

      setLastSaved(new Date());
      setShowSuccess(true);
      toast.success("AI settings updated locally on this machine");
      
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (err: any) {
      toast.error(err.message || "Failed to update AI settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  const renderModelSelector = (
    value: string, 
    onValueChange: (val: string) => void, 
    open: boolean, 
    setOpen: (open: boolean) => void,
    id: string
  ) => {
    const selectedModel = models.find((m) => m.value === value) || models[0];

    return (
      <div className="group relative">
        <Label htmlFor={id} className="mb-2 block">Model</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger id={id} asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              <span className="truncate">
                {selectedModel ? selectedModel.label : "Select model..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command>
              <CommandInput placeholder="Search model..." />
              <CommandEmpty>No model found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {models.map((m) => (
                    <CommandItem
                      key={m.value}
                      value={m.value}
                      onSelect={() => {
                        onValueChange(m.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === m.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {m.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const renderProviderSelector = (value: string, onValueChange: (val: string) => void, id: string) => {
    // Keeping this as a standard Select as it has few items
    const providers = [
      { value: "google", label: "Google Gemini" },
      { value: "openai", label: "OpenAI / Compatible" },
      { value: "anthropic", label: "Anthropic Claude" },
      { value: "groq", label: "Groq (Ultra Fast)" },
    ];
    
    const selectedLabel = providers.find(p => p.value === value)?.label;

    return (
      <div className="space-y-2">
        <Label htmlFor={id}>Provider</Label>
        <Popover>
          <PopoverTrigger id={id} asChild>
            <Button variant="outline" className="w-full justify-between font-normal">
              {selectedLabel}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
             <div className="p-1">
               {providers.map((p) => (
                 <Button
                  key={p.value}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start font-normal",
                    value === p.value && "bg-accent"
                  )}
                  onClick={() => onValueChange(p.value)}
                 >
                   <Check className={cn("mr-2 h-4 w-4", value === p.value ? "opacity-100" : "opacity-0")} />
                   {p.label}
                 </Button>
               ))}
             </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-none border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Wand2Icon className="size-5" />
            </div>
            <CardTitle>AI Integration</CardTitle>
          </div>
          <CardDescription>
            Configure your personal AI keys and preferred models. These are stored **locally on your machine** and not in our database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-10">
            {/* Editor AI Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Cpu className="size-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Editor & Autocomplete</h3>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                {renderProviderSelector(editorProvider, setEditorProvider, "editor-provider")}
                {renderModelSelector(editorModel, setEditorModel, openEditorModel, setOpenEditorModel, "editor-model")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editor-api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="editor-api-key"
                    type={showEditorKey ? "text" : "password"}
                    value={editorApiKey}
                    onChange={(e) => setEditorApiKey(e.target.value)}
                    placeholder="Enter API key for editor"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full hover:bg-transparent"
                    onClick={() => setShowEditorKey(!showEditorKey)}
                  >
                    {showEditorKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Assistant AI Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Bot className="size-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">AI Assistant & Chat</h3>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                {renderProviderSelector(assistantProvider, setAssistantProvider, "assistant-provider")}
                {renderModelSelector(assistantModel, setAssistantModel, openAssistantModel, setOpenAssistantModel, "assistant-model")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistant-api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="assistant-api-key"
                    type={showAssistantKey ? "text" : "password"}
                    value={assistantApiKey}
                    onChange={(e) => setAssistantApiKey(e.target.value)}
                    placeholder="Enter API key for assistant"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full hover:bg-transparent"
                    onClick={() => setShowAssistantKey(!showAssistantKey)}
                  >
                    {showAssistantKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">
              {lastSaved && !saving && (
                <span className="text-xs text-muted-foreground italic">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <Button 
                type="submit" 
                disabled={saving} 
                size="lg"
                className={cn(
                  "min-w-[160px] transition-all duration-300",
                  showSuccess && "bg-green-600 hover:bg-green-700 text-white"
                )}
              >
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : showSuccess ? (
                  <Check className="mr-2 size-4" />
                ) : null}
                {saving ? "Saving..." : showSuccess ? "Saved!" : "Save All AI Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <p className="text-[11px] text-center text-muted-foreground">
        Your keys are stored in your browser's local storage and never sent to our servers except to proxy your AI requests.
      </p>
    </div>
  );
}
