import React from "react";
import { cn } from "@/lib/utils";

interface CortexCardProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: "flat" | "card" | "modal" | "brand";
  children: React.ReactNode;
}

const levelStyles = {
  flat: "border border-border",
  card: "border border-border shadow-card",
  modal: "border border-border shadow-modal",
  brand: "border-2 border-brand shadow-brand",
};

export const CortexCard = React.forwardRef<HTMLDivElement, CortexCardProps>(
  ({ className, level = "card", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[0.75rem] bg-card text-card-foreground overflow-hidden",
          levelStyles[level],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CortexCard.displayName = "CortexCard";

export function CortexCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
      {...props}
    />
  );
}

export function CortexCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-title", className)}
      {...props}
    />
  );
}

export function CortexCardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-body text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CortexCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0 text-body", className)} {...props} />;
}

export function CortexCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}
