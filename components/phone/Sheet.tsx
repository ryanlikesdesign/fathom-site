import type { ReactNode } from "react";
import { LOOK_NOW } from "@/lib/app-facts";
import { Glyph, type GlyphName } from "./Glyph";
import { Layer } from "./scene/Layer";
import { TouchIndicator } from "./TouchIndicator";

export interface SheetFrameProps {
  /** The sheet's title in its bar ("More ways to start"). Omit for a sheet with no bar title. */
  title?: string;
  /** The way out, as a word (FathomSheetChrome: "Close is a word"). Defaults to Close. Pass null for none. */
  close?: string | null;
  /** Beats during which the sheet is up; it rises over a scrim. Omit for always up. */
  show?: string;
  closeTouch?: string;
  /** Draw the drag indicator. The consent pop-up has none. */
  grabber?: boolean;
  children: ReactNode;
}

/**
 * A sheet over the screen: the scrim, then a sheet that rises from the
 * bottom with its bar (title centered, the close word at the trailing
 * edge) and a body. Render it last inside a Screen so it covers the rest.
 */
export function SheetFrame({ title, close = LOOK_NOW.close.value, show, closeTouch, grabber = true, children }: SheetFrameProps) {
  return (
    <>
      <Layer show={show} className="ph-scrim" />
      <Layer show={show} className="ph-sheet">
        {grabber ? <span className="ph-sheet-grabber" /> : null}
        {title || close ? (
          <div className="ph-sheet-bar">
            <span />
            <span className="ph-sheet-title">{title}</span>
            {close ? (
              <span className="ph-sheet-close">
                {close}
                {closeTouch ? <TouchIndicator show={closeTouch} /> : null}
              </span>
            ) : (
              <span />
            )}
          </div>
        ) : null}
        <div className="ph-sheet-body">{children}</div>
      </Layer>
    </>
  );
}

/**
 * One section of a sheet: an overline header over one card of rows. Rows
 * given beats arrive one after another as the sheet settles (.ph-stagger).
 */
export function SheetGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="ph-sheet-group">
      {label ? <p className="ph-sheet-label">{label}</p> : null}
      <div className="ph-sheet-card ph-stagger">{children}</div>
    </div>
  );
}

export interface SheetRowProps {
  glyph: GlyphName;
  title: string;
  detail?: string;
  /** Beats during which the row is shown. Omit for always. */
  show?: string;
  /** Beats in which a finger taps the row (it presses while the ring is on). */
  touch?: string;
}

/** AddSheetRow: a glyph column, the title and a one-line detail. */
export function SheetRow({ glyph, title, detail, show, touch }: SheetRowProps) {
  return (
    <Layer show={show} className="ph-sheet-row">
      <span className="ph-row-glyph">
        <Glyph name={glyph} />
      </span>
      <span className="ph-row-text">
        <span className="ph-row-title">{title}</span>
        {detail ? <span className="ph-row-detail">{detail}</span> : null}
      </span>
      {touch ? <TouchIndicator show={touch} /> : null}
    </Layer>
  );
}
