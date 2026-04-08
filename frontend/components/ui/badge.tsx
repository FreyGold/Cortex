import { cn } from "@/lib/utils";

type BadgeVariant =
  | "brand"
  | "synapse"
  | "axon"
  | "success"
  | "error"
  | "muted"
  | "outline";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  brand:
    "bg-[#ede9fe] text-[#4f46e5] dark:bg-[#231f38] dark:text-[#a5b4fc]",
  synapse:
    "bg-[#e0f2fe] text-[#0284c7] dark:bg-[#0c2a3d] dark:text-[#38bdf8]",
  axon:
    "bg-[#fef3c7] text-[#b45309] dark:bg-[#2d2208] dark:text-[#fbbf24]",
  success:
    "bg-[#d1fae5] text-[#059669] dark:bg-[#052e1c] dark:text-[#34d399]",
  error:
    "bg-[#fee2e2] text-[#dc2626] dark:bg-[#2d0a0a] dark:text-[#f87171]",
  muted:
    "bg-[#f5f3ef] text-[#78746d] dark:bg-[#1e1c28] dark:text-[#a39e98]",
  outline:
    "bg-transparent border border-border text-foreground",
};

const dotColors: Record<BadgeVariant, string> = {
  brand: "bg-[#5b4cdb]",
  synapse: "bg-[#0ea5e9]",
  axon: "bg-[#f59e0b]",
  success: "bg-[#10b981]",
  error: "bg-[#ef4444]",
  muted: "bg-[#a39e98]",
  outline: "bg-foreground",
};

export function Badge({
  variant = "brand",
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[9999px] px-2 py-0.5",
        "text-[0.75rem] font-semibold leading-5 tracking-[0.125px]",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn("size-1.5 rounded-full flex-shrink-0", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
