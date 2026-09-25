'use client';
import { useEffect, useRef, useState } from 'react';
import { Resume } from '@/lib/resume/schema';
import { ResumeRenderer } from '@/components/resume/ResumeRenderer';
export function ResumePreview({ resume }: { resume: Resume }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [reading, setReading] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      setReading(window.innerWidth <= 640);
      setScale(Math.min(1, node.clientWidth / 816));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return (
    <div className="preview-scaler" ref={ref}>
      <div
        className={reading ? 'reading-document' : 'scaled-document'}
        style={reading ? undefined : { width: 816, zoom: scale }}
      >
        <ResumeRenderer resume={resume} preview />
      </div>
    </div>
  );
}
