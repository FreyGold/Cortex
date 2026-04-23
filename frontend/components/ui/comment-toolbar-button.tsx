'use client';

import * as React from 'react';

import { MessageSquareTextIcon } from 'lucide-react';
import { useEditorRef, useEditorReadOnly } from 'platejs/react';

import { commentPlugin } from '@/components/editor/plugins/comment-kit';

import { ToolbarButton } from './toolbar';

export function CommentToolbarButton() {
  const editor = useEditorRef();
  const readOnly = useEditorReadOnly();

  return (
    <ToolbarButton
      onClick={() => {
        if (readOnly) {
          const selection = window.getSelection();
          const selectedText = selection?.toString();
          
          window.dispatchEvent(new CustomEvent("add-note-comment", {
            detail: { text: selectedText }
          }));
          return;
        }
        editor.getTransforms(commentPlugin).comment.setDraft();
      }}
      data-plate-prevent-overlay
      tooltip="Comment"
    >
      <MessageSquareTextIcon />
    </ToolbarButton>
  );
}
