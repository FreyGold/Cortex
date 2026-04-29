"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Eye, EyeOff, Wand2Icon } from "lucide-react";
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
import { updateAISettings } from "@/lib/api/profile";
import { getAccessToken } from "@/lib/supabase/client";
import { models } from "@/components/editor/settings-dialog";
import { toast } from "sonner";

type AIIntegrationFormProps = {
  initialValues: {
    aiApiKey: string | null;
    aiModel: string | null;
    aiProvider: string | null;
  };
};

export function AIIntegrationForm({ initialValues }: AIIntegrationFormProps) {
  const [aiApiKey, setAiApiKey] = useState(initialValues.aiApiKey ?? "");
  const [aiModel, setAiModel] = useState(initialValues.aiModel ?? "google/gemini-2.5-flash");
  const [aiProvider, setAiProvider] = useState(initialValues.aiProvider ?? "openai");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Not authenticated");

      await updateAISettings(accessToken, {
        aiApiKey: aiApiKey || null,
        aiModel: aiModel || null,
        aiProvider: aiProvider || 'openai',
      });

      toast.success("AI settings updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update AI settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-none border-border/60">
      <CardHeader>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <Wand2Icon className="size-5" />
          </div>
          <CardTitle>AI Integration</CardTitle>
        </div>
        <CardDescription>
          Configure your personal AI keys and preferred models. These will be used across the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">AI Gateway / Provider API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="gsk_... or your gateway key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full hover:bg-transparent"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your key is stored securely and used only for your AI requests. Supports Groq (starting with gsk_), OpenAI, and more.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Preferred Model</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger id="model">
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

            <div className="space-y-2">
              <Label htmlFor="provider">Provider Type</Label>
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI / Compatible</SelectItem>
                  <SelectItem value="google">Google Gemini</SelectItem>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  <SelectItem value="groq">Groq (Ultra Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save AI Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
