function DocumentView({ features, productType, combination, section, onBack }) {
  const scopeLabel = section === 'inscope' ? 'In Scope' : 'Out of Scope';
  const grouped = {};
  features.forEach(f => {
    const family = f.family || 'General';
    if (!grouped[family]) grouped[family] = [];
    grouped[family].push(f);
  });

  return (
    <div className="doc-view">
      <div className="doc-view-toolbar">
        <button className="btn-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Table
        </button>
      </div>

      <div className="doc-view-paper">
        <div className="doc-header-section">
          <h1 className="doc-main-title">Migration Feature Documentation</h1>
          <div className="doc-meta">
            <span><strong>Product Type:</strong> {productType}</span>
            {combination && <span><strong>Combination:</strong> {combination}</span>}
            <span><strong>Scope:</strong> {scopeLabel}</span>
            <span><strong>Total Features:</strong> {features.length}</span>
          </div>
          <div className="doc-divider" />
        </div>

        {Object.entries(grouped).map(([family, items], groupIdx) => (
          <div key={family} className="doc-section">
            <h2 className="doc-section-title">
              <span className="doc-section-num">{groupIdx + 1}.</span>
              {family}
              <span className="doc-section-count">({items.length} feature{items.length !== 1 ? 's' : ''})</span>
            </h2>

            {items.map((feature, idx) => (
              <div key={feature.id} className="doc-feature">
                <h3 className="doc-feature-title">
                  {groupIdx + 1}.{idx + 1} {feature.name}
                </h3>
                {feature.description && (
                  <p className="doc-feature-desc">{feature.description}</p>
                )}
                {feature.screenshots && feature.screenshots.length > 0 && (
                  <div className="doc-feature-screenshots">
                    {feature.screenshots.map((src, sIdx) => (
                      <figure key={sIdx} className="doc-figure">
                        <img src={src} alt={`${feature.name} - Screenshot ${sIdx + 1}`} />
                        <figcaption>Figure {groupIdx + 1}.{idx + 1}.{sIdx + 1}: {feature.name}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DocumentView;
