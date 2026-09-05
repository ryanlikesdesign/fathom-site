import qrcodegen from "./qrcodegen";

export interface QrShape {
  /** Number of modules per side (the QR grid is size × size). */
  size: number;
  /** SVG path data drawing every dark module as a 1×1 unit square. */
  path: string;
}

/**
 * Encode `text` into a QR Code and return an SVG `<path>` shape plus the
 * grid size. Rendering (colors, quiet-zone, sizing) is left to the caller
 * so it can pick brand colors and accessible markup.
 *
 * Medium error correction keeps codes readable even if a phone camera
 * catches them at an angle across a conference table.
 */
export function qrShape(text: string): QrShape {
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
  const size = qr.size;
  let path = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (qr.getModule(x, y)) {
        path += `M${x} ${y}h1v1h-1z`;
      }
    }
  }
  return { size, path };
}
