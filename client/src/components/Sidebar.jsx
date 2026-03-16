import { useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PRODUCT_TYPES, COMBINATIONS_BY_PRODUCT } from '../constants';

function Sidebar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCombination = searchParams.get('combination') || '';
  const [expandedProduct, setExpandedProduct] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef(null);

  const handleProductClick = (slug) => {
    if (expandedProduct === slug) {
      setExpandedProduct('');
      const params = new URLSearchParams(searchParams);
      params.delete('product');
      params.delete('combination');
      setSearchParams(params);
    } else {
      setExpandedProduct(slug);
      const params = new URLSearchParams(searchParams);
      params.delete('product');
      params.delete('combination');
      setSearchParams(params);
    }
  };

  const handleCombinationClick = (product, combo) => {
    const params = new URLSearchParams(searchParams);
    params.set('product', product);
    if (activeCombination === combo && searchParams.get('product') === product) {
      params.delete('combination');
    } else {
      params.set('combination', combo);
    }
    setSearchParams(params);
  };

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = sidebarRef.current?.offsetWidth || sidebarWidth;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(180, Math.min(400, startWidth + (e.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth]);

  return (
    <div className="sidebar-wrapper">
      <aside className="sidebar" ref={sidebarRef} style={{ width: sidebarWidth }}>
        <div className="sidebar-group">
          <div className="sidebar-group-header">
            <span className="group-name">Product Types</span>
          </div>
          <ul className="sidebar-items">
            {PRODUCT_TYPES.map(pt => {
              const isOpen = expandedProduct === pt;
              const combos = COMBINATIONS_BY_PRODUCT[pt] || [];
              const currentProduct = searchParams.get('product') || '';
              return (
                <li key={pt}>
                  <button
                    className={`sidebar-product-btn ${isOpen ? 'active' : ''}`}
                    onClick={() => handleProductClick(pt)}
                  >
                    <span>{pt}</span>
                    {combos.length > 0 && (
                      <svg
                        className={`sidebar-product-icon ${isOpen ? 'expanded' : ''}`}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </button>
                  {isOpen && combos.length > 0 && (
                    <ul className="sidebar-combos">
                      {combos.map(combo => (
                        <li key={combo}>
                          <button
                            className={`sidebar-combo-btn ${currentProduct === pt && activeCombination === combo ? 'active' : ''}`}
                            onClick={() => handleCombinationClick(pt, combo)}
                          >
                            {combo}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
      <div
        className={`sidebar-resize-handle ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}

export default Sidebar;
