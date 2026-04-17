"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex items-center rounded-none border border-input bg-transparent focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupAddon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(
        "flex h-8 items-center px-2 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon };
