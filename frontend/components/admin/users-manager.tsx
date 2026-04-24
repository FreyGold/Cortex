"use client";

import { Search as MagnifyingGlass, UserCheck, UserMinus } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminUsers, useVerifyAdminUser } from "@/hooks/use-admin";

export function UsersManager() {
  const [queryDraft, setQueryDraft] = useState("");
  const [query, setQuery] = useState("");
  const usersQuery = useAdminUsers(query);
  const verifyMutation = useVerifyAdminUser();

  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data]);

  return (
    <Card className="shadow-none border-border/60">
      <CardHeader className="space-y-4">
        <CardTitle className="text-xl font-bold">User verification</CardTitle>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(queryDraft.trim());
          }}
        >
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={queryDraft}
              onChange={(event) => setQueryDraft(event.target.value)}
              placeholder="Search by name or email..."
              className="h-10 pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </CardHeader>
      <CardContent className="space-y-4">
        {usersQuery.isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {usersQuery.isError && (
          <p className="text-center py-4 text-sm text-destructive font-medium border border-destructive/20 bg-destructive/5 rounded-lg">
            {(usersQuery.error as Error).message}
          </p>
        )}

        <div className="grid gap-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">
                    {user.name ?? "Unnamed user"}
                  </p>
                  <Badge
                    variant={
                      user.is_verified
                        ? "success"
                        : user.verification_requested_at
                          ? "axon"
                          : "outline"
                    }
                    className="h-5 px-1.5 text-[10px] uppercase font-bold"
                  >
                    {user.is_verified
                      ? "Verified"
                      : user.verification_requested_at
                        ? "Requested"
                        : "Pending"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground tracking-tight">
                  {user.email ?? "No email"} <span className="mx-1 opacity-40">/</span> Role:{" "}
                  {user.role}
                </p>
                {user.verification_requested_at && !user.is_verified ? (
                  <p className="text-[11px] text-muted-foreground">
                    Requested{" "}
                    {new Date(
                      user.verification_requested_at,
                    ).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
              <Button
                size="sm"
                variant={user.is_verified ? "outline" : "default"}
                className="h-8 gap-1.5"
                disabled={verifyMutation.isPending}
                onClick={() =>
                  verifyMutation.mutate({
                    userId: user.id,
                    isVerified: !user.is_verified,
                  })
                }
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : user.is_verified ? (
                  <UserMinus className="size-3.5" />
                ) : (
                  <UserCheck className="size-3.5" />
                )}
                {user.is_verified ? "Unverify" : "Verify User"}
              </Button>
            </div>
          ))}
        </div>

        {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm text-muted-foreground">
              {query
                ? `No users matched "${query}".`
                : "No users available yet."}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
