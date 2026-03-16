import { useState, useRef, useEffect } from 'react';

function ScreenshotDropdown({ screenshots, readOnly }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!screenshots || screenshots.length === 0) {
    return <span className="no-screenshots-text">--</span>;
  }

  return (
    <div className="screenshot-dropdown" ref={dropdownRef}>
      <button className="screenshot-btn" onClick={() => setOpen(!open)}>
        Screenshots
        <span className="dropdown-arrow">&#9662;</span>
      </button>

      {open && (
        <div className="screenshot-panel">
          <div className="screenshot-grid">
            {screenshots.map((src, idx) => (
              <a key={idx} href={src} target="_blank" rel="noopener noreferrer">
                <img src={src} alt={`Screenshot ${idx + 1}`} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScreenshotDropdown;
