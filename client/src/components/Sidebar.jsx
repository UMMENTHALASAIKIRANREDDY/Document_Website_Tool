import { useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PRODUCT_TYPES, COMBINATIONS_BY_PRODUCT, FEATURE_LIST_URLS } from '../constants';

const PRODUCT_ICONS = {
  Message: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Content: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  ),
};

function Sidebar({ onShowExport, showingExport }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCombination = searchParams.get('combination') || '';
  const [expandedProduct, setExpandedProduct] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isDragging, setIsDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);

  const handleProductClick = (slug) => {
    if (collapsed) {
      setCollapsed(false);
      return;
    }
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
    if (showingExport) onShowExport(false);
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
    if (collapsed) return;
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
  }, [sidebarWidth, collapsed]);

  return (
    <div className="sidebar-wrapper">
      {collapsed && (
        <button
          className="sidebar-expand-tab"
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
      <aside
        className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
        ref={sidebarRef}
        style={collapsed ? undefined : { width: sidebarWidth }}
      >
        <div className="sidebar-group">
          {!collapsed && (
            <div className="sidebar-group-header">
              <span className="group-name">Product Types</span>
              <button
                className="sidebar-minimize-btn"
                onClick={() => setCollapsed(true)}
                title="Minimize sidebar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
          )}
          <ul className="sidebar-items">
            {PRODUCT_TYPES.map(pt => {
              const isOpen = expandedProduct === pt;
              const combos = COMBINATIONS_BY_PRODUCT[pt] || [];
              const currentProduct = searchParams.get('product') || '';
              const featureListUrl = FEATURE_LIST_URLS[pt];
              return (
                <li key={pt}>
                  <button
                    className={`sidebar-product-btn ${isOpen ? 'active' : ''}`}
                    onClick={() => handleProductClick(pt)}
                    title={collapsed ? pt : undefined}
                  >
                    <span className="sidebar-product-icon-label">
                      {PRODUCT_ICONS[pt]}
                      {!collapsed && <span>{pt}</span>}
                    </span>
                    {!collapsed && combos.length > 0 && (
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
                  {!collapsed && isOpen && (
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
                      {featureListUrl && (
                        <li>
                          <a
                            href={featureListUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sidebar-feature-list-link"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="7" height="7" />
                              <rect x="14" y="3" width="7" height="7" />
                              <rect x="3" y="14" width="7" height="7" />
                              <rect x="14" y="14" width="7" height="7" />
                            </svg>
                            Feature List
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="external-icon">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {!collapsed && (
          <div className="sidebar-bottom-actions">
            <button
              className={`sidebar-export-btn ${showingExport ? 'active' : ''}`}
              onClick={() => onShowExport(true)}
              title="Export features"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        )}
      </aside>
      {!collapsed && (
        <div
          className={`sidebar-resize-handle ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
}

export default Sidebar;
