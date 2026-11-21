import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import QuickSetup from './components/QuickSetup';
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
  // Default tab is 'Quick Setup', first in the navigation
  const [activeTab, setActiveTab] = useState('Quick Setup');
  const [latestAllocation, setLatestAllocation] = useState(null);
  const [latestExamId, setLatestExamId] = useState('');

  const handleQuickSetupComplete = (allocation, examId) => {
    setLatestAllocation(allocation);
    setLatestExamId(examId);
    setActiveTab('Allocation');
  };

  return (
    <div className="app-layout">
      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content display area */}
      <main className="main-content">
        <div className="content-container">
          {activeTab === 'Quick Setup' && (
            <QuickSetup onComplete={handleQuickSetupComplete} />
          )}

          {activeTab === 'Dashboard' && (
            <Dashboard onNavigate={setActiveTab} />
          )}

          {activeTab === 'Allocation' && (
            <Allocation
              initialAllocation={latestAllocation}
              initialExamId={latestExamId}
            />
          )}

          {activeTab === 'Students' && <Students />}
          {activeTab === 'Rooms' && <Rooms />}
          {activeTab === 'Invigilators' && <Invigilators />}
          {activeTab === 'Exams' && <Exams />}

          {activeTab === 'History' && (
            <div className="panel-card placeholder-container">
              <h2>Allocation History & Logs</h2>
              <p>Review and audit past finalized runs and constraint relaxation logs.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
