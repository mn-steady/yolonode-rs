// Function to connect to Keplr wallet
async function connectKeplrWallet() {
    if (window.keplr) {
        try {
            // Enable Keplr for Secret Network
            await window.keplr.enable("secret-4");

            // Get the offline signer
            const offlineSigner = window.getOfflineSigner("secret-4");
            const accounts = await offlineSigner.getAccounts();

            if (accounts.length > 0) {
                const walletAddress = accounts[0].address;
                console.log("Connected account:", walletAddress);

                // Notify the app about the connected address
                window.dispatchEvent(new CustomEvent("keplr-wallet-connected", {
                    detail: { address: walletAddress },
                }));

                // Return both the wallet address and the offline signer
                return { signer: offlineSigner, address: walletAddress };
            } else {
                console.warn("No accounts found in Keplr wallet.");
                return null;
            }
        } catch (error) {
            console.error("Failed to connect to Keplr wallet:", error);
            return null;
        }
    } else {
        alert("Keplr wallet not found!");
        return null;
    }
}

// Function to disconnect Keplr wallet
function disconnectKeplrWallet() {
    console.log("Keplr wallet disconnected");
}

// Function to fetch governance proposals
async function fetchGovernanceProposals() {
    if (!window.keplr) {
        alert("Keplr wallet not found!");
        return [];
    }

    try {
        console.log("Fetching governance proposals...");

        // Connect to Keplr and retrieve signer/address
        const { signer, address } = await connectKeplrWallet();

        if (!signer || !address) {
            console.error("Failed to retrieve wallet address or signer.");
            return [];
        }

        // Initialize SecretNetworkClient with signer and wallet address
        const client = new window.SecretNetworkClient({
            url: "https://rpc.ankr.com/http/scrt_cosmos", // LCD endpoint
            chainId: "secret-4",
            wallet: signer,
            walletAddress: address,
        });

        console.log("SecretNetworkClient initialized with signer and address:", client);

        // Fetch and return proposals (same logic as before)
        const response = await client.query.gov.proposals({});
        console.log("Governance Proposals:", response.proposals);
        return response.proposals || [];
    } catch (error) {
        console.error("Error fetching governance proposals:", error);
        return [];
    }
}

// Attach functions to the global window object for Rust to access
window.connectKeplrWallet = connectKeplrWallet;
window.disconnectKeplrWallet = disconnectKeplrWallet;
window.fetchGovernanceProposals = fetchGovernanceProposals;
