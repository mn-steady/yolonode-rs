// Function to show custom modal
function showModal(message) {
    const modal = document.getElementById("wallet-error-modal");
    const modalMessage = document.getElementById("wallet-error-message");
    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.style.display = "flex";
    }
}

// Function to hide custom modal
function hideModal() {
    const modal = document.getElementById("wallet-error-modal");
    if (modal) {
        modal.style.display = "none";
    }
}

// Function to connect to wallet
async function connectKeplrWallet() {
    if (!window.keplr) {
        console.error("❌ Wallet not found! Please install Keplr or Fina wallet.");
        return null; // Prevent proceeding if wallet is not available
    }

    try {
        await window.keplr.enable("secret-4");
        const offlineSigner = window.getOfflineSigner("secret-4");
        const accounts = await offlineSigner.getAccounts();
        if (accounts.length > 0) {
            console.log("✅ Connected account:", accounts[0].address);
            return accounts[0].address;
        } else {
            console.warn("❌ No accounts found in wallet.");
            return null;
        }
    } catch (error) {
        console.error("❌ Failed to connect to wallet:", error);
        return null;
    }
}

// Function to disconnect wallet
function disconnectKeplrWallet() {
    console.log("✅ Wallet disconnected");
    hideModal(); // Hide the modal if it's visible
}

// Function to get the wallet address
async function get_wallet_address() {
    if (!window.keplr) {
        console.warn("❌ Wallet not found during get_wallet_address.");
        return null; // Avoid showing modal directly here
    }

    try {
        await window.keplr.enable("secret-4");
        const offlineSigner = window.getOfflineSigner("secret-4");
        const accounts = await offlineSigner.getAccounts();
        return accounts.length > 0 ? accounts[0].address : null;
    } catch (error) {
        console.error("❌ Failed to get wallet address:", error);
        return null;
    }
}

// Get wallet addresses for multiple chains at once
async function getAddressForMultiChain(chainId) {
    if (window.keplr) {
        try {
            await window.keplr.enable(chainId); // Enable the desired chain in Keplr
            const offlineSigner = window.getOfflineSigner(chainId);
            const accounts = await offlineSigner.getAccounts();
            return accounts.length > 0 ? accounts[0].address : "";
        } catch (error) {
            console.error(`❌ Failed to get address for chain ${chainId}:`, error);
            return "";
        }
    } else {
        showModal("Wallet not found! Please install Keplr or Fina wallet.");
        return "";
    }
}

// Function to fetch governance proposals
async function fetchGovernanceProposals(limit = 50) {
    if (!window.keplr) {
        showModal("Wallet not found! Please install Keplr or Fina wallet.");
        return [];
    }

    try {
        console.log("🔍 Fetching latest governance proposals...");

        await window.keplr.enable("secret-4");
        const signer = window.getOfflineSigner("secret-4");
        const accounts = await signer.getAccounts();
        const walletAddress = accounts[0]?.address;

        if (!walletAddress) {
            console.error("❌ No wallet address found.");
            return [];
        }

        const client = new window.SecretNetworkClient({
            url: "https://rpc.ankr.com/http/scrt_cosmos",
            chainId: "secret-4",
            wallet: signer,
            walletAddress,
        });

        let allProposals = [];
        let nextKey = null;
        let latestProposalId = null;

        // Step 1: Fetch the latest proposal ID
        const latestProposalResponse = await client.query.gov.proposals({
            "pagination.limit": 1,
            "pagination.reverse": true,
        });

        if (latestProposalResponse?.proposals?.length > 0) {
            latestProposalId = parseInt(latestProposalResponse.proposals[0].proposal_id);
            console.log(`✅ Latest Proposal ID: ${latestProposalId}`);
        } else {
            console.error("❌ Unable to fetch the latest proposal.");
            return [];
        }

        // Step 2: Fetch proposals in descending order using pagination
        do {
            const response = await client.query.gov.proposals({
                "pagination.key": nextKey || undefined, // Use pagination key
                "pagination.limit": 50, // Fetch 50 at a time
                "pagination.reverse": true, // Fetch newest first
            });

            if (response?.proposals?.length > 0) {
                const processedProposals = response.proposals.map((proposal) => {
                    let contentDetails = {
                        title: "No content available",
                        description: "No description available",
                    };
                
                    if (proposal.content) {
                        contentDetails = {
                            title: proposal.content.title || "Untitled Proposal",
                            description: proposal.content.description || "No description available",
                        };
                    } else if (proposal.messages && proposal.messages.length > 0) {
                        const firstMessage = proposal.messages[0];
                        contentDetails = {
                            title: `Message Type: ${firstMessage["@type"] || "Unknown"}`,
                            description: `Details: ${JSON.stringify(firstMessage)}`,
                        };
                    }
                
                    let formattedEndDate = "Unknown";
                    if (proposal.voting_end_time) {
                        try {
                            const votingEndTime = new Date(proposal.voting_end_time);
                
                            if (!isNaN(votingEndTime.getTime())) {
                                formattedEndDate = votingEndTime.toISOString().replace("T", " ").split(".")[0] + " UTC";
                            } else {
                                console.warn(`⚠️ Invalid voting_end_time for proposal ${proposal.proposal_id}: ${proposal.voting_end_time}`);
                            }
                        } catch (error) {
                            console.error(`❌ Error parsing voting_end_time for proposal ${proposal.proposal_id}:`, error);
                        }
                    }
                
                    return {
                        proposal_id: proposal.proposal_id || proposal.id || "Unknown",
                        title: contentDetails.title,
                        description: contentDetails.description,
                        status: proposal.status,
                        expiration_time: formattedEndDate, 
                        submit_time: proposal.submit_time,
                        ...proposal,
                    };
                });                

                allProposals = [...allProposals, ...processedProposals];
                nextKey = response.pagination?.next_key;
            } else {
                console.warn("❌ No more proposals or empty response.");
                break;
            }
        } while (nextKey);

        // Step 3: Sort proposals by `submit_time` (newest first)
        allProposals.sort((a, b) => new Date(b.submit_time) - new Date(a.submit_time));

        // Return only the most recent proposals up to the limit
        console.log(`✅ Final list of ${limit} governance proposals:`, allProposals.slice(0, limit));
        return allProposals.slice(0, limit);
    } catch (error) {
        console.error("❌ Error fetching governance proposals:", error);
        return [];
    }
}

// Attach functions to the global window object for Rust to access
window.connectKeplrWallet = connectKeplrWallet;
window.disconnectKeplrWallet = disconnectKeplrWallet;
window.get_wallet_address = get_wallet_address;
window.fetchGovernanceProposals = fetchGovernanceProposals;
window.getAddressForMultiChain = getAddressForMultiChain;
