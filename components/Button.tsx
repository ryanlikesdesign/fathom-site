import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "link";
type Size = "default" | "xl";

const base =
  "inline-flex items-center justify-center font-medium rounded-[var(--radius-btn)] transition-transform";
const sizes: Record<Size, string> = {
  default: "text-sm px-5 py-2",
  xl: "text-base px-8 py-3.5",
};
const variants: Record<Variant, string> = {
  primary: "bg-[var(--text-primary)] text-[var(--bg)] hover:-translate-y-px active:translate-y-0",
  secondary: "border bg-[rgba(var(--glass)/0.5)] backdrop-blur hover:-translate-y-px",
  link: "underline underline-offset-4 px-0 py-0",
};

type Props = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  type?: "button" | "submit";
  className?: string;
};

export function Button({ children, href, variant = "primary", size = "default", type = "button", className = "" }: Props) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  const style = { transitionDuration: "var(--dur)" };
  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} style={style}>
      {children}
    </button>
  );
}
