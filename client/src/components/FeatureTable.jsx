import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from './SearchBar';
import FilterTags from './FilterTags';

function WelcomePage() {
  return (
    <div className="welcome-page">
      <div className="welcome-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
      <h1 className="welcome-title">Migration Feature Docs</h1>
      <p className="welcome-subtitle">
        Select a product type and combination from the sidebar to view the supported features and documentation.
      </p>
      <div className="welcome-steps">
        <div className="welcome-step">
          <span className="welcome-step-num">1</span>
          <span>Choose a <strong>Product Type</strong> (Message, Mail, Content)</span>
        </div>
        <div className="welcome-step">
          <span className="welcome-step-num">2</span>
          <span>Select a <strong>Combination</strong> (e.g. Slack to Teams)</span>
        </div>
        <div className="welcome-step">
          <span className="welcome-step-num">3</span>
          <span>View the <strong>Features</strong> with descriptions and screenshots</span>
        </div>
      </div>
    </div>
  );
}

function getCacheKey(productType, combination, section, search, activeTag) {
  return `features_cache_${productType}_${combination}_${section}_${search}_${activeTag}`;
}

function FeatureTable() {
  const [searchParams] = useSearchParams();
  const productType = searchParams.get('product') || '';
  const combination = searchParams.get('combination') || '';
  const section = searchParams.get('section') || 'inscope';

  const [features, setFeatures] = useState([]);
  const [tags, setTags] = useState(['All']);
  const [activeTag, setActiveTag] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const showWelcome = !productType && !combination;

  useEffect(() => {
    setExpandedRow(null);
    if (!showWelcome) {
      fetchFeatures();
    }
  }, [productType, combination, section, activeTag, search]);

  const fetchFeatures = async () => {
    setLoading(true);
    const cacheKey = getCacheKey(productType, combination, section, search, activeTag);
    try {
      const params = new URLSearchParams();
      if (productType) params.set('productType', productType);
      if (combination) params.set('combination', combination);
      params.set('scope', section);
      if (search) params.set('search', search);
      if (activeTag !== 'All') params.set('tag', activeTag);

      const res = await fetch(`/api/features?${params.toString()}`);
      const data = await res.json();
      setFeatures(data.features || []);
      setTags(data.tags || ['All']);
      setIsOffline(false);

      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (_) { /* quota exceeded — ignore */ }
    } catch (err) {
      console.error('Failed to fetch features:', err);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setFeatures(data.features || []);
        setTags(data.tags || ['All']);
        setIsOffline(true);
      }
    }
    setLoading(false);
  };

  const toggleScreenshots = (featureId) => {
    setExpandedRow(prev => prev === featureId ? null : featureId);
  };

  if (showWelcome) {
    return <WelcomePage />;
  }

  const scopeLabel = section === 'inscope' ? 'Supported Features' : 'Out of Scope Features';

  return (
    <div className="feature-table-container">
      {isOffline && (
        <div className="offline-banner">
          Server is offline — showing cached data. Changes will sync when the server is back.
        </div>
      )}
      <h1 className="page-title">
        {scopeLabel}
        {combination && <span className="page-subtitle"> — {combination}</span>}
      </h1>

      <SearchBar value={search} onChange={setSearch} />
      <FilterTags tags={tags} activeTag={activeTag} onTagClick={setActiveTag} />

      <div className="table-wrapper">
        <table className="feature-table">
          <thead>
            <tr>
              <th className="col-name">Name</th>
              <th className="col-description">Description</th>
              <th className="col-screenshots">Screenshots</th>
              <th className="col-family">Family</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="table-loading">Loading...</td>
              </tr>
            ) : features.length === 0 ? (
              <tr>
                <td colSpan="4" className="table-empty">
                  No {section === 'inscope' ? 'In Scope' : 'Out of Scope'} features found for {productType}{combination ? ` / ${combination}` : ''}.
                </td>
              </tr>
            ) : (
              features.map((feature) => {
                const hasScreenshots = feature.screenshots && feature.screenshots.length > 0;
                const isExpanded = expandedRow === feature.id;
                return (
                  <React.Fragment key={feature.id}>
                    <tr>
                      <td className="col-name">
                        <span className="feature-name-link">{feature.name}</span>
                      </td>
                      <td className="col-description">{feature.description}</td>
                      <td className="col-screenshots">
                        {hasScreenshots ? (
                          <button
                            className="screenshot-toggle-btn"
                            onClick={() => toggleScreenshots(feature.id)}
                          >
                            Screenshots
                            <span className={`toggle-icon ${isExpanded ? 'open' : ''}`}>&#9662;</span>
                          </button>
                        ) : (
                          <span className="no-screenshots-text">--</span>
                        )}
                      </td>
                      <td className="col-family">
                        {feature.family && (
                          <span className="family-badge">{feature.family}</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && hasScreenshots && (
                      <tr className="screenshot-expand-row">
                        <td colSpan="4">
                          <div className="screenshot-expand-content">
                            {feature.screenshots.map((src, idx) => (
                              <div key={idx} className="screenshot-expand-item">
                                <a href={src} target="_blank" rel="noopener noreferrer">
                                  <img src={src} alt={`Screenshot ${idx + 1}`} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FeatureTable;
