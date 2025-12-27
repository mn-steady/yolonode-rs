import { SecretNetworkClient } from 'secretjs';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

window.SecretNetworkClient = SecretNetworkClient;

// API URLs
export const DEFAULT_LCD_ENDPOINT = "https://secretnetwork-api.lavenderfive.com:443";
export const DEFAULT_RPC_ENDPOINT = "https://rpc.lavenderfive.com/secretnetwork";

// Function to create a Secret Network Client
export function createSecretClient(endpoint = DEFAULT_LCD_ENDPOINT) {
    console.log("🚀 Creating SecretNetworkClient with endpoint:", endpoint);
    return new SecretNetworkClient({
        url: endpoint,
        chainId: "secret-4",
    });
}

window.createSecretClient = createSecretClient;

// Function to fetch API status dynamically (LCD and RPC)
window.fetchAPIStatus = function (type, baseUrl, endpoint, statusId, responseId, attempt = 1, maxAttempts = 10) {
    console.log(`🔍 Fetching ${type} Status (Attempt ${attempt})`);

    // Try to find the DOM elements
    const statusElement = document.getElementById(statusId);
    const responseElement = document.getElementById(responseId);

    if (!statusElement || !responseElement) {
        if (attempt < maxAttempts) {
            console.warn(`❗ ${type} status elements not found in DOM. Retrying... (${attempt}/${maxAttempts})`);
            setTimeout(() => window.fetchAPIStatus(type, baseUrl, endpoint, statusId, responseId, attempt + 1, maxAttempts), 300);
        } else {
            console.error(`❌ Failed to find ${type} status elements after multiple retries.`);
        }
        return;
    }

    const url = `${baseUrl}${endpoint}`;
    console.log(`🔍 Request URL: ${url}`);

    // Set initial loading state
    statusElement.textContent = `Status: Loading...`;
    responseElement.textContent = `${type} Response: Loading...`;

    fetch(url, { mode: 'cors' }) 
        .then(response => response.json())
        .then(data => {
            console.log(`✅ ${type} Response:`, data);

            if (type === "LCD") {
                const latestBlockHeight = data.block?.header?.height || "Unknown";
                statusElement.textContent = "Status: ✅ LCD is UP!";
                responseElement.textContent = `Latest Block: ${latestBlockHeight}`;
            } else if (type === "RPC") {
                const latestBlockHeight = data.result?.sync_info?.latest_block_height || "Unknown";
                statusElement.textContent = "Status: ✅ RPC is UP!";
                responseElement.textContent = `Latest Block: ${latestBlockHeight}`;
            }
        })
        .catch(error => {
            statusElement.textContent = `Status: ❌ ${type} is DOWN!`;
            responseElement.textContent = `⚠️ Error fetching ${type} status`;
            console.error(`❌ Error fetching ${type} status:`, error);
        });
};

// Wrapper functions for each API type

window.fetchDefaultRPCStatus = function () {
    window.fetchAPIStatus("RPC", DEFAULT_RPC_ENDPOINT, "/status", "rpc-status", "rpc-response");
};

window.fetchDefaultLCDStatus = function () {
    window.fetchAPIStatus("LCD", DEFAULT_LCD_ENDPOINT, "/cosmos/base/tendermint/v1beta1/blocks/latest", "lcd-status", "lcd-response");
};

window.fetchLav5LCDStatus = function () {
    window.fetchAPIStatus("LCD", "https://secretnetwork-api.lavenderfive.com:443", "/cosmos/base/tendermint/v1beta1/blocks/latest", "Lav5-lcd-status", "Lav5-lcd-response");
};

window.fetchLav5RPCStatus = function () {
    window.fetchAPIStatus("RPC", "https://secretnetwork-rpc.lavenderfive.com:443", "/status", "Lav5-rpc-status", "Lav5-rpc-response");
};

window.fetchAnkrRPCStatus = function () {
   window.fetchAPIStatus("RPC", "https://scrt.public-rpc.com", "/status", "ankr-rpc-status", "ankr-rpc-response");
};







