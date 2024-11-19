// Function to connect to Keplr wallet
async function connectKeplrWallet() {
    if (window.keplr) {
        try {
            await window.keplr.enable("secret-4");
            const offlineSigner = window.getOfflineSigner("secret-4");
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length > 0) {
                console.log("Connected account:", accounts[0].address);
                return accounts[0].address;
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

// Function to get the wallet address
async function get_wallet_address() {
    if (window.keplr) {
        try {
            await window.keplr.enable("secret-4");
            const offlineSigner = window.getOfflineSigner("secret-4");
            const accounts = await offlineSigner.getAccounts();
            return accounts.length > 0 ? accounts[0].address : "";
        } catch (error) {
            console.error("Failed to get wallet address:", error);
            return "";
        }
    } else {
        alert("Keplr wallet not found!");
        return "";
    }
}

// Function to fetch governance proposals
async function fetchGovernanceProposals() {
    if (window.keplr) {
        try {
            console.log("Fetching governance proposals...");

            await window.keplr.enable("secret-4");
            const signer = window.getOfflineSigner("secret-4");
            const accounts = await signer.getAccounts();
            const walletAddress = accounts[0]?.address;

            console.log("Signer:", signer);
            console.log("Wallet Address:", walletAddress);

            if (!walletAddress) {
                console.error("No wallet address found.");
                return [];
            }

            // Initialize SecretNetworkClient with LCD
            const client = new window.SecretNetworkClient({
                url: "https://rpc.ankr.com/http/scrt_cosmos", // LCD endpoint
                chainId: "secret-4",
                wallet: signer,
                walletAddress,
            });

            console.log("SecretNetworkClient initialized:", client);

            // Query governance proposals
            const response = await client.query.gov.proposals({});
            if (response && response.proposals) {
                console.log("Governance Proposals:", response.proposals);
                return response.proposals;
            } else {
                console.warn("No governance proposals found.");
                return [];
            }
        } catch (error) {
            console.error("Error fetching governance proposals:", error);
            return [];
        }
    } else {
        alert("Keplr wallet not found!");
        return [];
    }
}

// Attach functions to the global window object for Rust to access
window.connectKeplrWallet = connectKeplrWallet;
window.disconnectKeplrWallet = disconnectKeplrWallet;
window.get_wallet_address = get_wallet_address;
window.fetchGovernanceProposals = fetchGovernanceProposals;
