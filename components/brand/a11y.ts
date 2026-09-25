/**
 * Accessibility props shared by the brand drawings. Decorative by default
 * (the link or text beside it carries the name); with a label, an image
 * with that name.
 */
export function brandA11y(label: string | undefined) {
  return label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": true } as const);
}
