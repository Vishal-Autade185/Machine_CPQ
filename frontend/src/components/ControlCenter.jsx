import React, { useState, useEffect, useRef } from 'react';
import config from '../config';

export default function ControlCenter({ token }) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'machines' | 'quotes'
  const [inventory, setInventory] = useState([]);
  const [machines, setMachines] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ----------------------------------------------------
  // Fetch Data pools
  // ----------------------------------------------------
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Master Inventory (including inactive)
      const invRes = await fetch(`${config.API_URL}/inventory/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!invRes.ok) throw new Error('Failed to load master inventory.');
      const invData = await invRes.json();
      setInventory(invData);

      // 2. Fetch Machines catalog
      const machRes = await fetch(`${config.API_URL}/machines`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!machRes.ok) throw new Error('Failed to load machine designs.');
      const machData = await machRes.json();
      setMachines(machData);

      // 3. Fetch Quote history logs
      const qRes = await fetch(`${config.API_URL}/quotes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!qRes.ok) throw new Error('Failed to load quotes pipeline.');
      const qData = await qRes.json();
      setQuotes(qData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, token]);


  // ====================================================
  // TAB 1: MASTER INVENTORY STATE & ACTIONS
  // ====================================================
  const [showPartModal, setShowPartModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [partSku, setPartSku] = useState('');
  const [partName, setPartName] = useState('');
  const [partCategory, setPartCategory] = useState('');
  const [partRate, setPartRate] = useState('');
  const [partSearch, setPartSearch] = useState('');

  const openAddPart = () => {
    setEditingPart(null);
    setPartSku('');
    setPartName('');
    setPartCategory('');
    setPartRate('');
    setShowPartModal(true);
  };

  const openEditPart = (part) => {
    setEditingPart(part);
    setPartSku(part.sku);
    setPartName(part.name);
    setPartCategory(part.category || '');
    setPartRate(part.rate);
    setShowPartModal(true);
  };

  const handleSavePart = async (e) => {
    e.preventDefault();
    if (!partSku || !partName || !partRate) return;

    try {
      const url = editingPart 
        ? `${config.API_URL}/inventory/${editingPart.id}`
        : `${config.API_URL}/inventory`;
      
      const method = editingPart ? 'PUT' : 'POST';
      const body = {
        sku: partSku.toUpperCase(),
        name: partName,
        category: partCategory,
        rate: parseFloat(partRate),
        is_active: editingPart ? editingPart.is_active : true
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save inventory item.');

      setShowPartModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSoftDeletePart = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate (soft-delete) this part? It will be hidden from new dropdown options but will preserve existing quote integrity.")) return;

    try {
      const response = await fetch(`${config.API_URL}/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to soft-delete item.');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReactivatePart = async (part) => {
    try {
      const response = await fetch(`${config.API_URL}/inventory/${part.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sku: part.sku,
          name: part.name,
          category: part.category,
          rate: part.rate,
          is_active: true
        })
      });
      if (!response.ok) throw new Error('Failed to reactivate item.');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredParts = inventory.filter(p => 
    p.name.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(partSearch.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(partSearch.toLowerCase()))
  );


  // ====================================================
  // TAB 2: MACHINE SETUP & IMAGE MAPPING STUDIO
  // ====================================================
  const [studioMachine, setStudioMachine] = useState(null); // When set, loads the 70/30 Mapping Studio
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [newMachineName, setNewMachineName] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Mapping Studio Hotspot editing state
  const [studioHotspots, setStudioHotspots] = useState([]); // [{ id, name, type, x, y, dropdowns: [] }]
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const imageCanvasRef = useRef(null);

  const openAddMachine = () => {
    setNewMachineName('');
    setUploadedImageUrl('');
    setShowMachineModal(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${config.API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed.');
      setUploadedImageUrl(data.url);
    } catch (err) {
      alert(`Cloudinary Upload Error: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateMachine = async (e) => {
    e.preventDefault();
    if (!newMachineName) return;

    try {
      const response = await fetch(`${config.API_URL}/machines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newMachineName,
          imageUrl: uploadedImageUrl,
          hotspots: []
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create machine.');

      setShowMachineModal(false);
      // Immediately open in Mapping Studio
      loadMappingStudio(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const loadMappingStudio = (machine) => {
    setStudioMachine(machine);
    const hList = typeof machine.hotspots === 'string' 
      ? JSON.parse(machine.hotspots) 
      : machine.hotspots || [];
    setStudioHotspots(hList);
    setSelectedHotspot(null);
  };

  const handleCanvasClick = (e) => {
    if (!imageCanvasRef.current) return;
    const rect = imageCanvasRef.current.getBoundingClientRect();
    
    // Calculate click coordinates as percentages
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Create a new hotspot draft
    const newHs = {
      id: `hs_${Date.now()}`,
      name: `New Hotspot ${studioHotspots.length + 1}`,
      type: 'mandatory',
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2)),
      dropdowns: []
    };

    setStudioHotspots(prev => [...prev, newHs]);
    setSelectedHotspot(newHs);
  };

  const handleSaveHotspotConfig = (updatedHs) => {
    setStudioHotspots(prev => prev.map(h => h.id === updatedHs.id ? updatedHs : h));
    setSelectedHotspot(updatedHs);
  };

  const handleDeleteHotspot = (hsId) => {
    setStudioHotspots(prev => prev.filter(h => h.id !== hsId));
    setSelectedHotspot(null);
  };

  const handleSaveMachineCanvas = async () => {
    if (!studioMachine) return;

    try {
      const response = await fetch(`${config.API_URL}/machines/${studioMachine.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: studioMachine.name,
          imageUrl: studioMachine.image_url,
          hotspots: studioHotspots
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save configurations.');

      alert("Machine layout saved successfully!");
      setStudioMachine(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMachine = async (id) => {
    if (!window.confirm("Are you sure you want to delete this machine layout?")) return;

    try {
      const response = await fetch(`${config.API_URL}/machines/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete machine layout.');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };


  // ====================================================
  // TAB 3: PIPELINE LOGS SUMMARY CALCULATORS
  // ====================================================
  const [quoteSearch, setQuoteSearch] = useState('');
  
  const pipelineTotal = quotes.reduce((sum, q) => sum + parseFloat(q.total), 0);
  const averageQuoteVal = quotes.length > 0 ? (pipelineTotal / quotes.length) : 0;

  const filteredQuotes = quotes.filter(q => 
    q.quote_number.toLowerCase().includes(quoteSearch.toLowerCase()) ||
    q.customer_details.companyName.toLowerCase().includes(quoteSearch.toLowerCase())
  );


  // ----------------------------------------------------
  // RENDER INTERFACES
  // ----------------------------------------------------

  // 1. RENDER MAPPING STUDIO VIEW
  if (studioMachine) {
    return (
      <div className="container">
        <div className="d-flex justify-between align-center mb-1">
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Image Mapping Studio</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Configuring canvas for <strong style={{ color: 'var(--text-primary)' }}>{studioMachine.name}</strong>. Clicks place hotspots.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="nav-btn" onClick={() => setStudioMachine(null)} style={{ border: '1px solid var(--border-color)' }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSaveMachineCanvas} style={{ width: 'auto', padding: '0.5rem 1.5rem' }}>
              Save Machine Design
            </button>
          </div>
        </div>

        <div className="admin-layout">
          {/* Left Pane - 70% Canvas overlay */}
          <div className="admin-canvas-pane glass-panel" style={{ padding: '2rem' }}>
            <div className="canvas-wrapper crosshair-cursor" onClick={handleCanvasClick}>
              <img 
                ref={imageCanvasRef}
                src={studioMachine.image_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60'} 
                alt={studioMachine.name}
                className="canvas-image"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60';
                }}
              />

              {studioHotspots.map(hs => (
                <div
                  key={hs.id}
                  className={`hotspot-dot ${hs.type === 'mandatory' ? 'mandatory' : 'optional'} ${selectedHotspot?.id === hs.id ? 'selected' : ''}`}
                  style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation(); // prevent adding new dot
                    setSelectedHotspot(hs);
                  }}
                />
              ))}
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              💡 Hover and click directly on the machinery components above to overlay a pulsing hotspot. Select a hotspot to configure dropdown selectors.
            </p>
          </div>

          {/* Right Pane - 30% Dynamic Form Builder */}
          <div className="admin-sidebar-pane glass-panel">
            {selectedHotspot ? (
              <HotspotFormBuilder
                hotspot={selectedHotspot}
                inventory={inventory.filter(p => p.is_active)} // Only active parts mapped to dropdowns
                onSave={handleSaveHotspotConfig}
                onDelete={handleDeleteHotspot}
              />
            ) : (
              <div className="text-center" style={{ padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <h3>No Hotspot Selected</h3>
                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  Click an existing dot or click on the image canvas to create a new hotspot.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. RENDER ADMIN PORTAL VIEWS
  return (
    <div className="container">
      <div className="d-flex justify-between align-center mb-1">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Control Center</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            System configuration console (Admin Access)
          </p>
        </div>
      </div>

      <div className="tab-headers">
        <button 
          className={`tab-header ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Master Inventory
        </button>
        <button 
          className={`tab-header ${activeTab === 'machines' ? 'active' : ''}`}
          onClick={() => setActiveTab('machines')}
        >
          Machine Layouts
        </button>
        <button 
          className={`tab-header ${activeTab === 'quotes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotes')}
        >
          Pipeline & Log Summary
        </button>
      </div>

      {loading && (
        <div className="text-center" style={{ padding: '3rem' }}>
          <span className="spinner"></span>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Loading control configurations...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* ================================================== */}
          // TAB 1: INVENTORY CRUD TABLE
          {/* ================================================== */}
          {activeTab === 'inventory' && (
            <div>
              <div className="d-flex justify-between align-center mb-1" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by SKU, part name, or category..."
                  style={{ maxWidth: '380px' }}
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                />
                <button className="btn-primary" onClick={openAddPart} style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>
                  + Add Inventory Part
                </button>
              </div>

              <div className="data-table-wrapper glass-panel">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU (Part Number)</th>
                      <th>Part Name</th>
                      <th>Category</th>
                      <th>Base Rate</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                          No parts found matching search query.
                        </td>
                      </tr>
                    ) : (
                      filteredParts.map(part => (
                        <tr key={part.id} className={!part.is_active ? 'inactive' : ''}>
                          <td><code>{part.sku}</code></td>
                          <td style={{ fontWeight: 600 }}>{part.name}</td>
                          <td>{part.category || '—'}</td>
                          <td>${parseFloat(part.rate).toFixed(2)}</td>
                          <td>
                            <span className={`badge ${part.is_active ? 'active' : 'inactive'}`}>
                              {part.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="nav-btn" onClick={() => openEditPart(part)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
                              Edit
                            </button>
                            {part.is_active ? (
                              <button className="nav-btn text-danger" onClick={() => handleSoftDeletePart(part.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                Deactivate
                              </button>
                            ) : (
                              <button className="nav-btn text-success" onClick={() => handleReactivatePart(part)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                Reactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================== */}
          // TAB 2: MACHINE SETUP DASHBOARD
          {/* ================================================== */}
          {activeTab === 'machines' && (
            <div>
              <div className="d-flex justify-between align-center mb-1">
                <h3>Machine Templates</h3>
                <button className="btn-primary" onClick={openAddMachine} style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>
                  + Create New Machine
                </button>
              </div>

              <div className="grid-container">
                {machines.length === 0 ? (
                  <div className="glass-panel text-center" style={{ padding: '4rem 2rem', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
                    <h3>No machine setups created yet.</h3>
                    <p style={{ marginTop: '0.5rem' }}>Click "Create New Machine" to upload a design and start mapping hotspots.</p>
                  </div>
                ) : (
                  machines.map(machine => (
                    <div key={machine.id} className="machine-card glass-panel">
                      <img 
                        src={machine.image_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60'} 
                        alt={machine.name} 
                        className="machine-thumbnail"
                      />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{machine.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 1rem' }}>
                        {machine.hotspots ? JSON.parse(JSON.stringify(machine.hotspots)).length : 0} configured hotspots
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button className="nav-btn active" onClick={() => loadMappingStudio(machine)} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                          Edit Hotspots
                        </button>
                        <button className="nav-btn text-danger" onClick={() => handleDeleteMachine(machine.id)} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================================================== */}
          // TAB 3: PIPELINE SUMMARY & QUOTE HISTORY LOGS
          {/* ================================================== */}
          {activeTab === 'quotes' && (
            <div>
              <div className="kpi-row">
                <div className="kpi-card glass-panel">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Pipeline Value</span>
                  <div className="kpi-num">${pipelineTotal.toFixed(2)}</div>
                </div>
                <div className="kpi-card glass-panel">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Average Proposal Size</span>
                  <div className="kpi-num">${averageQuoteVal.toFixed(2)}</div>
                </div>
                <div className="kpi-card glass-panel">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Quotes Issued</span>
                  <div className="kpi-num">{quotes.length} Proposals</div>
                </div>
              </div>

              <div className="d-flex justify-between align-center mb-1">
                <h3>Historical Quote Logs</h3>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by quote ref or company name..."
                  style={{ maxWidth: '380px' }}
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                />
              </div>

              <div className="data-table-wrapper glass-panel">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Quote Ref #</th>
                      <th>Date</th>
                      <th>Customer Company</th>
                      <th>Machine Configuration</th>
                      <th style={{ textAlign: 'right' }}>Proposal Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotes.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                          No proposal records logged.
                        </td>
                      </tr>
                    ) : (
                      filteredQuotes.map(quote => (
                        <tr key={quote.id}>
                          <td><strong style={{ color: 'var(--accent-cyan)' }}>{quote.quote_number}</strong></td>
                          <td>{new Date(quote.created_at).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 600 }}>{quote.customer_details.companyName}</td>
                          <td>{quote.machine_name}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                            ${parseFloat(quote.total).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* CRUD Inventory Part Add/Edit Modal */}
      {showPartModal && (
        <div className="modal-overlay" onClick={() => setShowPartModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1.5rem' }}>
              {editingPart ? 'Modify Inventory Part' : 'Add New Inventory Part'}
            </h3>

            <form onSubmit={handleSavePart}>
              <div className="form-group">
                <label htmlFor="sku">SKU (Part Number) *</label>
                <input
                  type="text"
                  id="sku"
                  className="form-control"
                  placeholder="e.g. MOT-5HP-02"
                  value={partSku}
                  onChange={(e) => setPartSku(e.target.value)}
                  disabled={editingPart !== null}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pname">Part Name *</label>
                <input
                  type="text"
                  id="pname"
                  className="form-control"
                  placeholder="e.g. 5HP Industrial Motor"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  className="form-control"
                  placeholder="e.g. Power Units"
                  value={partCategory}
                  onChange={(e) => setPartCategory(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="rate">Base Rate ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  id="rate"
                  className="form-control"
                  placeholder="e.g. 850.00"
                  value={partRate}
                  onChange={(e) => setPartRate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="nav-btn" onClick={() => setShowPartModal(false)} style={{ flex: 1, border: '1px solid var(--border-color)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Machine Create Modal (Includes Cloudinary streaming) */}
      {showMachineModal && (
        <div className="modal-overlay" onClick={() => setShowMachineModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1.5rem' }}>Create New Machine Model</h3>

            <form onSubmit={handleCreateMachine}>
              <div className="form-group">
                <label htmlFor="mname">Machine Name *</label>
                <input
                  type="text"
                  id="mname"
                  className="form-control"
                  placeholder="e.g. Hydro-Drive Pump Mill 4000"
                  value={newMachineName}
                  onChange={(e) => setNewMachineName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mimage">Base 2D Image (Cloudinary Stream) *</label>
                <input
                  type="file"
                  id="mimage"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  required={!uploadedImageUrl}
                />
                {uploadingImage && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '0.5rem' }}>
                    <span className="spinner"></span> Streaming image directly to Cloudinary CDN...
                  </p>
                )}
                {uploadedImageUrl && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-green)', marginTop: '0.5rem' }}>
                    ✓ Uploaded successfully. Image URL resolved!
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="nav-btn" onClick={() => setShowMachineModal(false)} style={{ flex: 1, border: '1px solid var(--border-color)' }} disabled={uploadingImage}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={uploadingImage || !uploadedImageUrl}>
                  Next: Open Mapping Studio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// DYNAMIC NESTED FORM BUILDER SUB-COMPONENT (RIGHT PANE)
// ----------------------------------------------------
function HotspotFormBuilder({ hotspot, inventory, onSave, onDelete }) {
  const [name, setName] = useState(hotspot.name);
  const [type, setType] = useState(hotspot.type);
  const [dropdowns, setDropdowns] = useState(hotspot.dropdowns || []);

  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
  const [partSearchQuery, setPartSearchQuery] = useState('');

  // Sync state with selected hotspot changes
  useEffect(() => {
    setName(hotspot.name);
    setType(hotspot.type);
    setDropdowns(hotspot.dropdowns || []);
    setActiveDropdownIndex(null);
    setPartSearchQuery('');
  }, [hotspot]);

  const handleAddField = () => {
    const newDd = {
      id: `dd_${Date.now()}`,
      label: 'Select Component',
      options: [] // [{ partId, quantity }]
    };
    setDropdowns(prev => [...prev, newDd]);
  };

  const handleRemoveField = (idx) => {
    setDropdowns(prev => prev.filter((_, i) => i !== idx));
    if (activeDropdownIndex === idx) {
      setActiveDropdownIndex(null);
    }
  };

  const handleDropdownLabelChange = (idx, labelVal) => {
    setDropdowns(prev => prev.map((dd, i) => i === idx ? { ...dd, label: labelVal } : dd));
  };

  const handleAddOptionToDropdown = (ddIdx, partId) => {
    setDropdowns(prev => prev.map((dd, i) => {
      if (i !== ddIdx) return dd;
      
      // Prevent duplicates in same dropdown
      if (dd.options.some(o => o.partId === partId)) return dd;

      return {
        ...dd,
        options: [...dd.options, { partId, quantity: 1 }]
      };
    }));
    setPartSearchQuery('');
  };

  const handleRemoveOptionFromDropdown = (ddIdx, partId) => {
    setDropdowns(prev => prev.map((dd, i) => {
      if (i !== ddIdx) return dd;
      return {
        ...dd,
        options: dd.options.filter(o => o.partId !== partId)
      };
    }));
  };

  const handleOptionQtyChange = (ddIdx, partId, qtyVal) => {
    setDropdowns(prev => prev.map((dd, i) => {
      if (i !== ddIdx) return dd;
      return {
        ...dd,
        options: dd.options.map(o => o.partId === partId ? { ...o, quantity: parseInt(qtyVal, 10) || 1 } : o)
      };
    }));
  };

  const triggerSave = () => {
    onSave({
      ...hotspot,
      name,
      type,
      dropdowns
    });
  };

  // Filter active inventory parts for search dropdown options mapping
  const filteredPartsForOptions = inventory.filter(p => 
    p.name.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(partSearchQuery.toLowerCase())
  );

  return (
    <div>
      <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1.25rem' }}>Configure Hotspot</h3>

      <div className="form-group">
        <label htmlFor="hname">Hotspot Identifier Label</label>
        <input
          type="text"
          id="hname"
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={triggerSave}
        />
      </div>

      <div className="form-group">
        <label>Requirement Guardrail</label>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="htype" 
              value="mandatory" 
              checked={type === 'mandatory'} 
              onChange={() => { setType('mandatory'); onSave({ ...hotspot, name, type: 'mandatory', dropdowns }); }}
            />
            <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>Mandatory (Red)</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="htype" 
              value="optional" 
              checked={type === 'optional'}
              onChange={() => { setType('optional'); onSave({ ...hotspot, name, type: 'optional', dropdowns }); }}
            />
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Optional (Grey)</span>
          </label>
        </div>
      </div>

      <div style={{ margin: '1.5rem 0 1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <div className="d-flex justify-between align-center mb-1">
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Smart Dropdowns</h4>
          <button className="nav-btn" onClick={handleAddField} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', color: 'var(--accent-cyan)' }}>
            + Add Dropdown
          </button>
        </div>

        {dropdowns.map((dd, ddIdx) => (
          <div key={dd.id} className="form-builder-block">
            <div className="d-flex justify-between align-center mb-1">
              <input
                type="text"
                className="form-control"
                style={{ height: '32px', fontSize: '0.85rem', padding: '0.25rem 0.5rem' }}
                value={dd.label}
                onChange={(e) => handleDropdownLabelChange(ddIdx, e.target.value)}
                onBlur={triggerSave}
              />
              <button 
                type="button" 
                className="option-remove-btn" 
                onClick={() => { handleRemoveField(ddIdx); triggerSave(); }}
                style={{ marginLeft: '0.5rem' }}
              >
                🗑
              </button>
            </div>

            {/* Configured options pills list */}
            <div style={{ margin: '0.5rem 0' }}>
              {dd.options.map(opt => {
                const part = inventory.find(p => p.id === opt.partId) || { name: 'Part Deactivated', sku: 'N/A' };
                return (
                  <div key={opt.partId} className="option-pill" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '0.5rem', gap: '0.25rem', width: '100%' }}>
                    <div className="d-flex justify-between align-center">
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {part.name} (SKU: {part.sku})
                      </span>
                      <button 
                        type="button" 
                        className="option-remove-btn" 
                        onClick={() => { handleRemoveOptionFromDropdown(ddIdx, opt.partId); triggerSave(); }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="d-flex align-center gap-1">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Quantity:</span>
                      <input
                        type="number"
                        min="1"
                        style={{ width: '60px', height: '20px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.75rem', padding: '0 0.25rem' }}
                        value={opt.quantity}
                        onChange={(e) => handleOptionQtyChange(ddIdx, opt.partId, e.target.value)}
                        onBlur={triggerSave}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Select part search bar */}
            {activeDropdownIndex === ddIdx ? (
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '30px', fontSize: '0.8rem', padding: '0.25rem' }}
                  placeholder="Search parts by name/SKU..."
                  value={partSearchQuery}
                  onChange={(e) => setPartSearchQuery(e.target.value)}
                />
                <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', marginTop: '0.25rem' }}>
                  {partSearchQuery && filteredPartsForOptions.map(p => (
                    <div
                      key={p.id}
                      style={{ padding: '0.4rem', fontSize: '0.75rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onClick={() => {
                        handleAddOptionToDropdown(ddIdx, p.id);
                        setActiveDropdownIndex(null);
                        triggerSave();
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(6, 182, 212, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      {p.name} (SKU: {p.sku}) - ${parseFloat(p.rate).toFixed(2)}
                    </div>
                  ))}
                  {!partSearchQuery && (
                    <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
                      Type above to search...
                    </p>
                  )}
                </div>
                <button 
                  type="button" 
                  className="nav-btn" 
                  style={{ fontSize: '0.7rem', marginTop: '0.25rem', padding: '0.1rem 0.3rem' }}
                  onClick={() => setActiveDropdownIndex(null)}
                >
                  Cancel Search
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="nav-btn"
                style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', padding: '0.2rem 0.5rem', width: '100%', border: '1px dashed rgba(6, 182, 212, 0.3)' }}
                onClick={() => { setActiveDropdownIndex(ddIdx); setPartSearchQuery(''); }}
              >
                + Link Inventory Part
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
        <button 
          className="btn-primary" 
          onClick={() => { if (window.confirm("Delete this hotspot?")) { onDelete(hotspot.id); } }}
          style={{ background: 'linear-gradient(135deg, var(--accent-red) 0%, #b91c1c 100%)', boxShadow: 'none' }}
        >
          Remove Hotspot Dot
        </button>
      </div>
    </div>
  );
}
