import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import CustomerIntake from './components/CustomerIntake';
import MachineCatalog from './components/MachineCatalog';
import VisualConfigurator from './components/VisualConfigurator';
import ControlCenter from './components/ControlCenter';
import './App.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  
  // Sales Session State
  const [customer, setCustomer] = useState(null);
  const [machine, setMachine] = useState(null);
  
  // Navigation: 'login' | 'intake' | 'catalog' | 'configurator' | 'admin'
  const [view, setView] = useState('login');

  // Verify token and fetch user session details on mount
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserSession();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setView('login');
    }
  }, [token]);

  const fetchUserSession = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Session expired');
      }

      const data = await response.json();
      setUser(data.user);
      
      // Routing Guard: Redirect user based on active session
      if (view === 'login') {
        setView(data.user.role === 'admin' ? 'admin' : 'intake');
      }
    } catch (err) {
      console.warn("Session validation failed:", err.message);
      handleLogout();
    }
  };

  const handleLoginSuccess = (newToken, loggedUser) => {
    setToken(newToken);
    setUser(loggedUser);
    setView(loggedUser.role === 'admin' ? 'admin' : 'intake');
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setCustomer(null);
    setMachine(null);
    setView('login');
  };

  // Intake customer selected
  const handleSelectCustomer = (selectedCust) => {
    setCustomer(selectedCust);
    setView('catalog');
  };

  // Catalog machine selected
  const handleSelectMachine = (selectedMach) => {
    setMachine(selectedMach);
    setView('configurator');
  };

  // Configurator quote session complete
  const handleSessionEnd = () => {
    setCustomer(null);
    setMachine(null);
    setView(user?.role === 'admin' ? 'admin' : 'intake');
  };

  return (
    <div className="app-layout">
      {/* Top Navigation Bar */}
      {view !== 'login' && user && (
        <header className="navbar no-print">
          <div className="nav-logo">
            <span>⚙️</span> ApexConfig
          </div>
          
          <nav className="nav-links">
            <button 
              className={`nav-btn ${['intake', 'catalog', 'configurator'].includes(view) ? 'active' : ''}`}
              onClick={() => {
                if (machine) {
                  setView('configurator');
                } else if (customer) {
                  setView('catalog');
                } else {
                  setView('intake');
                }
              }}
            >
              Configure Machine
            </button>

            {user.role === 'admin' && (
              <button 
                className={`nav-btn ${view === 'admin' ? 'active' : ''}`}
                onClick={() => setView('admin')}
              >
                Control Center
              </button>
            )}

            <div className="d-flex align-center gap-1" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem', marginLeft: '0.5rem' }}>
              <span className={`badge ${user.role}`}>
                {user.role}
              </span>
              <span className="user-tag">{user.email}</span>
              <button className="nav-btn logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </nav>
        </header>
      )}

      {/* Main Routing Board */}
      <main>
        {view === 'login' && (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
        
        {view === 'intake' && (
          <CustomerIntake 
            token={token} 
            onSelectCustomer={handleSelectCustomer} 
          />
        )}
        
        {view === 'catalog' && (
          <MachineCatalog 
            token={token} 
            onSelectMachine={handleSelectMachine}
            onBack={() => setView('intake')}
          />
        )}
        
        {view === 'configurator' && customer && machine && (
          <VisualConfigurator 
            token={token} 
            customer={customer} 
            machine={machine} 
            onBack={() => setView('catalog')}
            onSessionEnd={handleSessionEnd}
          />
        )}
        
        {view === 'admin' && user?.role === 'admin' && (
          <ControlCenter token={token} />
        )}
      </main>
    </div>
  );
}
