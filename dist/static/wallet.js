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
        console.error("Wallet not found! Please install Keplr or Fina wallet.");
        return null; // Prevent proceeding if wallet is not available
    }

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
}

// Function to disconnect wallet
function disconnectKeplrWallet() {
    console.log("Wallet disconnected");
    hideModal(); // Hide the modal if it's visible
}

// Function to get the wallet address
async function get_wallet_address() {
    if (!window.keplr) {
        console.warn("Wallet not found during get_wallet_address.");
        return null; // Avoid showing modal directly here
    }

    try {
        await window.keplr.enable("secret-4");
        const offlineSigner = window.getOfflineSigner("secret-4");
        const accounts = await offlineSigner.getAccounts();
        return accounts.length > 0 ? accounts[0].address : null;
    } catch (error) {
        console.error("Failed to get wallet address:", error);
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
            console.error(`Failed to get address for chain ${chainId}:`, error);
            return "";
        }
    } else {
        showModal("Wallet not found! Please install Keplr or Fina wallet.");
        return "";
    }
}

// Function to fetch governance proposals
async function fetchGovernanceProposals() {
    if (!window.keplr) {
        showModal("Wallet not found! Please install Keplr or Fina wallet.");
        return [];
    }

    try {
        console.log("Fetching governance proposals...");

        await window.keplr.enable("secret-4");
        const signer = window.getOfflineSigner("secret-4");
        const accounts = await signer.getAccounts();
        const walletAddress = accounts[0]?.address;

        if (!walletAddress) {
            console.error("No wallet address found.");
            return [];
        }

        const client = new window.SecretNetworkClient({
            url: "https://rpc.ankr.com/http/scrt_cosmos",
            chainId: "secret-4",
            wallet: signer,
            walletAddress,
        });

        let proposals = [];
        let nextKey = null;

        do {
            const response = await client.query.gov.proposals({
                "pagination.key": nextKey || undefined,
                "pagination.limit": 50,
            });

            console.log("Raw response:", response);

            if (response && response.proposals) {
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

                    let formattedEndDate = "";
                    if (proposal.voting_end_time) {
                        const endDate = new Date(proposal.voting_end_time);
                        formattedEndDate = endDate.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        });
                    }

                    let statusText = proposal.status;
                    if (["Failed", "Passed", "Rejected"].includes(proposal.status) && formattedEndDate) {
                        statusText += ` | Ended ${formattedEndDate}`;
                    }

                    return {
                        proposal_id: proposal.proposal_id || proposal.id || "Unknown",
                        title: contentDetails.title,
                        description: contentDetails.description,
                        status: statusText, 
                        expiration_time: formattedEndDate,
                        ...proposal,
                    };
                });

                proposals = [...proposals, ...processedProposals];
                nextKey = response.pagination?.next_key;

                console.log(
                    `Fetched ${response.proposals.length} proposals, total: ${proposals.length}`
                );
            } else {
                console.warn("No proposals found or response is empty.");
                break;
            }
        } while (nextKey);

        proposals.sort((a, b) => new Date(b.submit_time) - new Date(a.submit_time));
        return proposals.slice(0, 100);
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
window.getAddressForMultiChain = getAddressForMultiChain;
