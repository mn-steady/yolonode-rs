// Function to connect to wallet
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
                console.warn("No accounts found in wallet.");
                return null;
            }
        } catch (error) {
            console.error("Failed to connect to wallet:", error);
            return null;
        }
    } else {
        alert("Wallet not found! Please install Keplr or Fina wallet.");
        return null;
    }
}

// Function to disconnect wallet
function disconnectKeplrWallet() {
    console.log("Wallet disconnected");
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
        alert("Wallet not found! Please install Keplr or Fina wallet.");
        return "";
    }
}

// Function to fetch governance proposals
async function fetchGovernanceProposals() {
    if (!window.keplr) {
        alert("Wallet not found! Please install Keplr or Fina wallet.");
        return [];
    }

    try {
        console.log("Fetching governance proposals...");

        // Enable Keplr wallet and initialize the signer
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

        // Initialize SecretNetworkClient
        const client = new window.SecretNetworkClient({
            url: "https://rpc.ankr.com/http/scrt_cosmos", // LCD endpoint
            chainId: "secret-4",
            wallet: signer,
            walletAddress,
        });

        console.log("SecretNetworkClient initialized:", client);

        let allProposals = [];
        let nextKey = null;
        let latestProposalId = null;

        // Step 1: Fetch the latest proposal ID
        const latestProposalResponse = await client.query.gov.proposals({
            "pagination.limit": 1, // Fetch only the latest proposal
            "pagination.reverse": true, // Fetch in descending order
        });

        if (
            latestProposalResponse &&
            latestProposalResponse.proposals &&
            latestProposalResponse.proposals.length > 0
        ) {
            latestProposalId = parseInt(latestProposalResponse.proposals[0].proposal_id);
            console.log("Latest Proposal ID:", latestProposalId);
        } else {
            console.error("Unable to fetch the latest proposal.");
            return [];
        }

        // Step 2: Fetch proposals in descending order using pagination
        do {
            const response = await client.query.gov.proposals({
                "pagination.key": nextKey || undefined, // Use pagination key
                "pagination.limit": 50,                // Fetch 50 proposals at a time
                "pagination.reverse": true,            // Fetch in descending order
            });

            if (response && response.proposals) {
                // Collect proposals
                allProposals = [...allProposals, ...response.proposals];

                // Update the pagination key
                nextKey = response.pagination?.next_key;

                console.log(
                    `Fetched ${response.proposals.length} proposals, total so far: ${allProposals.length}`
                );

                // Stop if we've fetched up to the latest proposal ID
                if (
                    allProposals.length >= 100 ||
                    parseInt(allProposals[allProposals.length - 1].proposal_id) <=
                        (latestProposalId - 100)
                ) {
                    break;
                }
            } else {
                console.warn("No more proposals or empty response.");
                break;
            }
        } while (nextKey);

        // Sort proposals by `submit_time` in descending order
        allProposals.sort((a, b) => new Date(b.submit_time) - new Date(a.submit_time));

        // Return only the most recent 100 proposals
        const mostRecentProposals = allProposals.slice(0, 100);
        console.log("Most Recent 100 Governance Proposals:", mostRecentProposals);
        return mostRecentProposals;
    } catch (error) {
        console.error("Error fetching governance proposals:", error);
        return [];
    }
}

// Attach functions to the global window object for Rust to access
window.connectKeplrWallet = connectKeplrWallet;
window.disconnectKeplrWallet = disconnectKeplrWallet;
window.get_wallet_address = get_wallet_address;
window.fetchGovernanceProposals = fetchGovernanceProposals;
