import React, { useState, useEffect } from 'react';
import config from '../config';

export default function CustomerIntake({ token, onSelectCustomer }) {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'register'
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Registration Form State
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch customer list on load
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${config.API_URL}/customers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to load customer directory.');
        const data = await response.json();
        setCustomers(data);
      } catch (err) {
        console.error("Customers load error:", err.message);
      }
    };
    fetchCustomers();
  }, [token]);

  // Handle customer registration submission
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!companyName || !contactName) {
      setError('Company Name and Contact Person are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${config.API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ companyName, contactName, phone, email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register lead.');
      }

      onSelectCustomer(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete filtering based on search query
  const filteredCustomers = customers.filter(c => 
    c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contact_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="launchpad-card glass-panel">
      <div className="text-center mb-1">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>Customer Intake</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Search an existing client or register a new lead to start configuration
        </p>
      </div>

      <div className="tab-headers">
        <button 
          className={`tab-header ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => { setActiveTab('search'); setError(''); }}
        >
          Search Existing Customer
        </button>
        <button 
          className={`tab-header ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => { setActiveTab('register'); setError(''); }}
        >
          Register New Lead
        </button>
      </div>

      {error && (
        <div className="text-danger mb-1" style={{ fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      {activeTab === 'search' ? (
        <div>
          <div className="form-group">
            <label htmlFor="search">Search Company or Contact Name</label>
            <input
              type="text"
              id="search"
              className="form-control"
              placeholder="Start typing company name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="search-results">
            {searchQuery && filteredCustomers.length === 0 ? (
              <p className="text-center" style={{ color: 'var(--text-muted)', padding: '1rem', fontSize: '0.9rem' }}>
                No customers found matching "{searchQuery}"
              </p>
            ) : (
              filteredCustomers.map(customer => (
                <div 
                  key={customer.id} 
                  className="search-item glass-card"
                  onClick={() => onSelectCustomer(customer)}
                >
                  <div>
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{customer.company_name}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contact: {customer.contact_name}</span>
                  </div>
                  <button className="nav-btn" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', color: 'var(--accent-cyan)' }}>
                    Select →
                  </button>
                </div>
              ))
            )}
            {!searchQuery && (
              <p className="text-center" style={{ color: 'var(--text-muted)', padding: '2rem 1rem', fontSize: '0.85rem' }}>
                Type in the search bar above to query existing records.
              </p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="companyName">Company Name *</label>
            <input
              type="text"
              id="companyName"
              className="form-control"
              placeholder="e.g. Acme Corporation"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactName">Contact Person *</label>
            <input
              type="text"
              id="contactName"
              className="form-control"
              placeholder="e.g. John Doe"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              className="form-control"
              placeholder="e.g. +1 (555) 0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="e.g. j.doe@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary mt-1" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Registering...
              </>
            ) : (
              'Start Sales Session'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
