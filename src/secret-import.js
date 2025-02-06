// src/secret-import.js

import { SecretNetworkClient } from 'secretjs';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

window.SecretNetworkClient = SecretNetworkClient;

// Default LCD endpoint
export const DEFAULT_LCD_ENDPOINT = "https://rpc.ankr.com/http/scrt_cosmos"; 

export function createSecretClient(endpoint = DEFAULT_LCD_ENDPOINT) {
    console.log("🚀 Creating SecretNetworkClient with endpoint:", endpoint);
    return new SecretNetworkClient({
        url: endpoint,
        chainId: "secret-4",
    });
}

window.createSecretClient = createSecretClient;

// console.log("✅ secret-import.js loaded");
