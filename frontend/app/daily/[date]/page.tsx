"use client";

import { useSearchParams, useParams } from "next/navigation";
import { DailyLogView } from "@/components/daily/daily-log-view";

export default function DailyDatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const date = params.date as string;
  const workspaceId = searchParams.get("workspaceId") || undefined;

  return (
    <div className="flex-1 overflow-hidden">
      <DailyLogView date={date} workspaceId={workspaceId} />
    </div>
  );
}
