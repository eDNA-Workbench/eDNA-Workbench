import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useRef, useState } from 'react';
import '../styles/SideGuide.css';

/**
 * SideGuide
 * Props:
 * - guideKey: string (will fetch /guides/{guideKey}.md from public folder)
 * - side: 'right' | 'left' (default 'right')
 * - defaultOpen: boolean
 */
export default function SideGuide({ guideKey, side = 'right', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [width, setWidth] = useState(420);
  const [contentHtml, setContentHtml] = useState('<p>Loading guide...</p>');
  const [error, setError] = useState(null);
  const resizerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const path = `./guides/${guideKey}.md`;
    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`Guide not found: ${path}`);
        return res.text();
      })
      .then((md) => {
        const raw = marked.parse(md || '');
        const clean = DOMPurify.sanitize(raw);
        setContentHtml(clean);
      })
      .catch((err) => {
        setError(err.message);
        setContentHtml('<p>Guide not available.</p>');
      });
  }, [guideKey]);

  useEffect(() => {
    const resizer = resizerRef.current;
    if (!resizer) return;

    let startX = 0;
    let startWidth = 0;

    function onMouseDown(e) {
      startX = e.clientX;
      startWidth = width;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    }

    function onMouseMove(e) {
      const delta = side === 'right' ? startX - e.clientX : e.clientX - startX;
      const next = Math.max(280, Math.min(900, startWidth + delta));
      setWidth(next);
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
    }

    resizer.addEventListener('mousedown', onMouseDown);
    return () => {
      resizer.removeEventListener('mousedown', onMouseDown);
    };
  }, [resizerRef, width, side]);

  return (
    <div
      className={`side-guide side-guide--${side} ${open ? 'open' : 'closed'}`}
      style={{ width: open ? width : 44 }}
      ref={panelRef}
      aria-hidden={!open}
    >
      <div className="side-guide__header">
        <button
          className="side-guide__toggle"
          aria-label={open ? 'Close guide' : 'Open guide'}
          onClick={() => setOpen((s) => !s)}
        >
          {open ? '▷' : '≡'}
        </button>
        {open && (
          <div className="side-guide__title">Guide</div>
        )}
      </div>

      {open && (
        <div className="side-guide__content" role="region">
          {error && <div className="side-guide__error">{error}</div>}
          <div
            className="side-guide__markdown"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      )}

      <div ref={resizerRef} className="side-guide__resizer" title="Drag to resize" />
    </div>
  );
}
