import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="empty-page">
      <span className="eyebrow">404 / NOT FOUND</span>
      <h1>This page isn’t here.</h1>
      <Link className="button primary" href="/resume">
        Back to the resume
      </Link>
    </main>
  );
}
