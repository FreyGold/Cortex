import type { TextStreamPart, ToolSet } from 'ai';

/**
 * Transform chunks to ensure valid Markdown reaches the editor.
 * Line-buffers all content. Tables are buffered completely.
 */
export const markdownJoinerTransform =
  <TOOLS extends ToolSet>() =>
  () => {
    const joiner = new MarkdownJoiner();
    let lastTextDeltaId: string | undefined;
    let textStreamEnded = false;

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      async flush(controller) {
        if (!textStreamEnded) {
          const remaining = joiner.flush();
          if (remaining && lastTextDeltaId) {
            controller.enqueue({
              id: lastTextDeltaId,
              text: remaining,
              type: 'text-delta',
            } as TextStreamPart<TOOLS>);
          }
        }
      },
      async transform(chunk, controller) {
        if (chunk.type === 'text-delta') {
          lastTextDeltaId = chunk.id;
          const processedText = joiner.processText(chunk.text);
          if (processedText) {
            controller.enqueue({
              ...chunk,
              text: processedText,
            });
            // Give Plate time to handle the new line
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
        } else if (chunk.type === 'text-end') {
          const remaining = joiner.flush();
          if (remaining && lastTextDeltaId) {
            controller.enqueue({
              id: lastTextDeltaId,
              text: remaining,
              type: 'text-delta',
            } as TextStreamPart<TOOLS>);
          }
          textStreamEnded = true;
          controller.enqueue(chunk);
        } else {
          controller.enqueue(chunk);
        }
      },
    });
  };

export class MarkdownJoiner {
  private lineBuffer = '';
  private tableBuffer: string[] = [];
  private isBufferingTable = false;

  /**
   * Always buffers until a full line (\n) is received.
   * If the line is a table row, it buffers the entire table.
   */
  processText(text: string): string {
    this.lineBuffer += text;
    let output = '';

    while (this.lineBuffer.includes('\n')) {
      const newlineIndex = this.lineBuffer.indexOf('\n');
      const line = this.lineBuffer.slice(0, newlineIndex + 1);
      this.lineBuffer = this.lineBuffer.slice(newlineIndex + 1);

      const trimmed = line.trim();
      const isTableRow = trimmed.startsWith('|');

      if (isTableRow) {
        this.isBufferingTable = true;
        this.tableBuffer.push(line);
      } else {
        // Line is NOT a table row. If we were buffering a table, it's over.
        if (this.isBufferingTable) {
          // Force Slate to treat this as an isolated block
          output += '\n\n' + this.tableBuffer.join('') + '\n\n';
          this.tableBuffer = [];
          this.isBufferingTable = false;
        }
        output += line;
      }
    }

    return output;
  }

  /**
   * Final flush of all buffers.
   */
  flush(): string {
    let output = '';
    
    if (this.tableBuffer.length > 0) {
      output += '\n\n' + this.tableBuffer.join('') + '\n\n';
      this.tableBuffer = [];
    }
    
    if (this.lineBuffer) {
      output += this.lineBuffer;
      this.lineBuffer = '';
    }
    
    return output;
  }
}
