// Main Application JavaScript
let provider;
let signer;
let account;
let supplyChainContract;
let traceabilityContract;
let lastCreatedBatchId;

// Initialize the application
window.addEventListener('DOMContentLoaded', async () => {
    initializeEventListeners();
    checkWalletConnection();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Wallet connection
    document.getElementById('connect-wallet').addEventListener('click', connectWallet);
    document.getElementById('disconnect').addEventListener('click', disconnectWallet);

    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Form submissions
    document.getElementById('register-form').addEventListener('submit', handleRegisterParticipant);
    document.getElementById('create-batch-form').addEventListener('submit', handleCreateBatch);
    document.getElementById('checkpoint-form').addEventListener('submit', handleAddCheckpoint);
    document.getElementById('verify-form').addEventListener('submit', handleVerifyQuality);
    document.getElementById('grant-access-form').addEventListener('submit', handleGrantAccess);

    // Track button
    document.getElementById('track-btn').addEventListener('click', handleTrackBatch);
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Check if wallet is already connected
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await connectWallet();
        }
    }
}

// Connect wallet function
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showNotification('error', 'MetaMask Not Found', 'Please install MetaMask to use this application');
        return;
    }

    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        account = accounts[0];

        // Check network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (parseInt(chainId, 16) !== CONFIG.network.chainId) {
            await switchToSepolia();
        }

        // Setup provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();

        // Initialize contracts
        supplyChainContract = new ethers.Contract(
            CONFIG.contracts.privateSupplyChain,
            PRIVATE_SUPPLY_CHAIN_ABI,
            signer
        );

        traceabilityContract = new ethers.Contract(
            CONFIG.contracts.productTraceability,
            PRODUCT_TRACEABILITY_ABI,
            signer
        );

        // Update UI
        updateWalletUI();
        loadAdminInfo();

        showNotification('success', 'Connected', `Wallet connected: ${account.slice(0, 6)}...${account.slice(-4)}`);

    } catch (error) {
        console.error('Connection error:', error);
        showNotification('error', 'Connection Failed', error.message);
    }
}

// Switch to Sepolia network
async function switchToSepolia() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CONFIG.network.chainId.toString(16)}` }],
        });
    } catch (error) {
        if (error.code === 4902) {
            // Chain doesn't exist, add it
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${CONFIG.network.chainId.toString(16)}`,
                    chainName: CONFIG.network.chainName,
                    nativeCurrency: CONFIG.network.currency,
                    rpcUrls: [CONFIG.network.rpcUrl],
                    blockExplorerUrls: [CONFIG.network.blockExplorer]
                }]
            });
        }
    }
}

// Disconnect wallet
function disconnectWallet() {
    account = null;
    provider = null;
    signer = null;
    supplyChainContract = null;
    traceabilityContract = null;

    document.getElementById('connect-wallet').style.display = 'block';
    document.getElementById('account-info').style.display = 'none';

    showNotification('info', 'Disconnected', 'Wallet disconnected successfully');
}

// Update wallet UI
async function updateWalletUI() {
    if (!account) return;

    const balance = await provider.getBalance(account);
    const ethBalance = ethers.utils.formatEther(balance);

    document.getElementById('wallet-address').textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
    document.getElementById('wallet-balance').textContent = `${parseFloat(ethBalance).toFixed(4)} ETH`;
    document.getElementById('connect-wallet').style.display = 'none';
    document.getElementById('account-info').style.display = 'flex';
}

// Load admin information
async function loadAdminInfo() {
    if (!supplyChainContract) return;

    try {
        const adminAddress = await supplyChainContract.admin();
        const nextBatchId = await supplyChainContract.nextBatchId();

        document.getElementById('admin-address').textContent = adminAddress;
        document.getElementById('next-batch-id').textContent = nextBatchId.toString();
    } catch (error) {
        console.error('Error loading admin info:', error);
    }
}

// Handle register participant
async function handleRegisterParticipant(e) {
    e.preventDefault();
    if (!supplyChainContract) {
        showNotification('error', 'Not Connected', 'Please connect your wallet first');
        return;
    }

    const participantAddress = document.getElementById('participant-address').value;
    const role = parseInt(document.getElementById('participant-role').value);
    const rating = parseInt(document.getElementById('participant-rating').value);

    try {
        showLoading(true);
        const tx = await supplyChainContract.registerParticipant(participantAddress, role, rating);
        await tx.wait();
        showNotification('success', 'Success', `Participant registered successfully! TX: ${tx.hash.slice(0, 10)}...`);
        e.target.reset();
    } catch (error) {
        showNotification('error', 'Transaction Failed', error.message);
    } finally {
        showLoading(false);
    }
}

// Handle create batch
async function handleCreateBatch(e) {
    e.preventDefault();
    if (!supplyChainContract) {
        showNotification('error', 'Not Connected', 'Please connect your wallet first');
        return;
    }

    const quantity = parseInt(document.getElementById('batch-quantity').value);
    const quality = parseInt(document.getElementById('batch-quality').value);
    const price = parseInt(document.getElementById('batch-price').value);
    const metadata = document.getElementById('batch-metadata').value;
    const nonce = Date.now();

    try {
        showLoading(true);
        const tx = await supplyChainContract.createProductBatch(quantity, quality, price, metadata, nonce);
        const receipt = await tx.wait();

        // Get batch ID from event
        const event = receipt.events && receipt.events.find(e => e.event === 'ProductBatchCreated');
        const batchId = event && event.args && event.args.batchId ? event.args.batchId.toString() : undefined;

        if (batchId) {
            lastCreatedBatchId = batchId;
            // Auto-fill related forms to reduce user errors
            const checkpointInput = document.getElementById('checkpoint-batch-id');
            const verifyInput = document.getElementById('verify-batch-id');
            const trackInput = document.getElementById('track-batch-id');
            if (checkpointInput) checkpointInput.value = batchId;
            if (verifyInput) verifyInput.value = batchId;
            if (trackInput) trackInput.value = batchId;
        }

        showNotification('success', 'Success', `Batch created!${batchId ? ' ID: ' + batchId + ',' : ''} TX: ${tx.hash.slice(0, 10)}...`);
        e.target.reset();
    } catch (error) {
        showNotification('error', 'Transaction Failed', error.message);
    } finally {
        showLoading(false);
    }
}

// Handle add checkpoint
async function handleAddCheckpoint(e) {
    e.preventDefault();
    if (!supplyChainContract) {
        showNotification('error', 'Not Connected', 'Please connect your wallet first');
        return;
    }

    const batchId = parseInt(document.getElementById('checkpoint-batch-id').value);
    const location = document.getElementById('checkpoint-location').value;
    const note = document.getElementById('checkpoint-note').value;
    const status = parseInt(document.getElementById('checkpoint-status').value);
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Date.now();

    try {
        // Pre-check: ensure batch exists
        const batchInfo = await supplyChainContract.getBatchInfo(batchId);
        const manufacturer = batchInfo[0];
        if (!manufacturer || manufacturer === '0x0000000000000000000000000000000000000000') {
            showNotification('error', 'Batch Not Found', 'Please create the batch first or enter a valid batch ID');
            return;
        }

        showLoading(true);
        const tx = await supplyChainContract.addCheckpoint(batchId, timestamp, location, note, status, nonce);
        await tx.wait();
        showNotification('success', 'Success', `Checkpoint added! TX: ${tx.hash.slice(0, 10)}...`);
        e.target.reset();
    } catch (error) {
        showNotification('error', 'Transaction Failed', error.message);
    } finally {
        showLoading(false);
    }
}

// Handle verify quality
async function handleVerifyQuality(e) {
    e.preventDefault();
    if (!supplyChainContract) {
        showNotification('error', 'Not Connected', 'Please connect your wallet first');
        return;
    }

    const batchId = parseInt(document.getElementById('verify-batch-id').value);
    const quality = parseInt(document.getElementById('verify-quality').value);
    const nonce = Date.now();

    try {
        // Pre-check: ensure batch exists
        const batchInfo = await supplyChainContract.getBatchInfo(batchId);
        const manufacturer = batchInfo[0];
        if (!manufacturer || manufacturer === '0x0000000000000000000000000000000000000000') {
            showNotification('error', 'Batch Not Found', 'Please create the batch first or enter a valid batch ID');
            return;
        }

        showLoading(true);
        const tx = await supplyChainContract.verifyQuality(batchId, quality, nonce);
        await tx.wait();
        showNotification('success', 'Success', `Quality verified! TX: ${tx.hash.slice(0, 10)}...`);
        e.target.reset();
    } catch (error) {
        showNotification('error', 'Transaction Failed', error.message);
    } finally {
        showLoading(false);
    }
}

// Handle grant access
async function handleGrantAccess(e) {
    e.preventDefault();
    if (!supplyChainContract) {
        showNotification('error', 'Not Connected', 'Please connect your wallet first');
        return;
    }

    const participantAddress = document.getElementById('access-participant').value;
    const batchId = parseInt(document.getElementById('access-batch-id').value);

    try {
        showLoading(true);
        const tx = await supplyChainContract.grantAccess(participantAddress, batchId);
        await tx.wait();
        showNotification('success', 'Success', `Access granted! TX: ${tx.hash.slice(0, 10)}...`);
        e.target.reset();
    } catch (error) {
        showNotification('error', 'Transaction Failed', error.message);
    } finally {
        showLoading(false);
    }
}

// Handle track batch
async function handleTrackBatch() {
    if (!supplyChainContract) {
        showNotification('error', 'Not Connected', 'Please connect your wallet first');
        return;
    }

    const batchId = parseInt(document.getElementById('track-batch-id').value);
    if (!batchId) {
        showNotification('error', 'Invalid Input', 'Please enter a valid batch ID');
        return;
    }

    try {
        showLoading(true);

        // Get batch info
        const batchInfo = await supplyChainContract.getBatchInfo(batchId);
        const [manufacturer, status, createdAt, metadata, checkpointCount] = batchInfo;

        // Update UI with batch info
        document.getElementById('info-batch-id').textContent = batchId;
        document.getElementById('info-manufacturer').textContent = `${manufacturer.slice(0, 6)}...${manufacturer.slice(-4)}`;
        document.getElementById('info-status').textContent = CONFIG.productStatus[status];
        document.getElementById('info-status').className = `status-badge ${CONFIG.productStatus[status].toLowerCase().replace(' ', '')}`;
        document.getElementById('info-created').textContent = new Date(createdAt * 1000).toLocaleString();
        document.getElementById('info-metadata').textContent = metadata;
        document.getElementById('info-checkpoints').textContent = checkpointCount.toString();

        // Load checkpoints
        await loadCheckpoints(batchId, checkpointCount);

        // Show batch info section
        document.getElementById('batch-info').style.display = 'block';

    } catch (error) {
        showNotification('error', 'Error', 'Failed to load batch information');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// Load checkpoints for a batch
async function loadCheckpoints(batchId, count) {
    const checkpointList = document.getElementById('checkpoint-list');
    checkpointList.innerHTML = '';

    if (count === 0) {
        checkpointList.innerHTML = '<p>No checkpoints recorded yet</p>';
        return;
    }

    for (let i = 0; i < count; i++) {
        try {
            const checkpoint = await supplyChainContract.getCheckpoint(batchId, i);
            const [handler, hashedTimestamp, hashedLocation, publicNote, newStatus] = checkpoint;

            const checkpointDiv = document.createElement('div');
            checkpointDiv.className = 'checkpoint-item';
            checkpointDiv.innerHTML = `
                <h4>Checkpoint #${i + 1} - ${CONFIG.productStatus[newStatus]}</h4>
                <p><strong>Handler:</strong> ${handler.slice(0, 6)}...${handler.slice(-4)}</p>
                <p><strong>Note:</strong> ${publicNote}</p>
                <p><strong>Location Hash:</strong> ${hashedLocation.slice(0, 10)}...</p>
                <p><strong>Timestamp Hash:</strong> ${hashedTimestamp.slice(0, 10)}...</p>
            `;
            checkpointList.appendChild(checkpointDiv);
        } catch (error) {
            console.error(`Error loading checkpoint ${i}:`, error);
        }
    }
}

// Show loading overlay
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

// Show notification
function showNotification(type, title, message) {
    const notificationContainer = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <h4>${title}</h4>
        <p>${message}</p>
    `;
    notificationContainer.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
            connectWallet();
        } else {
            disconnectWallet();
        }
    });

    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}