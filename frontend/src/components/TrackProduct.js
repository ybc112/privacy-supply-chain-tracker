import React, { useState } from 'react';
import { ethers } from 'ethers';

const TrackProduct = () => {
  const [batchId, setBatchId] = useState('');
  const [batchData, setBatchData] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!batchId) return;

    setLoading(true);
    try {
      // Mock data - in real app, fetch from contract
      const mockData = {
        batchId: batchId,
        manufacturer: '0x742d...8c3d',
        status: 'In Transit',
        createdAt: new Date().toISOString(),
        publicMetadata: 'Organic Coffee Beans - Grade A',
        encryptedData: {
          quantity: '*** Encrypted ***',
          qualityScore: '*** Encrypted ***',
          price: '*** Encrypted ***'
        }
      };

      const mockCheckpoints = [
        {
          id: 1,
          handler: '0x742d...8c3d',
          role: 'Manufacturer',
          location: '*** Encrypted ***',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
          status: 'Created',
          note: 'Product batch created and quality verified'
        },
        {
          id: 2,
          handler: '0x3f2e...9a1b',
          role: 'Distributor',
          location: '*** Encrypted ***',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
          status: 'In Transit',
          note: 'Product received at distribution center'
        },
        {
          id: 3,
          handler: '0x1a2b...4c5d',
          role: 'Inspector',
          location: '*** Encrypted ***',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: 'Verified',
          note: 'Quality inspection passed'
        }
      ];

      setBatchData(mockData);
      setCheckpoints(mockCheckpoints);
    } catch (error) {
      console.error('Error fetching batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const decryptData = async (field) => {
    // Mock decryption - in real app, use FHE re-encryption
    alert(`Requesting decryption permission for ${field}...\\nThis requires FHE key exchange protocol.`);
  };

  return (
    <div className="track-product-container">
      <h2>Track Product Batch</h2>
      <p className="subtitle">View supply chain journey with privacy-preserved data</p>

      <div className="search-section">
        <input
          type="text"
          placeholder="Enter Batch ID"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button" disabled={loading}>
          {loading ? 'Searching...' : 'Track'}
        </button>
      </div>

      {batchData && (
        <div className="batch-info">
          <div className="info-card">
            <h3>Batch Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Batch ID:</span>
                <span className="value">{batchData.batchId}</span>
              </div>
              <div className="info-item">
                <span className="label">Manufacturer:</span>
                <span className="value">{batchData.manufacturer}</span>
              </div>
              <div className="info-item">
                <span className="label">Status:</span>
                <span className="value status">{batchData.status}</span>
              </div>
              <div className="info-item">
                <span className="label">Created:</span>
                <span className="value">{new Date(batchData.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="info-item full-width">
                <span className="label">Product:</span>
                <span className="value">{batchData.publicMetadata}</span>
              </div>
            </div>
          </div>

          <div className="encrypted-data-card">
            <h3>Encrypted Data</h3>
            <p className="encryption-note">🔐 Data is encrypted using FHE. Click to request access.</p>
            <div className="encrypted-grid">
              <div className="encrypted-item" onClick={() => decryptData('Quantity')}>
                <span className="label">Quantity:</span>
                <span className="encrypted-value">{batchData.encryptedData.quantity}</span>
                <button className="decrypt-btn">🔓</button>
              </div>
              <div className="encrypted-item" onClick={() => decryptData('Quality Score')}>
                <span className="label">Quality Score:</span>
                <span className="encrypted-value">{batchData.encryptedData.qualityScore}</span>
                <button className="decrypt-btn">🔓</button>
              </div>
              <div className="encrypted-item" onClick={() => decryptData('Price')}>
                <span className="label">Price:</span>
                <span className="encrypted-value">{batchData.encryptedData.price}</span>
                <button className="decrypt-btn">🔓</button>
              </div>
            </div>
          </div>

          <div className="timeline-section">
            <h3>Supply Chain Journey</h3>
            <div className="timeline">
              {checkpoints.map((checkpoint, index) => (
                <div key={checkpoint.id} className="timeline-item">
                  <div className="timeline-marker">
                    <span className="marker-number">{index + 1}</span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-status">{checkpoint.status}</span>
                      <span className="timeline-date">
                        {new Date(checkpoint.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="timeline-role">{checkpoint.role}</p>
                    <p className="timeline-note">{checkpoint.note}</p>
                    <div className="timeline-encrypted">
                      <span>📍 Location: {checkpoint.location}</span>
                      <button className="mini-decrypt" onClick={() => decryptData('Location')}>
                        🔓
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .track-product-container {
          max-width: 800px;
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

        .search-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .search-input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .search-button {
          padding: 0.75rem 2rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }

        .search-button:hover:not(:disabled) {
          background: #5a67d8;
        }

        .search-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .batch-info {
          animation: slideIn 0.3s ease-in;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .info-card, .encrypted-data-card, .timeline-section {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        h3 {
          color: #334155;
          margin-bottom: 1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
        }

        .info-item.full-width {
          grid-column: span 2;
        }

        .label {
          color: #64748b;
          font-weight: 500;
        }

        .value {
          color: #1e293b;
          font-weight: 600;
        }

        .status {
          padding: 0.25rem 0.75rem;
          background: #fbbf24;
          color: #78350f;
          border-radius: 12px;
          font-size: 0.875rem;
        }

        .encryption-note {
          color: #10b981;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .encrypted-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .encrypted-item {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .encrypted-item:hover {
          background: #e0e7ff;
        }

        .encrypted-value {
          flex: 1;
          margin-left: 1rem;
          color: #6b7280;
          font-family: monospace;
        }

        .decrypt-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .timeline {
          position: relative;
          padding-left: 2rem;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 0.75rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e2e8f0;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 2rem;
        }

        .timeline-marker {
          position: absolute;
          left: -1.25rem;
          width: 2rem;
          height: 2rem;
          background: #667eea;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .marker-number {
          color: white;
          font-weight: bold;
          font-size: 0.875rem;
        }

        .timeline-content {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .timeline-status {
          font-weight: 600;
          color: #667eea;
        }

        .timeline-date {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .timeline-role {
          color: #1e293b;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .timeline-note {
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .timeline-encrypted {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid #f1f5f9;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .mini-decrypt {
          background: transparent;
          border: 1px solid #667eea;
          color: #667eea;
          padding: 0.125rem 0.25rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
        }

        .mini-decrypt:hover {
          background: #667eea;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default TrackProduct;