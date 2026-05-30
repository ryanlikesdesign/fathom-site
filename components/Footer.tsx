import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-brand">
          <BrandMark className="brand-mark brand-mark-lg" />
          <p className="footer-tag">Navigate any building. Your first time in.</p>
        </div>
        <nav className="footer-cols" aria-label="Footer">
          <div>
            <h4>Product</h4>
            <Link href="/">Home</Link>
            <Link href="/release-notes">Release notes</Link>
            <Link href="/#signup">Early access</Link>
          </div>
          <div>
            <h4>Help</h4>
            <Link href="/support">Support</Link>
            <Link href="/feedback">Feedback</Link>
            <a href="mailto:support@fathomvision.app">support@fathomvision.app</a>
          </div>
          <div>
            <h4>Legal</h4>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </nav>
      </div>
      <div className="footer-base">
        <span className="footnote">© 2026 Fathom</span>
        <span className="footnote">Built with lived experience.</span>
      </div>
    </footer>
  );
}
