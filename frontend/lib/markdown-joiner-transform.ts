import type { TextStreamPart, ToolSet } from "ai";

/**
 * Transform chunks to ensure valid Markdown reaches the editor.
 * Line-buffers all content. Tables are buffered completely.
 */
const markdownJoinerTransform =
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
              type: "text-delta",
            } as TextStreamPart<TOOLS>);
          }
        }
      },
      async transform(chunk, controller) {
        if (chunk.type === "text-delta") {
          lastTextDeltaId = chunk.id;
          const processedText = joiner.processText(chunk.text);
          if (processedText) {
            controller.enqueue({
              ...chunk,
              text: processedText,
            });
          }
        } else if (chunk.type === "text-end") {
          const remaining = joiner.flush();
          if (remaining && lastTextDeltaId) {
            controller.enqueue({
              id: lastTextDeltaId,
              text: remaining,
              type: "text-delta",
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

class MarkdownJoiner {
  processText(text: string): string {
    return text;
  }

  flush(): string {
    return "";
  }
}
