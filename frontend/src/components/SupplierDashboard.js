import React, { useState } from 'react';

const SupplierDashboard = () => {
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      address: '0x742d35Cc6634C0532925a3b844Bc8c3d',
      name: 'Global Coffee Farms',
      deliveryScore: '*** Encrypted ***',
      qualityScore: '*** Encrypted ***',
      complianceScore: '*** Encrypted ***',
      totalVolume: '*** Encrypted ***',
      status: 'Verified',
      lastAudit: '2024-01-15'
    },
    {
      id: 2,
      address: '0x3f2e4a5b6c7d8e9fa0b1c2d3e4f5',
      name: 'Organic Suppliers Ltd',
      deliveryScore: '*** Encrypted ***',
      qualityScore: '*** Encrypted ***',
      complianceScore: '*** Encrypted ***',
      totalVolume: '*** Encrypted ***',
      status: 'Verified',
      lastAudit: '2024-01-20'
    }
  ]);

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showAgreementForm, setShowAgreementForm] = useState(false);
  const [agreementForm, setAgreementForm] = useState({
    minQuantity: '',
    maxQuantity: '',
    pricePerUnit: '',
    discountRate: '',
    validDays: ''
  });

  const handleDecrypt = (supplierId, field) => {
    alert(`Requesting decryption for ${field}...\\nThis requires FHE permission from the supplier.`);
  };

  const handleAgreementChange = (e) => {
    setAgreementForm({
      ...agreementForm,
      [e.target.name]: e.target.value
    });
  };

  const submitAgreement = async (e) => {
    e.preventDefault();
    console.log('Creating agreement:', agreementForm);
    alert('Agreement created successfully!\\nAll terms have been encrypted using FHE.');
    setShowAgreementForm(false);
    setAgreementForm({
      minQuantity: '',
      maxQuantity: '',
      pricePerUnit: '',
      discountRate: '',
      validDays: ''
    });
  };

  return (
    <div className="supplier-dashboard">
      <h2>Supplier Management</h2>
      <p className="subtitle">Manage supplier relationships with privacy-preserved metrics</p>

      <div className="suppliers-grid">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="supplier-card">
            <div className="supplier-header">
              <h3>{supplier.name}</h3>
              <span className={`status-badge ${supplier.status.toLowerCase()}`}>
                {supplier.status}
              </span>
            </div>

            <div className="supplier-address">
              {supplier.address.slice(0, 10)}...{supplier.address.slice(-8)}
            </div>

            <div className="metrics-section">
              <h4>Performance Metrics</h4>
              <div className="metric-item">
                <span className="metric-label">Delivery Score:</span>
                <span className="encrypted-metric">{supplier.deliveryScore}</span>
                <button
                  className="decrypt-btn"
                  onClick={() => handleDecrypt(supplier.id, 'Delivery Score')}
                >
                  🔓
                </button>
              </div>
              <div className="metric-item">
                <span className="metric-label">Quality Score:</span>
                <span className="encrypted-metric">{supplier.qualityScore}</span>
                <button
                  className="decrypt-btn"
                  onClick={() => handleDecrypt(supplier.id, 'Quality Score')}
                >
                  🔓
                </button>
              </div>
              <div className="metric-item">
                <span className="metric-label">Compliance:</span>
                <span className="encrypted-metric">{supplier.complianceScore}</span>
                <button
                  className="decrypt-btn"
                  onClick={() => handleDecrypt(supplier.id, 'Compliance Score')}
                >
                  🔓
                </button>
              </div>
              <div className="metric-item">
                <span className="metric-label">Total Volume:</span>
                <span className="encrypted-metric">{supplier.totalVolume}</span>
                <button
                  className="decrypt-btn"
                  onClick={() => handleDecrypt(supplier.id, 'Total Volume')}
                >
                  🔓
                </button>
              </div>
            </div>

            <div className="audit-info">
              <span className="audit-label">Last Audit:</span>
              <span className="audit-date">{supplier.lastAudit}</span>
            </div>

            <div className="actions">
              <button
                className="action-btn primary"
                onClick={() => {
                  setSelectedSupplier(supplier);
                  setShowAgreementForm(true);
                }}
              >
                Create Agreement
              </button>
              <button className="action-btn secondary">View History</button>
            </div>
          </div>
        ))}
      </div>

      {showAgreementForm && (
        <div className="modal-overlay" onClick={() => setShowAgreementForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Supplier Agreement</h3>
            <p className="modal-subtitle">
              with {selectedSupplier?.name}
            </p>

            <form onSubmit={submitAgreement} className="agreement-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Min Quantity</label>
                  <input
                    type="number"
                    name="minQuantity"
                    value={agreementForm.minQuantity}
                    onChange={handleAgreementChange}
                    required
                    min="1"
                  />
                  <span className="encrypt-indicator">🔐</span>
                </div>
                <div className="form-group">
                  <label>Max Quantity</label>
                  <input
                    type="number"
                    name="maxQuantity"
                    value={agreementForm.maxQuantity}
                    onChange={handleAgreementChange}
                    required
                    min="1"
                  />
                  <span className="encrypt-indicator">🔐</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price Per Unit</label>
                  <input
                    type="number"
                    name="pricePerUnit"
                    value={agreementForm.pricePerUnit}
                    onChange={handleAgreementChange}
                    required
                    min="0"
                    step="0.01"
                  />
                  <span className="encrypt-indicator">🔐</span>
                </div>
                <div className="form-group">
                  <label>Discount Rate (%)</label>
                  <input
                    type="number"
                    name="discountRate"
                    value={agreementForm.discountRate}
                    onChange={handleAgreementChange}
                    required
                    min="0"
                    max="100"
                  />
                  <span className="encrypt-indicator">🔐</span>
                </div>
              </div>

              <div className="form-group">
                <label>Valid for (days)</label>
                <input
                  type="number"
                  name="validDays"
                  value={agreementForm.validDays}
                  onChange={handleAgreementChange}
                  required
                  min="1"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAgreementForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .supplier-dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }

        h2 {
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: #64748b;
          margin-bottom: 2rem;
        }

        .suppliers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .supplier-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .supplier-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }

        .supplier-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .supplier-header h3 {
          color: #1e293b;
          font-size: 1.2rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .status-badge.verified {
          background: #dcfce7;
          color: #166534;
        }

        .supplier-address {
          color: #6b7280;
          font-family: monospace;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .metrics-section {
          margin: 1.5rem 0;
        }

        .metrics-section h4 {
          color: #475569;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .metric-item {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          background: white;
          border-radius: 6px;
        }

        .metric-label {
          color: #64748b;
          font-size: 0.875rem;
          width: 120px;
        }

        .encrypted-metric {
          flex: 1;
          color: #6b7280;
          font-family: monospace;
          font-size: 0.875rem;
        }

        .decrypt-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
        }

        .decrypt-btn:hover {
          background: #5a67d8;
        }

        .audit-info {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: #fef3c7;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .audit-label {
          color: #92400e;
          font-weight: 500;
        }

        .audit-date {
          color: #78350f;
        }

        .actions {
          display: flex;
          gap: 0.75rem;
        }

        .action-btn {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.primary {
          background: #667eea;
          color: white;
        }

        .action-btn.primary:hover {
          background: #5a67d8;
        }

        .action-btn.secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .action-btn.secondary:hover {
          background: #eef2ff;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal h3 {
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .modal-subtitle {
          color: #64748b;
          margin-bottom: 1.5rem;
        }

        .agreement-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          position: relative;
        }

        .form-group label {
          display: block;
          color: #475569;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          padding-right: 2rem;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }

        .encrypt-indicator {
          position: absolute;
          right: 0.5rem;
          top: 2.25rem;
          color: #10b981;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .cancel-btn, .submit-btn {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .cancel-btn {
          background: #f1f5f9;
          color: #64748b;
        }

        .cancel-btn:hover {
          background: #e2e8f0;
        }

        .submit-btn {
          background: #667eea;
          color: white;
        }

        .submit-btn:hover {
          background: #5a67d8;
        }
      `}</style>
    </div>
  );
};

export default SupplierDashboard;