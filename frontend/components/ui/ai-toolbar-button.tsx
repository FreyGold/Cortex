'use client';

import * as React from 'react';

import { AIChatPlugin } from '@platejs/ai/react';
import { useEditorPlugin, useEditorRef } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function AIToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const { api } = useEditorPlugin(AIChatPlugin);
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        editor.setOption(AIChatPlugin, 'open', true);
      }}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    />
  );
}
