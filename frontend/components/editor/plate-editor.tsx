'use client';

import * as React from 'react';

import { normalizeStaticValue } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';

import { EditorKit } from '@/components/editor/editor-kit';
import { SettingsDialog } from '@/components/editor/settings-dialog';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { useCurrentProfile } from '@/hooks/use-profile';
import { useAISettings } from '@/hooks/use-ai-settings';
import { discussionPlugin } from '@/components/editor/plugins/discussion-kit';
import { aiChatPlugin } from '@/components/editor/plugins/ai-kit';
import { CopilotPlugin } from '@platejs/ai/react';

export interface PlateEditorProps {
  content?: any;
  onChange?: (value: any) => void;
  className?: string;
  editorClassName?: string;
  readOnly?: boolean;
  variant?: 'default' | 'demo' | 'fullWidth' | 'none';
}

export function PlateEditor(props: PlateEditorProps) {
  const { data: profileData, isLoading } = useCurrentProfile();

  if (isLoading) {
    return (
      <div className="flex w-full h-full min-h-[300px] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent opacity-50" />
      </div>
    );
  }

  return <PlateEditorInner {...props} profile={profileData?.profile} />;
}

function PlateEditorInner({
  content,
  onChange,
  className,
  editorClassName,
  readOnly = false,
  variant = 'demo',
  profile,
}: PlateEditorProps & { profile?: any }) {
  const { settings } = useAISettings();
  const initialValue = Array.isArray(content) && content.length > 0 ? content : value;

  const editor = usePlateEditor({
    plugins: EditorKit,
    value: initialValue,
    override: {
      plugins: {
        [aiChatPlugin.key]: {
          options: {
            chatOptions: {
              body: {
                apiKey: settings.aiApiKey,
                model: settings.aiModel,
              },
            },
          },
        },
        [CopilotPlugin.key]: {
          options: {
            completeOptions: {
              body: {
                apiKey: settings.aiApiKey,
                model: settings.aiModel,
              },
            },
          },
        },
        [discussionPlugin.key]: {
          options: {
            currentUserId: profile?.id ?? null,
            users: profile
              ? {
                  [profile.id]: {
                    id: profile.id,
                    avatarUrl: profile.avatar_url,
                    name: profile.name || 'Anonymous',
                  },
                }
              : {},
          },
        },
      },
    },
  });

  React.useEffect(() => {
    if (profile) {
      editor.setOption(discussionPlugin, 'currentUserId', profile.id);
      
      const currentUsers = editor.getOption(discussionPlugin, 'users') || {};
      editor.setOption(discussionPlugin, 'users', {
        ...currentUsers,
        [profile.id]: {
          id: profile.id,
          avatarUrl: profile.avatar_url,
          name: profile.name || 'Anonymous',
        }
      });
    }
  }, [profile, editor]);

  // Update AI settings from local storage
  React.useEffect(() => {
    if (settings.aiApiKey || settings.aiModel) {
      const chatOptions = editor.getOption(aiChatPlugin, 'chatOptions') || {};
      editor.setOption(aiChatPlugin, 'chatOptions', {
        ...chatOptions,
        body: {
          ...chatOptions?.body,
          apiKey: settings.aiApiKey || chatOptions?.body?.apiKey,
          model: settings.aiModel || chatOptions?.body?.model,
        }
      });

      const completeOptions = editor.getOption(CopilotPlugin, 'completeOptions') || {};
      editor.setOption(CopilotPlugin, 'completeOptions', {
        ...completeOptions,
        body: {
          ...completeOptions?.body,
          apiKey: settings.aiApiKey || completeOptions?.body?.apiKey,
          model: settings.aiModel || completeOptions?.body?.model,
        }
      });
    }
  }, [settings, editor]);

  return (
    <Plate editor={editor} onValueChange={({ value }) => onChange?.(value)} readOnly={readOnly}>
      <EditorContainer className={className} variant={variant === 'demo' ? 'demo' : variant === 'none' ? 'none' : 'default'}>
        <Editor variant={variant} className={editorClassName} disabled={readOnly} />
      </EditorContainer>

      <SettingsDialog />
    </Plate>
  );
}

const value = normalizeStaticValue([{ children: [{ text: '' }], type: 'p' }]);
