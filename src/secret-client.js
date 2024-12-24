import { SecretNetworkClient } from 'secretjs';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

const DEFAULT_LCD_ENDPOINT = "https://rpc.ankr.com/http/scrt_cosmos";

export function createSecretClient({ wallet, walletAddress, endpoint = DEFAULT_LCD_ENDPOINT }) {
    console.log("Creating SecretNetworkClient with endpoint:", endpoint);
    return new SecretNetworkClient({
        url: endpoint,
        chainId: "secret-4",
        wallet,
        walletAddress,
    });
}

