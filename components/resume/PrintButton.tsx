'use client';
import { Download } from 'lucide-react';
export function PrintButton() {
  return (
    <button className="button subtle" onClick={() => window.print()}>
      <Download size={14} />
      <span>Print / PDF</span>
    </button>
  );
}
