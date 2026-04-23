'use client';

import * as React from 'react';

import { normalizeStaticValue } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';

import { EditorKit } from '@/components/editor/editor-kit';
import { SettingsDialog } from '@/components/editor/settings-dialog';
import { Editor, EditorContainer } from '@/components/ui/editor';

export interface PlateEditorProps {
  content?: any;
  onChange?: (value: any) => void;
  className?: string;
  editorClassName?: string;
  readOnly?: boolean;
  variant?: 'default' | 'demo' | 'fullWidth' | 'none';
}

export function PlateEditor({ 
  content, 
  onChange, 
  className, 
  editorClassName, 
  readOnly = false,
  variant = 'demo'
}: PlateEditorProps = {}) {
  const initialValue = Array.isArray(content) && content.length > 0 ? content : value;

  const editor = usePlateEditor({
    plugins: EditorKit,
    value: initialValue,
  });

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
