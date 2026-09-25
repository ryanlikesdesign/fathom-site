import { Glyph, type GlyphName } from "./Glyph";
import { Layer } from "./scene/Layer";
import { TouchIndicator } from "./TouchIndicator";

export interface PhoneButtonProps {
  /** FathomButton's family: one Primary per screen, Secondary beside it, Tinted, Text. */
  kind?: "primary" | "secondary" | "tinted" | "text";
  glyph?: GlyphName;
  /** Beats during which the button is shown. Omit for always. */
  show?: string;
  touch?: string;
  /** The visible word. Every button carries one. */
  children: string;
}

/** A drawn button. A picture of one: never a <button>, never focusable. */
export function PhoneButton({ kind = "primary", glyph, show, touch, children }: PhoneButtonProps) {
  return (
    <Layer as="span" show={show} className={`ph-btn ph-btn-${kind}`}>
      {glyph && kind !== "text" ? <Glyph name={glyph} /> : null}
      <span>{children}</span>
      {touch ? <TouchIndicator show={touch} /> : null}
    </Layer>
  );
}
