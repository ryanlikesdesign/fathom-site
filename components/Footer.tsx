import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-brand">
          <BrandMark className="brand-mark brand-mark-lg" />
          <p className="footer-tag">Walk in. Know the room. Do what you came for.</p>
        </div>
        <nav className="footer-cols" aria-label="Footer">
          <div>
            <h2 className="footer-heading label-caps">Product</h2>
            <Link href="/">Home</Link>
            <Link href="/release-notes">Release notes</Link>
            <a href="https://apps.apple.com/us/app/fathom-visual-assistance/id6760924183" rel="noopener noreferrer">Download on the App Store</a>
          </div>
          <div>
            <h2 className="footer-heading label-caps">Help</h2>
            <Link href="/support">Support</Link>
            <Link href="/feedback">Feedback</Link>
            <a href="mailto:support@fathomvision.app">support@fathomvision.app</a>
          </div>
          <div>
            <h2 className="footer-heading label-caps">Legal</h2>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/accessibility">Accessibility</Link>
          </div>
        </nav>
      </div>
      <div className="footer-base">
        <span className="footnote">© {new Date().getFullYear()} Unruly Vision, LLC</span>
        <span className="footnote">Built with lived experience.</span>
      </div>
    </footer>
  );
}
