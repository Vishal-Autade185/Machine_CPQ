import React, { useState, useEffect } from 'react';
import config from '../config';

export default function MachineCatalog({ token, onSelectMachine, onBack }) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch(`${config.API_URL}/machines`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to load machine configurations.');
        const data = await response.json();
        setMachines(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, [token]);

  return (
    <div className="container">
      <div className="d-flex justify-between align-center mb-1">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Select Machine Model</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Choose the baseline equipment to configure for this quote session
          </p>
        </div>
        <button className="nav-btn" onClick={onBack}>
          ← Change Customer
        </button>
      </div>

      {loading && (
        <div className="text-center" style={{ padding: '3rem' }}>
          <span className="spinner" style={{ width: '40px', height: '40px' }}></span>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading models catalog...</p>
        </div>
      )}

      {error && (
        <div className="text-danger" style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {!loading && !error && machines.length === 0 && (
        <div className="glass-panel text-center" style={{ padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <h3>No Machine Models Available</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            An administrator needs to create a machine template in the Control Center first.
          </p>
        </div>
      )}

      <div className="grid-container">
        {machines.map(machine => (
          <div 
            key={machine.id} 
            className="machine-card glass-panel glass-card"
            onClick={() => onSelectMachine(machine)}
          >
            <img 
              src={machine.image_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60'} 
              alt={machine.name} 
              className="machine-thumbnail"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60';
              }}
            />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>{machine.name}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {machine.hotspots ? JSON.parse(JSON.stringify(machine.hotspots)).length : 0} Configurable Spots
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
