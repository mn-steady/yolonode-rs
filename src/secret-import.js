import { SecretNetworkClient } from 'secretjs';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

window.SecretNetworkClient = SecretNetworkClient;

// API URLs
export const DEFAULT_LCD_ENDPOINT = "https://rpc.ankr.com/http/scrt_cosmos";
export const DEFAULT_RPC_ENDPOINT = "https://api.yolonode.com";
export const DEFAULT_GRPC_ENDPOINT = "api.yolonode.com:9091"; 

// Function to create a Secret Network Client
export function createSecretClient(endpoint = DEFAULT_LCD_ENDPOINT) {
    console.log("🚀 Creating SecretNetworkClient with endpoint:", endpoint);
    return new SecretNetworkClient({
        url: endpoint,
        chainId: "secret-4",
    });
}

window.createSecretClient = createSecretClient;

// Function to fetch API status dynamically (LCD, RPC, gRPC)
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

// Function to fetch gRPC status using a proxy
window.fetchGRPCStatus = function (attempt = 1, maxAttempts = 10) {
    console.log(`🚀 Fetching gRPC Status (Attempt ${attempt})`);

    const statusElement = document.getElementById("grpc-status");
    const responseElement = document.getElementById("grpc-response");

    if (!statusElement || !responseElement) {
        if (attempt < maxAttempts) {
            console.warn(`❗ gRPC status elements not found in DOM. Retrying... (${attempt}/${maxAttempts})`);
            setTimeout(() => window.fetchGRPCStatus(attempt + 1, maxAttempts), 300);
        } else {
            console.error("❌ Failed to find gRPC status elements after multiple retries.");
        }
        return;
    }

    // Set initial loading state
    statusElement.textContent = `Status: Loading...`;
    responseElement.textContent = `gRPC Response: Loading...`;

    // Use fetch to call gRPC proxy endpoint
    fetch(`https://api.yolonode.com/grpc-proxy`)  
        .then(response => response.text())
        .then(data => {
            console.log(`✅ gRPC Response:`, data);
            statusElement.textContent = "Status: ✅ gRPC is UP!";
            responseElement.textContent = data; 
        })
        .catch(error => {
            console.error(`❌ Error fetching gRPC status:`, error);
            statusElement.textContent = `Status: ❌ gRPC is DOWN!`;
            responseElement.textContent = `⚠️ Error fetching gRPC status`;
        });
};

// Wrapper functions for each API type
window.fetchDefaultGRPCStatus = function () {
    window.fetchGRPCStatus();
};

window.fetchDefaultRPCStatus = function () {
    window.fetchAPIStatus("RPC", DEFAULT_RPC_ENDPOINT, "/rpc/status", "rpc-status", "rpc-response");
};

window.fetchDefaultLCDStatus = function () {
    window.fetchAPIStatus("LCD", DEFAULT_LCD_ENDPOINT, "/cosmos/base/tendermint/v1beta1/blocks/latest", "lcd-status", "lcd-response");
};

window.fetchSaturnLCDStatus = function () {
    window.fetchAPIStatus("LCD", "https://lcd.mainnet.secretsaturn.net", "/cosmos/base/tendermint/v1beta1/blocks/latest", "saturn-lcd-status", "saturn-lcd-response");
};

window.fetchLav5LCDStatus = function () {
    window.fetchAPIStatus("LCD", "https://secretnetwork-api.lavenderfive.com:443", "/cosmos/base/tendermint/v1beta1/blocks/latest", "Lav5-lcd-status", "Lav5-lcd-response");
};

window.fetchSaturnRPCStatus = function () {
    window.fetchAPIStatus("RPC", "https://rpc.mainnet.secretsaturn.net", "/status", "saturn-rpc-status", "saturn-rpc-response");
};

window.fetchLav5RPCStatus = function () {
    window.fetchAPIStatus("RPC", "https://secretnetwork-rpc.lavenderfive.com:443", "/status", "Lav5-rpc-status", "Lav5-rpc-response");
};

window.fetchWhisperRPCStatus = function () {
    window.fetchAPIStatus("RPC", "https://rpc-secret.whispernode.com:443", "/rpc/status", "whisper-rpc-status", "whisper-rpc-response");
};

// window.fetchAnkrRPCStatus = function () {
   // window.fetchAPIStatus("RPC", "https://scrt.public-rpc.com", "/rpc/status", "ankr-rpc-status", "ankr-rpc-response");
// };





