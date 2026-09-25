'use client';
import { useId, useRef } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
export function Details({
  title,
  children,
  label = 'Explore details',
}: {
  title: string;
  children: React.ReactNode;
  label?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  return (
    <>
      <button
        className="detail-trigger web-only"
        onClick={() => ref.current?.showModal()}
        aria-label={`${label}: ${title}`}
      >
        <span>{label}</span>
        <ArrowUpRight size={13} />
      </button>
      <dialog
        aria-labelledby={id}
        className="detail-panel"
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current.close();
        }}
      >
        <div className="panel-inner">
          <div className="panel-top">
            <span className="eyebrow">DOCUMENT / DETAILS</span>
            <button
              className="icon-button"
              autoFocus
              onClick={() => ref.current?.close()}
              aria-label="Close details"
            >
              <X size={20} />
            </button>
          </div>
          <h2 id={id}>{title}</h2>
          {children}
        </div>
      </dialog>
    </>
  );
}
