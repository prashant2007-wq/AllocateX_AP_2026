import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Rooms from './components/Rooms';
import Invigilators from './components/Invigilators';
import Exams from './components/Exams';
import Allocation from './components/Allocation';

/**
 * Main AllocateX Application Layout
 */
function App() {
  // Active navigation tab state, defaulting to 'Dashboard'
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <div className="app-layout">
      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content display area */}
      <main className="main-content">
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Students' && <Students />}
        {activeTab === 'Rooms' && <Rooms />}
        {activeTab === 'Invigilators' && <Invigilators />}
        {activeTab === 'Exams' && <Exams />}
        {activeTab === 'Allocation' && <Allocation />}

        {activeTab === 'History' && (
          <div className="placeholder-container">
            <h2>Allocation History & Logs</h2>
            <p>Review and audit past finalized runs and constraint relaxation logs.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
