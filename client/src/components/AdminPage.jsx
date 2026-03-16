import { useState } from 'react';
import FeatureScopeForm from './FeatureScopeForm';
import EditFeatureTab from './EditFeatureTab';

function AdminPage() {
  const [activeTab, setActiveTab] = useState('add');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Feature
          </button>
          <button
            className={`admin-tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            Edit Feature
          </button>
        </div>

        {activeTab === 'add' && (
          <FeatureScopeForm onSaved={handleSaved} />
        )}

        {activeTab === 'edit' && (
          <EditFeatureTab refreshKey={refreshKey} onChanged={handleSaved} />
        )}
      </div>
    </div>
  );
}

export default AdminPage;
