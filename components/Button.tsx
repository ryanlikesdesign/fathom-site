import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "link";
type Size = "default" | "xl";

// min-h-11 is 44px — the project's touch-target floor. It belongs on the
// shared component rather than each call site, so a button can't be built
// below the floor by accident.
const base =
  "inline-flex min-h-11 items-center justify-center font-medium rounded-[var(--radius-btn)] transition-transform";
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
  onClick?: () => void;
  /**
   * Renders `aria-disabled` rather than the `disabled` attribute: a disabled
   * button is removed from the tab order, so a screen-reader user can never
   * reach it to find out why it's unavailable. Pair it with
   * `aria-describedby` pointing at the explanation.
   */
  disabled?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  ref?: React.Ref<HTMLButtonElement>;
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "default",
  type = "button",
  className = "",
  onClick,
  disabled = false,
  ref,
  ...aria
}: Props) {
  // Unavailable is signalled by losing the solid fill and the lift, not by
  // dimming — opacity would drop the label below the contrast floor, which is
  // exactly when someone needs to read it.
  const cls = `${base} ${sizes[size]} ${
    disabled
      ? "pointer-events-none border bg-[var(--bg-hover)] text-[var(--text-secondary)]"
      : variants[variant]
  } ${className}`;
  const style = { transitionDuration: "var(--dur)" };

  if (href) {
    return (
      <Link href={href} className={cls} style={style} {...aria}>
        {children}
      </Link>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      className={cls}
      style={style}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      {...aria}
    >
      {children}
    </button>
  );
}
