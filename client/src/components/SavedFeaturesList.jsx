import { useState, useEffect } from 'react';
import EditFeatureModal from './EditFeatureModal';

function SavedFeaturesList({ refreshKey }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState({});
  const [editingFeature, setEditingFeature] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchFeatures();
  }, [refreshKey]);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/features');
      const data = await res.json();
      setFeatures(data.features || []);
    } catch (err) {
      console.error('Failed to fetch features:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/features/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchFeatures();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleEditSave = () => {
    setEditingFeature(null);
    fetchFeatures();
  };

  const toggleGroup = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const grouped = {};
  features.forEach(f => {
    const pt = f.productType || f.categorySlug || 'Other';
    const scope = f.scope || 'inscope';
    const key = `${scope}__${pt}`;
    if (!grouped[key]) grouped[key] = { scope, productType: pt, features: [] };
    grouped[key].features.push(f);
  });

  if (loading) {
    return <div className="saved-loading">Loading saved features...</div>;
  }

  if (features.length === 0) {
    return <div className="saved-empty">No features saved yet. Use the form above to add features.</div>;
  }

  return (
    <div className="saved-features">
      <h2 className="saved-title">Saved Features ({features.length})</h2>

      {Object.entries(grouped).map(([key, group]) => (
        <div key={key} className="saved-group">
          <button
            className="saved-group-header"
            onClick={() => toggleGroup(key)}
          >
            <div className="saved-group-badges">
              <span className="scope-badge" data-scope={group.scope}>
                {group.scope === 'inscope' ? 'In Scope' : 'Out of Scope'}
              </span>
              <span className="product-badge">{group.productType}</span>
              <span className="count-badge">{group.features.length}</span>
            </div>
            <span className={`chevron ${collapsed[key] ? 'collapsed' : ''}`}>&#9662;</span>
          </button>

          {!collapsed[key] && (
            <div className="saved-group-body">
              {group.features.map(feature => (
                <div key={feature.id} className="saved-feature-row">
                  <div className="saved-feature-info">
                    <div className="saved-feature-name">{feature.name}</div>
                    {feature.description && (
                      <div className="saved-feature-desc">{feature.description}</div>
                    )}
                    {feature.family && (
                      <span className="family-tag">{feature.family}</span>
                    )}
                    {feature.screenshots && feature.screenshots.length > 0 && (
                      <div className="saved-feature-thumbs">
                        {feature.screenshots.map((src, idx) => (
                          <a key={idx} href={src} target="_blank" rel="noopener noreferrer">
                            <img src={src} alt={`Screenshot ${idx + 1}`} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="saved-feature-actions">
                    <button
                      className="btn-edit"
                      onClick={() => setEditingFeature(feature)}
                    >
                      Edit
                    </button>
                    {deleteConfirm === feature.id ? (
                      <div className="delete-confirm">
                        <span>Sure?</span>
                        <button className="btn-yes" onClick={() => handleDelete(feature.id)}>Yes</button>
                        <button className="btn-no" onClick={() => setDeleteConfirm(null)}>No</button>
                      </div>
                    ) : (
                      <button
                        className="btn-delete"
                        onClick={() => setDeleteConfirm(feature.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {editingFeature && (
        <EditFeatureModal
          feature={editingFeature}
          onClose={() => setEditingFeature(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

export default SavedFeaturesList;
