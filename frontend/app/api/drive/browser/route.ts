import { NextResponse } from "next/server";

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3/files";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

type DriveNode = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  size?: string;
  modifiedTime?: string;
};

function getApiKey() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_DRIVE_API_KEY is not configured.");
  }

  return apiKey;
}

async function fetchDriveJson<T>(url: URL): Promise<T> {
  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to fetch Google Drive data.");
  }

  return (await response.json()) as T;
}

async function fetchDriveNode(nodeId: string, apiKey: string) {
  const url = new URL(`${DRIVE_API_BASE}/${encodeURIComponent(nodeId)}`);
  url.searchParams.set(
    "fields",
    "id,name,mimeType,webViewLink,iconLink,size,modifiedTime",
  );
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("key", apiKey);

  return fetchDriveJson<DriveNode>(url);
}

async function fetchFolderChildren(folderId: string, apiKey: string) {
  const url = new URL(DRIVE_API_BASE);
  url.searchParams.set("q", `'${folderId}' in parents and trashed = false`);
  url.searchParams.set(
    "fields",
    "files(id,name,mimeType,webViewLink,iconLink,size,modifiedTime)",
  );
  url.searchParams.set("orderBy", "folder,name");
  url.searchParams.set("pageSize", "200");
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("includeItemsFromAllDrives", "true");
  url.searchParams.set("key", apiKey);

  const result = await fetchDriveJson<{ files?: DriveNode[] }>(url);
  return result.files ?? [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get("nodeId")?.trim();

    if (!nodeId) {
      return NextResponse.json(
        { error: "nodeId is required." },
        { status: 400 },
      );
    }

    const apiKey = getApiKey();
    const node = await fetchDriveNode(nodeId, apiKey);
    const isFolder = node.mimeType === FOLDER_MIME_TYPE;
    const children = isFolder ? await fetchFolderChildren(nodeId, apiKey) : [];

    return NextResponse.json({
      node,
      isFolder,
      children,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to browse Google Drive.",
      },
      { status: 500 },
    );
  }
}
