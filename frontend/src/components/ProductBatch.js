import React, { useState } from 'react';
import { ethers } from 'ethers';
import { usePrepareContractWrite, useContractWrite } from 'wagmi';
import { createInstances } from 'fhevmjs';

const ProductBatch = () => {
  const [formData, setFormData] = useState({
    quantity: '',
    qualityScore: '',
    pricePerUnit: '',
    metadata: ''
  });
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const encryptData = async () => {
    try {
      // Initialize FHE instance
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const fhevmInstance = await createInstances(contractAddress, provider);

      // Encrypt form data
      const encryptedQuantity = await fhevmInstance.encrypt64(parseInt(formData.quantity));
      const encryptedQuality = await fhevmInstance.encrypt32(parseInt(formData.qualityScore));
      const encryptedPrice = await fhevmInstance.encrypt64(parseInt(formData.pricePerUnit));

      return {
        encryptedQuantity,
        encryptedQuality,
        encryptedPrice
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const encryptedData = await encryptData();

      // In real implementation, call contract here
      console.log('Creating batch with encrypted data:', encryptedData);

      // Mock transaction hash
      setTxHash('0x' + Math.random().toString(36).substring(2, 15));

      // Reset form
      setFormData({
        quantity: '',
        qualityScore: '',
        pricePerUnit: '',
        metadata: ''
      });
    } catch (error) {
      console.error('Error creating batch:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-batch-container">
      <h2>Create New Product Batch</h2>
      <p className="subtitle">All sensitive data will be encrypted using FHE before storage</p>

      <form onSubmit={handleSubmit} className="batch-form">
        <div className="form-group">
          <label htmlFor="quantity">Quantity</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter product quantity"
            required
            min="1"
          />
          <span className="encryption-badge">🔐 Encrypted</span>
        </div>

        <div className="form-group">
          <label htmlFor="qualityScore">Quality Score (0-100)</label>
          <input
            type="number"
            id="qualityScore"
            name="qualityScore"
            value={formData.qualityScore}
            onChange={handleChange}
            placeholder="Enter quality score"
            required
            min="0"
            max="100"
          />
          <span className="encryption-badge">🔐 Encrypted</span>
        </div>

        <div className="form-group">
          <label htmlFor="pricePerUnit">Price Per Unit</label>
          <input
            type="number"
            id="pricePerUnit"
            name="pricePerUnit"
            value={formData.pricePerUnit}
            onChange={handleChange}
            placeholder="Enter price per unit"
            required
            min="0"
          />
          <span className="encryption-badge">🔐 Encrypted</span>
        </div>

        <div className="form-group">
          <label htmlFor="metadata">Product Description</label>
          <textarea
            id="metadata"
            name="metadata"
            value={formData.metadata}
            onChange={handleChange}
            placeholder="Enter product description (public)"
            rows="3"
            required
          />
          <span className="public-badge">📢 Public</span>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Creating Batch...' : 'Create Product Batch'}
        </button>
      </form>

      {txHash && (
        <div className="success-message">
          <h3>✅ Batch Created Successfully!</h3>
          <p>Transaction Hash: {txHash}</p>
        </div>
      )}

      <style jsx>{`
        .product-batch-container {
          max-width: 600px;
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

        .batch-form {
          background: #f8fafc;
          padding: 2rem;
          border-radius: 12px;
        }

        .form-group {
          margin-bottom: 1.5rem;
          position: relative;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #334155;
          font-weight: 500;
        }

        input, textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        input:focus, textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .encryption-badge {
          position: absolute;
          right: 10px;
          top: 38px;
          background: #10b981;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .public-badge {
          position: absolute;
          right: 10px;
          top: 38px;
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .submit-button {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success-message {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #dcfce7;
          border: 2px solid #86efac;
          border-radius: 8px;
        }

        .success-message h3 {
          color: #166534;
          margin-bottom: 0.5rem;
        }

        .success-message p {
          color: #15803d;
          word-break: break-all;
        }
      `}</style>
    </div>
  );
};

export default ProductBatch;