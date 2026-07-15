import React, { useState, useEffect } from 'react';
import config from '../config';

export default function VisualConfigurator({ token, customer, machine, onBack, onSessionEnd }) {
  const [inventory, setInventory] = useState([]);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [selections, setSelections] = useState({}); // { hotspotId: { dropdownId: partId } }
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [savingQuote, setSavingQuote] = useState(false);
  const [savedQuote, setSavedQuote] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch active inventory on load to map details (name, rate, SKU) to options
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(`${config.API_URL}/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load inventory.');
        const data = await response.json();
        setInventory(data);
      } catch (err) {
        console.error("Inventory load error:", err.message);
      } finally {
        setLoadingInventory(false);
      }
    };
    fetchInventory();
  }, [token]);

  // Parse hotspots safely (since they are stored as JSONB array)
  const hotspotsList = typeof machine.hotspots === 'string' 
    ? JSON.parse(machine.hotspots) 
    : machine.hotspots || [];

  // Helper: Get item details from inventory pool
  const getPartDetails = (partId) => {
    return inventory.find(p => p.id === partId) || { name: 'Component Out of Stock', rate: 0, sku: 'N/A' };
  };

  // Check if a specific hotspot is completely configured
  const isHotspotConfigured = (hotspot) => {
    const hsSelections = selections[hotspot.id];
    if (!hsSelections) return false;
    
    // Check if every dropdown defined inside the hotspot has a selected part
    return hotspot.dropdowns.every(dd => hsSelections[dd.id] && hsSelections[dd.id] !== '');
  };

  // Check how many mandatory hotspots are still unconfigured
  const getUnconfiguredMandatoryCount = () => {
    return hotspotsList
      .filter(hs => hs.type === 'mandatory')
      .filter(hs => !isHotspotConfigured(hs)).length;
  };

  // Handle option selection
  const handleSelectOption = (hotspotId, dropdownId, partId) => {
    setSelections(prev => {
      const updatedHs = { ...prev[hotspotId], [dropdownId]: partId };
      
      // If the selection is cleared (empty string), clean up keys
      if (!partId) {
        delete updatedHs[dropdownId];
      }
      
      const newSelections = { ...prev, [hotspotId]: updatedHs };
      
      // If no dropdowns are configured for this hotspot, delete it
      if (Object.keys(newSelections[hotspotId]).length === 0) {
        delete newSelections[hotspotId];
      }
      
      return newSelections;
    });
  };

  // Calculate itemized selections list for estimate sidebar
  const getSelectedItemsSummary = () => {
    const summary = [];
    
    Object.keys(selections).forEach(hsId => {
      const hotspot = hotspotsList.find(h => h.id === hsId);
      if (!hotspot) return;

      Object.keys(selections[hsId]).forEach(ddId => {
        const dropdown = hotspot.dropdowns.find(d => d.id === ddId);
        const partId = selections[hsId][ddId];
        if (!dropdown || !partId) return;

        // Find the option detail to get quantity
        const option = dropdown.options.find(opt => opt.partId === partId);
        const qty = option ? (option.quantity || 1) : 1;
        const part = getPartDetails(partId);

        summary.push({
          hotspotId: hsId,
          dropdownId: ddId,
          partId,
          name: part.name,
          sku: part.sku,
          quantity: qty,
          rate: parseFloat(part.rate),
          total: qty * parseFloat(part.rate),
          label: `${hotspot.name} (${dropdown.label})`
        });
      });
    });

    return summary;
  };

  const selectedItems = getSelectedItemsSummary();
  const grandTotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const unconfiguredMandatoryCount = getUnconfiguredMandatoryCount();
  const isQuoteReady = unconfiguredMandatoryCount === 0 && selectedItems.length > 0;

  // Handle final save and checkout API submission
  const handleGenerateQuote = async () => {
    if (!isQuoteReady) return;
    setSavingQuote(true);

    try {
      // 1. Simulate compile delay for PDF rendering
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Post Quote payload to Server
      const response = await fetch(`${config.API_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: customer.id,
          machineName: machine.name,
          items: selectedItems.map(item => ({
            partNumber: item.sku,
            name: item.name,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total
          })),
          total: grandTotal
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to record quote.');
      
      setSavedQuote(data);
      setShowPreview(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingQuote(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="container">
      <div className="d-flex justify-between align-center mb-1">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Configuring: {machine.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Customer: <strong style={{ color: 'var(--text-primary)' }}>{customer.company_name}</strong> ({customer.contact_name})
          </p>
        </div>
        <button className="nav-btn no-print" onClick={onBack} disabled={savingQuote}>
          ← Back to Catalog
        </button>
      </div>

      <div className="config-layout">
        {/* Left Pane - 65% Interactive Hotspots Canvas */}
        <div className="canvas-pane glass-panel no-print" style={{ padding: '2rem' }}>
          {loadingInventory ? (
            <div className="text-center" style={{ padding: '4rem' }}>
              <span className="spinner"></span>
              <p style={{ color: 'var(--text-secondary)', marginTop: '1.5rem' }}>Mapping components...</p>
            </div>
          ) : (
            <div className="canvas-wrapper">
              <img 
                src={machine.image_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60'} 
                alt={machine.name}
                className="canvas-image"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60';
                }}
              />

              {hotspotsList.map(hs => {
                const isConfigured = isHotspotConfigured(hs);
                const isSelected = activeHotspot && activeHotspot.id === hs.id;
                
                let dotClass = 'optional';
                if (hs.type === 'mandatory') dotClass = 'mandatory';
                if (isConfigured) dotClass = 'configured';
                if (isSelected) dotClass = 'selected';

                return (
                  <div
                    key={hs.id}
                    className={`hotspot-dot ${dotClass}`}
                    style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                    onClick={() => setActiveHotspot(isSelected ? null : hs)}
                    title={hs.name}
                  />
                );
              })}

              {/* Floating coordinate popover */}
              {activeHotspot && (
                <div 
                  className="popover-menu glass-panel"
                  style={{ 
                    left: `${activeHotspot.x}%`, 
                    top: `${activeHotspot.y}%`,
                  }}
                >
                  <div className="popover-arrow" />
                  <div className="d-flex justify-between align-center mb-1">
                    <span className="popover-title">{activeHotspot.name}</span>
                    <button 
                      onClick={() => setActiveHotspot(null)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
                    >
                      ×
                    </button>
                  </div>

                  {activeHotspot.dropdowns.map(dd => (
                    <div key={dd.id} className="form-group">
                      <label htmlFor={dd.id}>{dd.label}</label>
                      <select
                        id={dd.id}
                        className="form-control"
                        value={selections[activeHotspot.id]?.[dd.id] || ''}
                        onChange={(e) => handleSelectOption(activeHotspot.id, dd.id, e.target.value)}
                      >
                        <option value="">-- Choose Option --</option>
                        {dd.options.map(opt => {
                          const item = getPartDetails(opt.partId);
                          // Calculate item sub-label including rate
                          const subLabel = `${item.name} (${opt.quantity > 1 ? `${opt.quantity}x` : ''} $${(parseFloat(item.rate) * opt.quantity).toFixed(2)})`;
                          return (
                            <option key={opt.partId} value={opt.partId}>
                              {subLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div className="d-flex align-center gap-1">
              <span className="hotspot-dot mandatory" style={{ position: 'relative', display: 'inline-block', transform: 'none', left: 0, top: 0, width: '12px', height: '12px' }} />
              <span>Mandatory (Action Required)</span>
            </div>
            <div className="d-flex align-center gap-1">
              <span className="hotspot-dot optional" style={{ position: 'relative', display: 'inline-block', transform: 'none', left: 0, top: 0, width: '12px', height: '12px' }} />
              <span>Optional (Unconfigured)</span>
            </div>
            <div className="d-flex align-center gap-1">
              <span className="hotspot-dot configured" style={{ position: 'relative', display: 'inline-block', transform: 'none', left: 0, top: 0, width: '12px', height: '12px' }} />
              <span>Configured</span>
            </div>
          </div>
        </div>

        {/* Right Pane - 35% Live Estimate Sidebar */}
        <div className="sidebar-pane glass-panel no-print">
          <h3 className="quote-sidebar-title">Live Estimate</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            Quote for: {customer.company_name}
          </p>

          <div className="estimate-items-list">
            {selectedItems.length === 0 ? (
              <p className="text-center" style={{ padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No parts configured yet. Click a pulsing dot on the machine canvas to select parts.
              </p>
            ) : (
              selectedItems.map(item => (
                <div key={`${item.hotspotId}-${item.dropdownId}`} className="estimate-item-row slide-in">
                  <div>
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{item.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {item.sku}</span>
                  </div>
                  <div style={{ textAlignment: 'right', fontWeight: 600 }}>
                    <span>{item.quantity} × ${item.rate.toFixed(2)}</span>
                    <span style={{ display: 'block', color: 'var(--accent-cyan)' }}>${item.total.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="estimate-total-bar">
            <div className="total-row">
              <span>Total:</span>
              <span style={{ color: 'var(--accent-cyan)' }}>${grandTotal.toFixed(2)}</span>
            </div>

            {unconfiguredMandatoryCount > 0 && (
              <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.08)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.15)', marginBottom: '1rem', textAlign: 'center' }}>
                ⚠️ Requires {unconfiguredMandatoryCount} mandatory component{unconfiguredMandatoryCount > 1 ? 's' : ''} to complete configuration.
              </div>
            )}

            <button 
              className="btn-primary" 
              disabled={!isQuoteReady || savingQuote}
              onClick={handleGenerateQuote}
            >
              {savingQuote ? (
                <>
                  <span className="spinner"></span>
                  Compiling PDF Quote...
                </>
              ) : (
                'Generate Official Quote'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quote Preview Invoice Modal (Overlay and Printable container) */}
      {showPreview && savedQuote && (
        <div className="modal-overlay print-modal" onClick={() => setShowPreview(false)}>
          <div className="modal-content print-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="quote-print-card">
              <div className="quote-print-header">
                <div>
                  <h1 className="quote-logo">APEX CONFIG</h1>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} className="no-print">
                    Official Proposal & Estimate
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Proposal</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Number: <strong style={{ color: 'var(--text-primary)' }}>{savedQuote.quote_number}</strong>
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Date: {new Date(savedQuote.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', margin: '2rem 0' }}>
                <div>
                  <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                    Prepared For:
                  </h4>
                  <strong style={{ display: 'block', fontSize: '1.1rem' }}>{savedQuote.customer_details.companyName}</strong>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Attn: {savedQuote.customer_details.contactName}
                  </span>
                  {savedQuote.customer_details.phone && (
                    <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Phone: {savedQuote.customer_details.phone}
                    </span>
                  )}
                  {savedQuote.customer_details.email && (
                    <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Email: {savedQuote.customer_details.email}
                    </span>
                  )}
                </div>
                <div>
                  <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                    System Model Configuration:
                  </h4>
                  <strong style={{ display: 'block', fontSize: '1.1rem' }}>{savedQuote.machine_name}</strong>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    ApexConfig Certified Compatible Layout
                  </span>
                </div>
              </div>

              <table className="quote-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>SKU</th>
                    <th style={{ textAlign: 'left' }}>Component Description</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Rate</th>
                    <th style={{ textAlign: 'right' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {typeof savedQuote.items === 'string' 
                    ? JSON.parse(savedQuote.items).map((item, idx) => (
                      <tr key={idx}>
                        <td><code>{item.partNumber}</code></td>
                        <td>{item.name}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>${parseFloat(item.rate).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>${parseFloat(item.total).toFixed(2)}</td>
                      </tr>
                    ))
                    : savedQuote.items.map((item, idx) => (
                      <tr key={idx}>
                        <td><code>{item.partNumber}</code></td>
                        <td>{item.name}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>${parseFloat(item.rate).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>${parseFloat(item.total).toFixed(2)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>

              <div className="quote-total">
                <span>Grand Total:</span>
                <span style={{ color: 'var(--accent-cyan)', marginLeft: '1rem' }}>
                  ${parseFloat(savedQuote.total).toFixed(2)}
                </span>
              </div>

              <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="quote-actions no-print">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Press Print to export this proposal directly to PDF or print hardware.
                </span>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="nav-btn" onClick={() => setShowPreview(false)} style={{ border: '1px solid var(--border-color)' }}>
                    Modify Configuration
                  </button>
                  <button className="btn-primary" onClick={triggerPrint} style={{ width: 'auto', padding: '0.5rem 1.5rem' }}>
                    Print proposal
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={onSessionEnd} 
                    style={{ width: 'auto', padding: '0.5rem 1.5rem', background: 'linear-gradient(135deg, var(--accent-green) 0%, #059669 100%)', boxShadow: 'none' }}
                  >
                    Finish Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
