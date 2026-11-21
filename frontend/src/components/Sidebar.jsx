import React from 'react';

/**
 * Sidebar Navigation Component
 * 
 * @param {string} activeTab - The currently active tab name
 * @param {function} setActiveTab - State setter to switch active tab
 */
function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    'Dashboard',
    'Students',
    'Rooms',
    'Exams',
    'Invigilators',
    'Allocation',
    'History',
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Allocate<span>X</span></h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            className={`sidebar-btn ${activeTab === item ? 'active' : ''}`}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
