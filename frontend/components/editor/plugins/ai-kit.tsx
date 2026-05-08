'use client';

import cloneDeep from 'lodash/cloneDeep.js';
import { BaseAIPlugin, withAIBatch } from '@platejs/ai';
import {
  AIChatPlugin,
  AIPlugin,
  applyAISuggestions,
  getInsertPreviewStart,
  useChatChunk,
} from '@platejs/ai/react';
import { ElementApi, getPluginType, KEYS, PathApi } from 'platejs';
import { usePluginOption } from 'platejs/react';
import { deserializeMd } from '@platejs/markdown';

import { AILoadingBar, AIMenu } from '@/components/ui/ai-menu';
import { AIAnchorElement, AILeaf } from '@/components/ui/ai-node';

import { useChat } from '../use-chat';
import { CursorOverlayKit } from './cursor-overlay-kit';
import { MarkdownKit } from './markdown-kit';

const getNodeText = (node: any): string => {
  if (!node) return '';
  if (typeof node.text === 'string') return node.text;
  if (Array.isArray(node.children)) {
    return node.children.map(getNodeText).join('');
  }
  return '';
};

/**
 * Deeply rebuild every node to guarantee a valid `children` array.
 * @platejs/table's computeCellIndices iterates row.children without a null
 * check — if it's undefined the editor crashes mid-stream.
 */
const deepSanitizeNodes = (nodes: any[]): any[] => {
  if (!Array.isArray(nodes)) return [{ text: '' }];

  return nodes.map((node) => {
    if (typeof node !== 'object' || node === null) return { text: '' };
    if ('text' in node) return node;

    const rawChildren = Array.isArray(node.children) ? node.children : [];
    let children = deepSanitizeNodes(rawChildren);
    const type: string = node.type ?? '';

    if (type === 'tr') {
      const hasCells = children.some((c: any) => c.type === 'td' || c.type === 'th');
      if (!hasCells) children = [{ type: 'td', children: [{ text: '' }] }];
    } else if (type === 'td' || type === 'th') {
      if (children.length === 0) children = [{ text: '' }];
    } else if (type === 'table') {
      const hasRows = children.some((c: any) => c.type === 'tr');
      if (!hasRows) children = [{ type: 'tr', children: [{ type: 'td', children: [{ text: '' }] }] }];
      
      const colSizes: number[] = [];
      children.forEach((row: any) => {
        if (row.type === 'tr' && Array.isArray(row.children)) {
          row.children.forEach((cell: any, colIndex: number) => {
            const text = getNodeText(cell);
            // Estimate width: 8px per char + 32px padding. Min 120, Max 500
            const estimatedWidth = Math.min(500, Math.max(120, text.length * 8 + 32));
            if (!colSizes[colIndex] || estimatedWidth > colSizes[colIndex]) {
              colSizes[colIndex] = estimatedWidth;
            }
          });
        }
      });
      
      if (colSizes.length > 0 && !node.colSizes) {
        return { ...node, children, colSizes };
      }
    } else if (children.length === 0) {
      children = [{ text: '' }];
    }

    return { ...node, children };
  });
};

/**
 * Returns true when the node list contains a table whose rows are not yet
 * fully formed (e.g. a row with no cells). We skip inserting those mid-stream
 * to prevent computeCellIndices from crashing on undefined row.children.
 */
const hasIncompleteTable = (nodes: any[]): boolean => {
  for (const node of nodes) {
    if (typeof node !== 'object' || node === null || 'text' in node) continue;
    if (node.type === 'table') {
      const rows: any[] = Array.isArray(node.children) ? node.children : [];
      if (rows.length === 0) return true;
      for (const row of rows) {
        if (!row || row.type !== 'tr') return true;
        const cells: any[] = Array.isArray(row.children) ? row.children : [];
        if (cells.length === 0) return true;
      }
    }
    if (Array.isArray(node.children) && hasIncompleteTable(node.children)) return true;
  }
  return false;
};

export const aiChatPlugin = AIChatPlugin.extend({
  options: {
    chatOptions: {
      api: '/api/ai/command',
      body: {},
    },
    streaming: false,
    _blockChunks: '',
    _mdxName: null,
    toolName: null,
    chatSelection: null,
    _rawMarkdown: '',
    _blockPath: null,
    _lastInsertedLength: 1,
    _lastRenderTime: 0,
    chat: {
      messages: [],
      status: 'ready',
    } as any,
  },
  handlers: {
    onBlur: ({ editor }) => {
      const isOpen = editor.getOptions(AIChatPlugin).open;
      if (isOpen) {
        return true; // Prevent default blur behavior that might close the AI menu
      }
      return false;
    },
  },
  render: {
    afterContainer: AILoadingBar,
    afterEditable: AIMenu,
    node: AIAnchorElement,
  },
  shortcuts: {
    show: {
      keys: 'mod+j',
    },
  },
  useHooks: ({ editor, getOption }) => {
    useChat();

    const mode = usePluginOption(AIChatPlugin, 'mode');
    const toolName = usePluginOption(AIChatPlugin, 'toolName');

    let rawMarkdown = (editor.getOption(AIChatPlugin, '_rawMarkdown' as any) as string) || '';
    let lastInsertedLength = (editor.getOption(AIChatPlugin, '_lastInsertedLength' as any) as unknown as number) || 1;
    let lastRenderTime = (editor.getOption(AIChatPlugin, '_lastRenderTime' as any) as unknown as number) || 0;

    const renderMarkdown = (markdown: string) => {
      editor.tf.withoutSaving(() => {
        if (!getOption('streaming')) return;

        editor.tf.withScrolling(() => {
          editor.tf.withoutNormalizing(() => {
            const parsedNodes = deserializeMd(editor, markdown) as any[];
            const sanitizedNodes = deepSanitizeNodes(parsedNodes);

            if (hasIncompleteTable(sanitizedNodes)) return;
            
            const newNodes = sanitizedNodes ? sanitizedNodes.map(n => ({ ...n, [getPluginType(editor, KEYS.ai)]: true })) : [];
            const targetPath = editor.getOption(AIChatPlugin, '_blockPath');
            
            if (targetPath) {
              try {
                for (let i = 0; i < lastInsertedLength; i++) {
                  editor.tf.removeNodes({ at: targetPath });
                }
              } catch(e) {}
              
              if (newNodes.length > 0) {
                editor.tf.insertNodes(newNodes, { at: targetPath, select: true });
                lastInsertedLength = newNodes.length;
                editor.setOption(AIChatPlugin, '_lastInsertedLength' as any, lastInsertedLength);
              } else {
                 editor.tf.insertNodes({ children: [{ text: '' }], type: getPluginType(editor, KEYS.aiChat), [getPluginType(editor, KEYS.ai)]: true }, { at: targetPath, select: true });
                 lastInsertedLength = 1;
                 editor.setOption(AIChatPlugin, '_lastInsertedLength' as any, 1);
              }
            }
          });
        });
      });
    };

    useChatChunk({
      onChunk: ({ chunk, isFirst, nodes, text: content }) => {
        if (isFirst && mode === 'insert') {
          rawMarkdown = '';
          editor.setOption(AIChatPlugin, '_rawMarkdown' as any, '');
          editor.setOption(AIChatPlugin, '_lastInsertedLength' as any, 1);

          const { startBlock, startInEmptyParagraph } =
            getInsertPreviewStart(editor);

          editor.getTransforms(BaseAIPlugin).ai.beginPreview({
            originalBlocks:
              startInEmptyParagraph &&
              startBlock &&
              ElementApi.isElement(startBlock)
                ? [cloneDeep(startBlock)]
                : [],
          });

          editor.tf.withoutSaving(() => {
            editor.tf.insertNodes(
              {
                children: [{ text: '' }],
                type: getPluginType(editor, KEYS.aiChat),
              },
              {
                at: PathApi.next(editor.selection!.focus.path.slice(0, 1)),
              }
            );
            const newPath = editor.selection!.focus.path.slice(0, 1);
            editor.setOption(AIChatPlugin, '_blockPath' as any, newPath);
          });
          editor.setOption(AIChatPlugin, 'streaming', true);
        }

        if (mode === 'insert') {
          const newMarkdown = rawMarkdown + chunk;
          rawMarkdown = newMarkdown;
          editor.setOption(AIChatPlugin, '_rawMarkdown' as any, newMarkdown);
          
          const now = Date.now();
          // Use a very low throttle (32ms ~ 30fps) for smooth but controlled rendering
          if (!isFirst && now - lastRenderTime < 32) return;
          
          lastRenderTime = now;
          editor.setOption(AIChatPlugin, '_lastRenderTime' as any, now);
          
          renderMarkdown(newMarkdown);
        }

        if (toolName === 'edit' && mode === 'chat') {
          withAIBatch(
            editor,
            () => {
              applyAISuggestions(editor, content);
            },
            {
              split: isFirst,
            }
          );
        }
      },
      onFinish: () => {
        if (mode === 'insert' && rawMarkdown) {
          renderMarkdown(rawMarkdown);
        }
        editor.setOption(AIChatPlugin, 'streaming', false);
        editor.setOption(AIChatPlugin, '_blockChunks', '');
        editor.setOption(AIChatPlugin, '_blockPath' as any, null);
        editor.setOption(AIChatPlugin, '_mdxName', null);
        editor.setOption(AIChatPlugin, '_rawMarkdown' as any, '');
        editor.setOption(AIChatPlugin, '_lastInsertedLength' as any, 1);
        editor.setOption(AIChatPlugin, '_lastRenderTime' as any, 0);
      },
    });
  },
});

export const AIKit = [
  ...CursorOverlayKit,
  ...MarkdownKit,
  AIPlugin.withComponent(AILeaf),
  aiChatPlugin,
];
