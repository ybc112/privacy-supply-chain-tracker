// Configuration for the Private Supply Chain Tracker
const CONFIG = {
    // Deployed contract addresses on Sepolia
    contracts: {
        privateSupplyChain: "0x97FAb964a762feE3aF1bDddEF2138c8Ac5cb9238",
        productTraceability: "0x54BcFC4BdfDEb4376fa844dFFd1A784570F82C56"
    },

    // Sepolia network configuration
    network: {
        chainId: 11155111,
        chainName: "Sepolia Testnet",
        rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/Q9OP_2r5heYkxJymvtTWb",
        blockExplorer: "https://sepolia.etherscan.io",
        currency: {
            name: "SepoliaETH",
            symbol: "ETH",
            decimals: 18
        }
    },

    // Role mappings
    roles: {
        0: "None",
        1: "Manufacturer",
        2: "Supplier",
        3: "Distributor",
        4: "Retailer",
        5: "Inspector"
    },

    // Status mappings
    productStatus: {
        0: "Created",
        1: "In Transit",
        2: "Delivered",
        3: "Verified",
        4: "Recalled"
    },

    // UI Configuration
    ui: {
        transactionTimeout: 120000, // 2 minutes
        refreshInterval: 10000, // 10 seconds
        maxRetries: 3
    }
};