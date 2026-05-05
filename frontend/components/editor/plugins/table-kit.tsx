'use client';

import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from '@platejs/table/react';
import { KEYS, NodeApi } from 'platejs';

import {
  TableCellElement,
  TableCellHeaderElement,
  TableElement,
  TableRowElement,
} from '@/components/ui/table-node';

export const TableKit = [
  TablePlugin.extend({
    options: {
      initialTableWidth: 0,
    },
    // @ts-ignore - Plate types might not include withOverrides directly in extend
    withOverrides: (editor: any) => {
      const { normalizeNode } = editor;

      editor.normalizeNode = (entry: any) => {
        const [node, path] = entry;

        const trType = editor.getType(KEYS.tr);
        const tdType = editor.getType(KEYS.td);
        const thType = editor.getType(KEYS.th);
        const tableType = editor.getType(KEYS.table);

        // Guard table rows: if a tr has no children array, insert a cell
        if (node.type === trType) {
          if (!node.children || !Array.isArray(node.children) || node.children.length === 0) {
            editor.tf.insertNodes(
              { type: tdType, children: [{ text: '' }] },
              { at: [...path, 0] }
            );
            return;
          }
        }

        // Guard table cells: if a td/th has no children, insert text.
        // Also proactively fix any broken sibling rows in the parent table,
        // because the internal normalizer calls computeCellIndices which
        // traverses ALL rows and crashes if any has missing children.
        if (node.type === tdType || node.type === thType) {
          if (!node.children || !Array.isArray(node.children) || node.children.length === 0) {
            editor.tf.insertNodes(
              { text: '' },
              { at: [...path, 0] }
            );
            return;
          }

          // Before the internal normalizer runs computeCellIndices on this cell,
          // ensure every row in the parent table has iterable children.
          try {
            const tablePath = path.slice(0, -2);
            const tableNode = NodeApi.get(editor, tablePath);
            if (tableNode && tableNode.type === tableType && Array.isArray(tableNode.children)) {
              for (let i = 0; i < tableNode.children.length; i++) {
                const row = tableNode.children[i];
                if (row && row.type === trType && (!row.children || !Array.isArray(row.children) || row.children.length === 0)) {
                  editor.tf.insertNodes(
                    { type: tdType, children: [{ text: '' }] },
                    { at: [...tablePath, i, 0] }
                  );
                  return; // re-normalize will pick up from here
                }
              }
            }
          } catch {
            // Ignore path errors during streaming
          }
        }

        normalizeNode(entry);
      };

      return editor;
    },
  }).withComponent(TableElement),
  TableRowPlugin.withComponent(TableRowElement),
  TableCellPlugin.withComponent(TableCellElement),
  TableCellHeaderPlugin.withComponent(TableCellHeaderElement),
];
