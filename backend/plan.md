# Editor Backend Plan (Nested Blocks + Collab)

## Goals
- Support **nested, component-like blocks** with drag-and-drop.
- Persist **collapsible** state and **text color** marks.
- Enable **real-time collaboration** and conflict-safe updates.

## Data Model
**blocks**
- `id` (UUID, PK)
- `document_id` (FK)
- `parent_id` (nullable FK → blocks.id)
- `type` (e.g., paragraph, heading, details, detailsSummary, detailsContent)
- `order_index` (float or int for ordering)
- `attrs` (JSONB for node attrs, e.g., level, alignment)
- `content_json` (JSONB for ProseMirror/Tiptap node content + marks)
- `collapsed` (boolean, default false)
- `created_at`, `updated_at`

**documents**
- `id`, `title`, `owner_id`, `created_at`, `updated_at`

**collab_updates**
- `id`, `document_id`, `yjs_update` (bytea/blob), `created_at`

## API
**GET /documents/:id**
- Returns full Tiptap JSON + block tree.

**PATCH /blocks/:id**
- Update `content_json`, `attrs`, or `collapsed`.

**POST /blocks/reorder**
- Payload: `{ blockId, newParentId, newIndex }`
- Server: move block and its subtree atomically.

**POST /blocks**
- Insert block at parent + index.

## Drag & Drop (Parent drags children)
- Treat each block as a **subtree**.
- On reorder, update `parent_id` and `order_index` for the block **only**; descendants keep relative order.
- Guard against **cycles** (no moving a node into its descendants).

## Collapsible Details
- `details` node → parent block with `collapsed` state.
- `detailsSummary` and `detailsContent` are children of the same parent.
- UI toggles `collapsed` via `PATCH /blocks/:id`.

## Text Colors
- Persist via `content_json.marks` (Tiptap `textStyle` + `color`).
- No separate table needed; the editor JSON is source of truth.

## Collaboration
- Use **Yjs** updates stored in `collab_updates`.
- On connect: merge latest Yjs update into doc, then stream deltas.
- Periodically snapshot latest `content_json` to `documents` for recovery.

## Notes
- Consider optimistic locking on blocks (`updated_at` check).
- Reorder operations should be transaction-wrapped.
