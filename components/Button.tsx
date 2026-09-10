import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "link";
type Size = "default" | "xl";

// min-h-11 is 44px, the project's touch-target floor. It belongs on the
// shared component rather than each call site, so a button can't be built
// below the floor by accident.
// Shape and weight live on the variant: the primary is the homepage pill
// (.btn-primary in fathom-landing.css, same accent fill and hover mix), the
// rest keep the smaller card radius.
// ui-btn is a hook, not a style: the subpage link rules in globals.css
// (.page-section a:not([class*="btn"])) underline and recolor every anchor
// that does not read as a button, and a Button link must not be one of them.
// Deliberately not "btn" itself, which is the homepage's own pill.
const base = "ui-btn inline-flex min-h-11 items-center justify-center";
const sizes: Record<Size, string> = {
  default: "text-sm px-5 py-2",
  xl: "text-base px-6 py-4",
};
const variants: Record<Variant, string> = {
  primary:
    "rounded-[var(--radius-full)] bg-[var(--accent)] text-[var(--bone-100)] font-semibold transition-[transform,background-color] hover:bg-[var(--fathom-500)] hover:-translate-y-px active:translate-y-0",
  secondary:
    "rounded-[var(--radius-btn)] font-medium border bg-[rgba(var(--glass)/0.5)] backdrop-blur transition-transform hover:-translate-y-px",
  link: "rounded-[var(--radius-btn)] font-medium underline underline-offset-4 px-0 py-0",
};

type Props = {
  children: ReactNode;
  href?: string;
  /**
   * Render a plain `<a>` instead of `next/link`. For Route Handlers and
   * anything the router must not prefetch or fetch on the user's behalf:
   * the promo redeem route records the tap it receives, so a prefetch or a
   * client-side navigation attempt would count as a redemption.
   */
  external?: boolean;
  rel?: string;
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
  external = false,
  rel,
  variant = "primary",
  size = "default",
  type = "button",
  className = "",
  onClick,
  disabled = false,
  ref,
  ...aria
}: Props) {
  // Unavailable is signaled by losing the solid fill and the lift, not by
  // dimming; opacity would drop the label below the contrast floor, which is
  // exactly when someone needs to read it.
  const cls = `${base} ${sizes[size]} ${
    disabled
      ? "pointer-events-none rounded-[var(--radius-btn)] font-medium border bg-[var(--bg-hover)] text-[var(--text-secondary)]"
      : variants[variant]
  } ${className}`;
  const style = { transitionDuration: "var(--dur)" };

  if (href && external) {
    return (
      <a href={href} rel={rel} className={cls} style={style} onClick={onClick} {...aria}>
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} rel={rel} className={cls} style={style} onClick={onClick} {...aria}>
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
