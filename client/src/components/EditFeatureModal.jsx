import { useState } from 'react';
import FeatureCard from './FeatureCard';

function EditFeatureModal({ feature, onClose, onSave }) {
  const [editData, setEditData] = useState({ ...feature, _pendingFiles: [], _localPreviews: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (index, updated) => {
    setEditData(updated);
  };

  const uploadScreenshots = async (files) => {
    if (!files || files.length === 0) return [];
    const formData = new FormData();
    files.forEach(f => formData.append('screenshots', f));
    const res = await fetch('/api/screenshots', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.paths;
  };

  const handleSave = async () => {
    if (!editData.name.trim()) {
      setError('Feature name is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let screenshotPaths = [...(editData.screenshots || [])];
      if (editData._pendingFiles && editData._pendingFiles.length > 0) {
        const uploaded = await uploadScreenshots(editData._pendingFiles);
        screenshotPaths = [...screenshotPaths, ...uploaded];
      }

      const res = await fetch(`/api/features/${feature.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name.trim(),
          description: editData.description.trim(),
          family: editData.family.trim(),
          screenshots: screenshotPaths,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onSave();
    } catch (err) {
      setError('Update failed: ' + err.message);
    }

    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Feature</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="modal-meta">
            <span className="scope-badge" data-scope={feature.scope}>
              {feature.scope === 'inscope' ? 'In Scope' : 'Out of Scope'}
            </span>
            <span className="product-badge">{feature.productType || feature.categorySlug}</span>
          </div>

          <FeatureCard
            feature={editData}
            index={0}
            onChange={handleChange}
            onRemove={() => {}}
            showRemove={false}
          />

          {error && <div className="form-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button className="btn-reset" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default EditFeatureModal;
