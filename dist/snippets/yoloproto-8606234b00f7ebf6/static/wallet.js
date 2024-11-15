
export async function connectKeplrWallet() {
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

export function disconnectKeplrWallet() {
    console.log("Keplr wallet disconnected");
}

export async function get_wallet_address() {
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
