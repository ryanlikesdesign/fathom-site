/**
 * The essay as a reader hears it: every text node in document order,
 * skipping aria-hidden subtrees (the art, the pivot's drawn words) and
 * script/style, joined with spaces and whitespace collapsed. An sr-only
 * span counts, because a screen reader reads it.
 *
 * test/fixtures/why-essay.txt was written from this function against the
 * page as it stood before the restaging, so any change to a sentence, or
 * to its order, shows up as a diff against that fixture.
 */
export function essayText(container: Node): string {
  const out: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      out.push(node.nodeValue ?? "");
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 9 && node.nodeType !== 11) return;
    if (node.nodeType === 1) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "template") return;
      if (el.getAttribute("aria-hidden") === "true") return;
    }
    node.childNodes.forEach(walk);
  };
  walk(container);
  return out.join(" ").replace(/\s+/g, " ").trim();
}
