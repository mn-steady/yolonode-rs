// src/secret-import.js

import { SecretNetworkClient } from 'secretjs';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

window.SecretNetworkClient = SecretNetworkClient;

// Default LCD endpoint
export const DEFAULT_API_ENDPOINT = "https://api.yolonode.com";

export function createSecretClient(endpoint = API) {
    console.log("🚀 Creating SecretNetworkClient with endpoint:", endpoint);
    return new SecretNetworkClient({
        url: endpoint,
        chainId: "secret-4",
    });
}

window.createSecretClient = createSecretClient;

// console.log("✅ secret-import.js loaded");
