import React, { useEffect, useRef } from 'react';
import '../../styles/components/Navbar.css';

// Dropdown
export const NavDropdown = ({ label, isOpen, setIsOpen, children }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  return (
    <div className="dropdown" ref={ref}>
      <div 
        className={`nav-item ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        {label} ▾
      </div>
      <div className={`dropdown-menu ${isOpen ? 'show' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// Upload File Menu Item
export const UploadMenuItem = ({ label, subLabel, accept, onChange, onClick }) => (
  <label className="dropdown-item" onClick={onClick}>
    <div className="upload-label-content">
      <span>{label}</span>
      {subLabel && <span className="upload-hint">{subLabel}</span>}
    </div>
    <input
      type="file"
      accept={accept}
      onChange={onChange}
      style={{ display: "none" }}
    />
  </label>
);

// Fasta File Selector
export const FastaSelector = ({ files, selectedIndex, onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!files || files.length === 0) return null;

  return (
    <div className="fasta-selector-container">
      <div 
        className="fasta-select-btn"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
      >
        <span className="fasta-filename">
          {files[selectedIndex]?.name || "Select Fasta"}
        </span>
        <span style={{ fontSize: '0.7rem', marginLeft: '5px' }}>▼</span>
      </div>
      
      {isOpen && (
        <div className="fasta-dropdown-list">
          {files.map((file, idx) => (
             <div 
               key={idx}
               className={`fasta-option ${selectedIndex === idx ? 'selected' : ''}`}
               onClick={() => { onSelect(idx); setIsOpen(false); }}
             >
               {file.name}
             </div>
          ))}
        </div>
      )}
    </div>
  );
};