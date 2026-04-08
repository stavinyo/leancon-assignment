import React, { useState } from 'react';
import Viewer from './components/Viewer/Viewer';
import Table from './components/Table/Table';
import { useBuildingData } from './hooks/useBuildingData';
import './App.css';

function App() {
  const { data, files, loading, error } = useBuildingData();
  const [selectedGuids, setSelectedGuids] = useState([]);
  const [activeLabel, setActiveLabel] = useState(null);

  const isTableReady = !loading && !!data;

  function handleTypeClick(row) {
    const guids = Object.values(row.guidsByLevel).flat();
    setSelectedGuids(guids);
    setActiveLabel(row.type);
  }

  function handleLevelClick(levelName) {
    const guids = data.rows.flatMap(row => row.guidsByLevel[levelName] || []);
    setSelectedGuids(guids);
    setActiveLabel(levelName);
  }

  function handleClearSelection() {
    setSelectedGuids([]);
    setActiveLabel(null);
  }

  if (error) return <div className="error-state">Error connecting to backend</div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>BIM Viewer</h1>
          <span className="project-tag">LeanCon Assignment</span>
        </div>
      </header>

      <main className="app-content">
        <section className="viewer-section">
          <Viewer
            files={files}
            selectedGuids={selectedGuids}
          />

          {activeLabel && (
            <div className="selection-bar">
              <span className="selection-label">Selected: {activeLabel}</span>
              <button className="clear-btn" onClick={handleClearSelection}>
                Clear Selection
              </button>
            </div>
          )}
        </section>

        <section className="table-section">
          {loading && <div className="loading-state">Loading model data...</div>}
          {isTableReady && (
            <Table
              data={data}
              activeLabel={activeLabel}
              onTypeClick={handleTypeClick}
              onLevelClick={handleLevelClick}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
