"use client";

import {
  ExternalLink,
  ChevronRight,
  FileText,
  FolderOpen,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

type DriveNode = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
};

type BrowseResponse = {
  node: DriveNode;
  isFolder: boolean;
  children: DriveNode[];
};

type DriveViewerDialogProps = {
  driveId: string;
  driveUrl: string | null;
  title: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerSize?: "default" | "sm" | "lg";
};

function isFolder(item: DriveNode) {
  return item.mimeType === FOLDER_MIME_TYPE;
}

function getPreviewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
}

async function fetchDriveNode(nodeId: string) {
  const response = await fetch(
    `/api/drive/browser?nodeId=${encodeURIComponent(nodeId)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as BrowseResponse | { error: string };

  if (!response.ok || "error" in payload) {
    throw new Error(
      "error" in payload ? payload.error : "Failed to load Drive content.",
    );
  }

  return payload;
}

export function DriveViewerDialog({
  driveId,
  driveUrl,
  title,
  triggerLabel,
  triggerVariant = "outline",
  triggerSize = "sm",
}: DriveViewerDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<DriveNode[]>([]);
  const [currentNode, setCurrentNode] = useState<DriveNode | null>(null);
  const [items, setItems] = useState<DriveNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<DriveNode | null>(null);

  const initialIsFolder = driveUrl?.includes("/folders/") ?? false;
  const label = triggerLabel ?? (initialIsFolder ? "Open folder" : "Open file");

  const loadNode = useCallback(
    async (nodeId: string, nextPath: DriveNode[] | null) => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchDriveNode(nodeId);
        setCurrentNode(data.node);

        if (data.isFolder) {
          setPath(nextPath ?? [data.node]);
          setItems(data.children);
          setSelectedFile(null);
        } else {
          setPath([]);
          setItems([]);
          setSelectedFile(data.node);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load Drive content.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      void loadNode(driveId, null);
      return;
    }

    setError(null);
    setPath([]);
    setCurrentNode(null);
    setItems([]);
    setSelectedFile(null);
    setLoading(false);
  };

  const handleFolderClick = (item: DriveNode) => {
    void loadNode(item.id, [...path, item]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const breadcrumb = path[index];
    if (!breadcrumb) return;
    const nextPath = path.slice(0, index + 1);
    void loadNode(breadcrumb.id, nextPath);
  };

  const showFolderBrowser = currentNode
    ? isFolder(currentNode)
    : initialIsFolder;
  const folderItems = items.filter((item) => isFolder(item));
  const fileItems = items.filter((item) => !isFolder(item));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className="gap-2">
          {initialIsFolder ? (
            <FolderOpen className="size-4" />
          ) : (
            <ExternalLink className="size-4" />
          )}
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="h-[90vh] w-[90vw] max-w-none gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="border-b border-border/70 bg-card px-4 py-3 text-card-foreground">
          <DialogTitle className="line-clamp-1 pr-10">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {showFolderBrowser
              ? "Browse folders and files without leaving the page."
              : "Preview file inside the modal."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-[calc(90vh-4.25rem)] items-center justify-center text-sm text-muted-foreground">
            Loading Drive content...
          </div>
        ) : error ? (
          <div className="flex h-[calc(90vh-4.25rem)] items-center justify-center px-6 text-center text-sm text-destructive">
            {error}
          </div>
        ) : showFolderBrowser ? (
          <div className="grid h-[calc(90vh-4.25rem)] grid-cols-[340px_1fr]">
            <div className="flex min-h-0 flex-col border-r border-border/70">
              <div className="flex flex-wrap items-center gap-1 border-b border-border/70 px-3 py-2">
                {path.map((crumb, index) => (
                  <button
                    key={crumb.id}
                    type="button"
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => handleBreadcrumbClick(index)}
                  >
                    {index > 0 ? <ChevronRight className="size-3" /> : null}
                    <span className="max-w-[180px] truncate">{crumb.name}</span>
                  </button>
                ))}
              </div>

              <div className="min-h-0 overflow-auto p-2">
                {folderItems.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    No subfolders in this level.
                  </p>
                ) : (
                  folderItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
                      onClick={() => handleFolderClick(item)}
                    >
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <FolderOpen className="size-4 text-muted-foreground" />
                        <span className="truncate text-sm">{item.name}</span>
                      </span>
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="min-h-0">
              <div className="grid h-full min-h-0 grid-rows-[220px_1fr]">
                <div className="min-h-0 border-b border-border/70">
                  <div className="border-b border-border/70 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Files in this folder
                    </p>
                  </div>
                  <div className="h-[calc(220px-2.25rem)] overflow-auto p-2">
                    {fileItems.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-muted-foreground">
                        No files in this folder.
                      </p>
                    ) : (
                      fileItems.map((file) => (
                        <button
                          key={file.id}
                          type="button"
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted ${
                            selectedFile?.id === file.id
                              ? "bg-muted font-medium"
                              : ""
                          }`}
                          onClick={() => setSelectedFile(file)}
                        >
                          <FileText className="size-4 text-muted-foreground" />
                          <span className="truncate">{file.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="min-h-0">
                  {selectedFile ? (
                    <div className="flex h-full min-h-0 flex-col">
                      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3 py-2">
                        <p className="line-clamp-1 text-sm font-medium">
                          {selectedFile.name}
                        </p>
                        {selectedFile.webViewLink ? (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={selectedFile.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open in Drive
                            </a>
                          </Button>
                        ) : null}
                      </div>
                      <iframe
                        src={getPreviewUrl(selectedFile.id)}
                        title={`Drive preview for ${selectedFile.name}`}
                        className="h-full w-full"
                        allow="autoplay"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                      Select a file from the files panel to preview it here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : selectedFile ? (
          <div className="flex h-[calc(90vh-4.25rem)] min-h-0 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3 py-2">
              <p className="line-clamp-1 text-sm font-medium">
                {selectedFile.name}
              </p>
              {selectedFile.webViewLink ? (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={selectedFile.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Drive
                  </a>
                </Button>
              ) : null}
            </div>
            <iframe
              src={getPreviewUrl(selectedFile.id)}
              title={`Drive preview for ${selectedFile.name}`}
              className="h-full w-full"
              allow="autoplay"
            />
          </div>
        ) : (
          <div className="flex h-[calc(90vh-4.25rem)] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Unable to load this Drive item.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
