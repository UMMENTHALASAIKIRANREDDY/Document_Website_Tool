import { useState, useEffect } from 'react';
import FeatureCard from './FeatureCard';
import { PRODUCT_TYPES, COMBINATIONS_BY_PRODUCT } from '../constants';

function getEditCacheKey(productType, scope, combination) {
  return `edit_cache_${productType}_${scope}_${combination}`;
}

function EditFeatureTab({ refreshKey, onChanged }) {
  const [scope, setScope] = useState('');
  const [productType, setProductType] = useState('');
  const [combination, setCombination] = useState('');
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  const combinations = productType ? (COMBINATIONS_BY_PRODUCT[productType] || []) : [];
  const readyToFetch = scope && productType && (combinations.length === 0 || combination);

  useEffect(() => {
    if (readyToFetch) {
      fetchFiltered();
    } else {
      setFeatures([]);
    }
  }, [scope, productType, combination, refreshKey]);

  const fetchFiltered = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    const cacheKey = getEditCacheKey(productType, scope, combination);
    try {
      const params = new URLSearchParams({ productType, scope });
      if (combination) params.set('combination', combination);
      const res = await fetch(`/api/features?${params}`);
      const data = await res.json();
      const withMeta = (data.features || []).map(f => ({
        ...f,
        _pendingFiles: [],
        _localPreviews: [],
        _dirty: false,
      }));
      setFeatures(withMeta);
      setIsOffline(false);

      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (_) { /* quota exceeded */ }
    } catch (err) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        const withMeta = (data.features || []).map(f => ({
          ...f,
          _pendingFiles: [],
          _localPreviews: [],
          _dirty: false,
        }));
        setFeatures(withMeta);
        setIsOffline(true);
      } else {
        setError('Failed to load features: ' + err.message);
      }
    }
    setLoading(false);
  };

  const handleFeatureChange = (index, updated) => {
    setFeatures(prev => prev.map((f, i) =>
      i === index ? { ...updated, _dirty: true } : f
    ));
  };

  const uploadScreenshots = async (files, featureName) => {
    if (!files || files.length === 0) return [];
    const formData = new FormData();
    if (featureName) formData.append('featureName', featureName);
    files.forEach(f => formData.append('screenshots', f));
    const res = await fetch('/api/screenshots', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.paths;
  };

  const handleSaveAll = async () => {
    const dirtyFeatures = features.filter(f => f._dirty);
    if (dirtyFeatures.length === 0) {
      setError('No changes to save.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');
    let savedCount = 0;

    try {
      for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        if (!feature._dirty) continue;
        if (!feature.name.trim()) continue;

        let screenshotPaths = [...(feature.screenshots || [])];
        if (feature._pendingFiles && feature._pendingFiles.length > 0) {
          const uploaded = await uploadScreenshots(feature._pendingFiles, feature.name.trim());
          screenshotPaths = [...screenshotPaths, ...uploaded];
        }

        const res = await fetch(`/api/features/${feature.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: feature.name.trim(),
            description: (feature.description || '').trim(),
            family: (feature.family || '').trim(),
            screenshots: screenshotPaths,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        savedCount++;
      }

      setSuccessMsg(`${savedCount} feature${savedCount !== 1 ? 's' : ''} updated successfully!`);
      if (onChanged) onChanged();
      fetchFiltered();
    } catch (err) {
      setError('Update failed: ' + err.message);
    }

    setSaving(false);
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await fetch(`/api/features/${id}`, { method: 'DELETE' });
      setFeatures(prev => prev.filter(f => f.id !== id));
      setDeleteConfirm(null);
      setSuccessMsg('Feature deleted.');
      setTimeout(() => setSuccessMsg(''), 3000);
      if (onChanged) onChanged();
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  const dirtyCount = features.filter(f => f._dirty).length;

  return (
    <div className="scope-form">
      <h2 className="scope-form-title">Edit Features</h2>

      <div className="form-section">
        <div className="form-group">
          <label>Scope Status <span className="required">*</span></label>
          <select
            value={scope}
            onChange={(e) => { setScope(e.target.value); setSuccessMsg(''); }}
          >
            <option value="">-- Select Scope --</option>
            <option value="inscope">In Scope</option>
            <option value="outscope">Out of Scope</option>
          </select>
        </div>
      </div>

      {scope && (
        <div className="form-section">
          <div className="form-group">
            <label>Product Type <span className="required">*</span></label>
            <select
              value={productType}
              onChange={(e) => { setProductType(e.target.value); setCombination(''); setSuccessMsg(''); }}
            >
              <option value="">-- Select Product Type --</option>
              {PRODUCT_TYPES.map(pt => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {scope && productType && combinations.length > 0 && (
        <div className="form-section">
          <div className="form-group">
            <label>Combination <span className="required">*</span></label>
            <select
              value={combination}
              onChange={(e) => { setCombination(e.target.value); setSuccessMsg(''); }}
            >
              <option value="">-- Select Combination --</option>
              {combinations.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {readyToFetch && (
        <>
          <div className="form-section-header">
            <span className="scope-badge" data-scope={scope}>
              {scope === 'inscope' ? 'In Scope' : 'Out of Scope'}
            </span>
            <span className="product-badge">{productType}</span>
            {combination && <span className="combination-badge">{combination}</span>}
            {features.length > 0 && (
              <span className="count-badge">{features.length} feature{features.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {isOffline && (
            <div className="offline-banner" style={{ marginBottom: 16 }}>
              Server is offline — showing cached data. Save and delete are unavailable until the server is back.
            </div>
          )}

          {error && <div className="form-error">{error}</div>}
          {successMsg && <div className="form-success">{successMsg}</div>}

          {loading ? (
            <div className="saved-loading">Loading features...</div>
          ) : features.length === 0 ? (
            <div className="saved-empty">
              No features found for {scope === 'inscope' ? 'In Scope' : 'Out of Scope'} / {productType}
              {combination ? ` / ${combination}` : ''}.
            </div>
          ) : (
            <>
              <div className="edit-features-list">
                {features.map((feature, idx) => (
                  <div key={feature.id} className="edit-feature-wrapper">
                    <FeatureCard
                      feature={feature}
                      index={idx}
                      onChange={handleFeatureChange}
                      onRemove={() => {}}
                      showRemove={false}
                    />
                    <div className="edit-feature-actions">
                      {deleteConfirm === feature.id ? (
                        <div className="delete-confirm">
                          <span>Delete this feature?</span>
                          <button className="btn-yes" onClick={() => handleDelete(feature.id)}>Yes</button>
                          <button className="btn-no" onClick={() => setDeleteConfirm(null)}>No</button>
                        </div>
                      ) : (
                        <button
                          className="btn-delete"
                          onClick={() => setDeleteConfirm(feature.id)}
                          disabled={isOffline}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleSaveAll}
                  disabled={saving || isOffline || dirtyCount === 0}
                >
                  {saving ? 'Saving...' : `Save All Changes${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default EditFeatureTab;
