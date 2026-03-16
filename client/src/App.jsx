import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FeatureTable from './components/FeatureTable';
import AdminPage from './components/AdminPage';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <Routes>
        <Route
          path="/admin"
          element={
            <>
              <Header darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} isAdmin={true} />
              <div className="app-body">
                <AdminPage />
              </div>
            </>
          }
        />
        <Route
          path="/"
          element={
            <>
              <Header darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} isAdmin={false} />
              <div className="app-body">
                <Sidebar />
                <main className="main-content">
                  <FeatureTable />
                </main>
              </div>
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
