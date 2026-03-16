import { useState } from 'react';
import FeatureCard from './FeatureCard';
import { PRODUCT_TYPES, COMBINATIONS_BY_PRODUCT } from '../constants';

const emptyFeature = () => ({
  name: '',
  description: '',
  family: '',
  screenshots: [],
  _pendingFiles: [],
  _localPreviews: [],
});

function FeatureScopeForm({ onSaved }) {
  const [scope, setScope] = useState('');
  const [productType, setProductType] = useState('');
  const [combination, setCombination] = useState('');
  const [features, setFeatures] = useState([emptyFeature()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const combinations = productType ? (COMBINATIONS_BY_PRODUCT[productType] || []) : [];

  const handleFeatureChange = (index, updated) => {
    setFeatures(prev => prev.map((f, i) => (i === index ? updated : f)));
  };

  const addFeature = () => {
    setFeatures(prev => [...prev, emptyFeature()]);
  };

  const removeFeature = (index) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
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

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!scope) {
      setError('Please select a Scope Status.');
      return;
    }
    if (!productType) {
      setError('Please select a Product Type.');
      return;
    }
    if (combinations.length > 0 && !combination) {
      setError('Please select a Combination.');
      return;
    }

    const validFeatures = features.filter(f => f.name.trim());
    if (validFeatures.length === 0) {
      setError('Please add at least one feature with a name.');
      return;
    }

    setSaving(true);

    try {
      const featuresToSave = [];

      for (const f of validFeatures) {
        let screenshotPaths = [...(f.screenshots || [])];
        if (f._pendingFiles && f._pendingFiles.length > 0) {
          const uploaded = await uploadScreenshots(f._pendingFiles, f.name.trim());
          screenshotPaths = [...screenshotPaths, ...uploaded];
        }

        featuresToSave.push({
          productType,
          scope,
          combination: combination || '',
          name: f.name.trim(),
          description: f.description.trim(),
          family: f.family.trim(),
          screenshots: screenshotPaths,
        });
      }

      const res = await fetch('/api/features/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: featuresToSave }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(`${data.count} feature(s) saved successfully!`);
      setFeatures([emptyFeature()]);
      if (onSaved) onSaved();
    } catch (err) {
      setError('Save failed: ' + err.message);
    }

    setSaving(false);
  };

  const resetForm = () => {
    setScope('');
    setProductType('');
    setCombination('');
    setFeatures([emptyFeature()]);
    setError('');
    setSuccess('');
  };

  return (
    <div className="scope-form">
      <h2 className="scope-form-title">Add Features</h2>

      <div className="form-section">
        <div className="form-group">
          <label>Scope Status <span className="required">*</span></label>
          <select
            value={scope}
            onChange={(e) => { setScope(e.target.value); setSuccess(''); }}
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
              onChange={(e) => { setProductType(e.target.value); setCombination(''); setSuccess(''); }}
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
              onChange={(e) => { setCombination(e.target.value); setSuccess(''); }}
            >
              <option value="">-- Select Combination --</option>
              {combinations.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {scope && productType && (combinations.length === 0 || combination) && (
        <>
          <div className="form-section-header">
            <span className="scope-badge" data-scope={scope}>
              {scope === 'inscope' ? 'In Scope' : 'Out of Scope'}
            </span>
            <span className="product-badge">{productType}</span>
            {combination && <span className="combination-badge">{combination}</span>}
          </div>

          <div className="features-list">
            {features.map((feature, idx) => (
              <FeatureCard
                key={idx}
                feature={feature}
                index={idx}
                onChange={handleFeatureChange}
                onRemove={removeFeature}
                showRemove={features.length > 1}
              />
            ))}
          </div>

          <button type="button" className="btn-add-feature" onClick={addFeature}>
            + Add Another Feature
          </button>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save All Features'}
            </button>
            <button type="button" className="btn-reset" onClick={resetForm}>
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default FeatureScopeForm;
