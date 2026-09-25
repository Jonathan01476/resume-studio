import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export function Header({
  children,
  editor = false,
}: {
  children?: React.ReactNode;
  editor?: boolean;
}) {
  return (
    <header className="app-header web-only">
      <Link href="/resume" className="brand" aria-label="Folio home">
        <span className="brand-mark">f.</span>
        <span>
          folio<span className="brand-divider">/</span>
          <span className="brand-context">{editor ? 'studio' : 'resume'}</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        {children}
        {!editor && (
          <Link href="/edit" className="editor-link">
            Open studio <ArrowUpRight size={14} />
          </Link>
        )}
      </nav>
    </header>
  );
}
