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

// Function to fetch the viewing key for STKD
async function getSTKDViewingKey(address, contractAddress = "secret1k6u0cy4feepm6pehnz804zmwakuwdapm69tuc4") {
    if (window.keplr) {
        try {
            await window.keplr.enable("secret-4");
            
            console.log("Testing grpcWebUrl:", "https://grpc.mainnet.secretsaturn.net");

            // Test code to confirm client initialization
            try {
                const client = new window.SecretNetworkClient({
                    grpcWebUrl: "https://grpc.mainnet.secretsaturn.net",
                    chainId: "secret-4",
                    wallet: window.getOfflineSigner("secret-4"),
                    walletAddress: address,
                });
                console.log("Client created successfully:", client);
            } catch (e) {
                console.error("Error creating client:", e);
                return "Error creating SecretNetworkClient.";
            }

            // Assuming the client was created successfully, proceed with the query
            const client = await window.SecretNetworkClient.create({
                grpcWebUrl: "https://grpc.mainnet.secretsaturn.net",
                chainId: "secret-4",
                wallet: window.getOfflineSigner("secret-4"),
                walletAddress: address,
            });

            const response = await client.query.compute.queryContract({
                contractAddress: contractAddress,
                query: { "viewing_key": { "address": address } },
            });

            if (response && response.key) {
                console.log("Viewing Key:", response.key);
                return response.key;
            } else {
                console.warn("No viewing key found or response invalid.");
                return "No viewing key found.";
            }
        } catch (error) {
            console.error("Failed to retrieve viewing key:", error);
            return "Error retrieving viewing key.";
        }
    } else {
        alert("Keplr wallet not found!");
        return "Keplr not available.";
    }
}


// Attach functions to the global window object for Rust to access
window.connectKeplrWallet = connectKeplrWallet;
window.disconnectKeplrWallet = disconnectKeplrWallet;
window.get_wallet_address = get_wallet_address;
window.getSTKDViewingKey = getSTKDViewingKey;