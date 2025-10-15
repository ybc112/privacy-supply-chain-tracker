import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import ProductBatch from '../components/ProductBatch';
import TrackProduct from '../components/TrackProduct';
import SupplierDashboard from '../components/SupplierDashboard';
import '../styles/Home.module.css';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [activeTab, setActiveTab] = useState('create');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (isConnected && address) {
      // In real app, fetch user role from contract
      checkUserRole();
    }
  }, [address, isConnected]);

  const checkUserRole = async () => {
    // Mock role check - in real app, call contract
    setUserRole('manufacturer'); // For demo
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🔒 Private Supply Chain Tracker</h1>
        <p>Secure supply chain management with Fully Homomorphic Encryption</p>

        <div className="wallet-section">
          {!isConnected ? (
            <div className="connect-wallet">
              <h3>Connect Your Wallet</h3>
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  className="connect-button"
                >
                  Connect with {connector.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="account-info">
              <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
              <p>Role: {userRole || 'Not Registered'}</p>
              <button onClick={() => disconnect()} className="disconnect-button">
                Disconnect
              </button>
            </div>
          )}
        </div>
      </header>

      {isConnected && (
        <main className="main">
          <nav className="tab-nav">
            <button
              className={`tab ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              Create Batch
            </button>
            <button
              className={`tab ${activeTab === 'track' ? 'active' : ''}`}
              onClick={() => setActiveTab('track')}
            >
              Track Product
            </button>
            <button
              className={`tab ${activeTab === 'supplier' ? 'active' : ''}`}
              onClick={() => setActiveTab('supplier')}
            >
              Suppliers
            </button>
          </nav>

          <div className="tab-content">
            {activeTab === 'create' && <ProductBatch />}
            {activeTab === 'track' && <TrackProduct />}
            {activeTab === 'supplier' && <SupplierDashboard />}
          </div>
        </main>
      )}

      <footer className="footer">
        <p>Powered by Zama FHE Protocol | Privacy-First Supply Chain</p>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .header {
          padding: 2rem;
          text-align: center;
          color: white;
        }

        .header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .header p {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .wallet-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .connect-wallet h3 {
          margin-bottom: 1rem;
        }

        .connect-button {
          padding: 0.75rem 1.5rem;
          margin: 0.5rem;
          border: none;
          border-radius: 8px;
          background: white;
          color: #667eea;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .connect-button:hover {
          transform: scale(1.05);
        }

        .account-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .disconnect-button {
          padding: 0.5rem 1rem;
          border: 2px solid white;
          border-radius: 8px;
          background: transparent;
          color: white;
          cursor: pointer;
          transition: background 0.3s;
        }

        .disconnect-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .main {
          flex: 1;
          padding: 2rem;
          background: white;
          margin: 2rem;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .tab-nav {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 1rem;
        }

        .tab {
          padding: 0.75rem 1.5rem;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .tab.active {
          color: #667eea;
          font-weight: 600;
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -1rem;
          left: 0;
          right: 0;
          height: 2px;
          background: #667eea;
        }

        .tab:hover {
          color: #667eea;
        }

        .tab-content {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .footer {
          padding: 2rem;
          text-align: center;
          color: white;
        }
      `}</style>
    </div>
  );
}