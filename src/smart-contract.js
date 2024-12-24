const { signer, address } = await window.connectKeplrWallet();
import { createSecretClient } from './secret-client';

// Example of sending a transaction
window.sendTransaction = async function () {
    try {
        // Connect to Keplr and retrieve signer/address
        const { signer, address } = await window.connectKeplrWallet();
        if (!signer || !address) {
            throw new Error("Keplr wallet connection failed.");
        }

        // Create the SecretNetworkClient
        const client = createSecretClient({
            wallet: signer,
            walletAddress: address,
            endpoint: "https://rpc.ankr.com/http/scrt_cosmos",
        });

        // Construct the MsgSend transaction
        const msgSend = {
            type: "cosmos-sdk/MsgSend",
            value: {
                from_address: address,
                to_address: "secret1recipientaddresshere", // Replace with a valid recipient
                amount: [{ denom: "uscrt", amount: "1000000" }],
            },
        };

        // Broadcast the transaction
        const tx = await client.tx.broadcast([msgSend]);

        console.log("Transaction successful:", tx);
        return tx;
    } catch (err) {
        console.error("Transaction failed:", err);
        throw err;
    }
};

