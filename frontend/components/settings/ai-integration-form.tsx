"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Eye, EyeOff, Wand2Icon, Bot, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // Assistant Settings
  const [assistantApiKey, setAssistantApiKey] = useState("");
  const [assistantModel, setAssistantModel] = useState("google/gemini-2.0-flash");
  const [assistantProvider, setAssistantProvider] = useState("google");
  const [showAssistantKey, setShowAssistantKey] = useState(false);

  const [saving, setSaving] = useState(false);

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
      updateSettings({
        editorApiKey: editorApiKey || null,
        editorModel: editorModel || null,
        editorProvider: editorProvider,
        assistantApiKey: assistantApiKey || null,
        assistantModel: assistantModel || null,
        assistantProvider: assistantProvider,
      });

      toast.success("AI settings updated locally on this machine");
    } catch (err: any) {
      toast.error(err.message || "Failed to update AI settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

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
                <div className="space-y-2">
                  <Label htmlFor="editor-provider">Provider</Label>
                  <Select value={editorProvider} onValueChange={setEditorProvider}>
                    <SelectTrigger id="editor-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI / Compatible</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="groq">Groq (Ultra Fast)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editor-model">Model</Label>
                  <Select value={editorModel} onValueChange={setEditorModel}>
                    <SelectTrigger id="editor-model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <div className="space-y-2">
                  <Label htmlFor="assistant-provider">Provider</Label>
                  <Select value={assistantProvider} onValueChange={setAssistantProvider}>
                    <SelectTrigger id="assistant-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI / Compatible</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="groq">Groq (Ultra Fast)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assistant-model">Model</Label>
                  <Select value={assistantModel} onValueChange={setAssistantModel}>
                    <SelectTrigger id="assistant-model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving} size="lg">
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save All AI Settings
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
