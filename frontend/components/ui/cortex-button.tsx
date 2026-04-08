import { cn } from "@/lib/utils";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-[#5b4cdb] text-white border border-transparent",
    "hover:bg-[#4338ca] active:bg-[#3730a3] active:scale-[0.97]",
    "focus-visible:ring-2 focus-visible:ring-[#5b4cdb] focus-visible:ring-offset-2",
    "dark:bg-[#7c6ff0] dark:hover:bg-[#6358e0]",
    "shadow-[0px_4px_20px_rgba(91,76,219,0.25),0px_1px_4px_rgba(91,76,219,0.15)]",
    "hover:shadow-[0px_6px_24px_rgba(91,76,219,0.35),0px_2px_6px_rgba(91,76,219,0.2)]",
  ].join(" "),

  secondary: [
    "bg-[rgba(0,0,0,0.05)] text-[rgba(0,0,0,0.92)] border border-transparent",
    "hover:bg-[rgba(0,0,0,0.08)] active:scale-[0.97]",
    "dark:bg-[rgba(255,255,255,0.06)] dark:text-[rgba(255,255,255,0.92)]",
    "dark:hover:bg-[rgba(255,255,255,0.1)]",
  ].join(" "),

  ghost: [
    "bg-transparent text-[rgba(0,0,0,0.85)] border border-transparent",
    "hover:bg-[rgba(0,0,0,0.04)] active:scale-[0.97]",
    "dark:text-[rgba(255,255,255,0.85)] dark:hover:bg-[rgba(255,255,255,0.06)]",
  ].join(" "),

  outline: [
    "bg-transparent text-foreground border border-[rgba(0,0,0,0.12)]",
    "hover:border-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.02)]",
    "dark:border-[rgba(255,255,255,0.1)] dark:hover:border-[rgba(255,255,255,0.18)]",
    "dark:hover:bg-[rgba(255,255,255,0.04)]",
    "active:scale-[0.97]",
  ].join(" "),

  danger: [
    "bg-[#ef4444] text-white border border-transparent",
    "hover:bg-[#dc2626] active:scale-[0.97]",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm:  "h-7  px-3   text-[0.8125rem] font-semibold rounded-[4px] gap-1.5",
  md:  "h-9  px-4   text-[0.9375rem] font-semibold rounded-[4px] gap-2",
  lg:  "h-11 px-5   text-[1rem]      font-semibold rounded-[4px] gap-2.5",
};

export function CortexButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center cursor-pointer select-none",
        "transition-all duration-150 ease-out",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin size-4 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
