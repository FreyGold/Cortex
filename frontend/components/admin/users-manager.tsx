"use client";

import { useMemo, useState } from "react";
import { useAdminUsers, useVerifyAdminUser } from "@/hooks/use-admin";
import { CortexButton } from "@/components/ui/cortex-button";
import {
  CortexCard,
  CortexCardContent,
  CortexCardHeader,
  CortexCardTitle,
} from "@/components/ui/cortex-card";

export function UsersManager() {
  const [queryDraft, setQueryDraft] = useState("");
  const [query, setQuery] = useState("");
  const usersQuery = useAdminUsers(query);
  const verifyMutation = useVerifyAdminUser();

  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data]);

  return (
    <CortexCard>
      <CortexCardHeader className="space-y-3">
        <CortexCardTitle>User verification</CortexCardTitle>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(queryDraft.trim());
          }}
        >
          <input
            value={queryDraft}
            onChange={(event) => setQueryDraft(event.target.value)}
            placeholder="Search by name"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <CortexButton type="submit" variant="outline" size="sm">
            Search
          </CortexButton>
        </form>
      </CortexCardHeader>
      <CortexCardContent className="space-y-3">
        {usersQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading users...</p> : null}
        {usersQuery.isError ? (
          <p className="text-sm text-destructive">
            {(usersQuery.error as Error).message}
          </p>
        ) : null}

        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
          >
            <div>
              <p className="text-sm font-semibold">{user.name ?? "Unnamed user"}</p>
              <p className="text-xs text-muted-foreground">
                {user.id} · role: {user.role}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {user.is_verified ? "Verified" : "Not verified"}
              </span>
              <CortexButton
                size="sm"
                variant={user.is_verified ? "outline" : "primary"}
                loading={verifyMutation.isPending}
                onClick={() =>
                  verifyMutation.mutate({
                    userId: user.id,
                    isVerified: !user.is_verified,
                  })
                }
              >
                {user.is_verified ? "Unverify" : "Verify"}
              </CortexButton>
            </div>
          </div>
        ))}

        {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found.</p>
        ) : null}
      </CortexCardContent>
    </CortexCard>
  );
}
