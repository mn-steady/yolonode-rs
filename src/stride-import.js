import { stride } from 'stridejs';

// Initialize the Stride RPC client
export async function initializeStrideClient() {
    const rpcEndpoint = 'https://stride-rpc.polkachu.com/';
    try {
        const client = await stride.ClientFactory.createRPCQueryClient({ rpcEndpoint });
        console.log('🚀 Stride Client initialized:', client);
        return client;
    } catch (error) {
        console.error('❌ Failed to initialize Stride Client:', error);
        throw error;
    }
}

// Fetch redemption rates for all host zones
export async function fetchRedemptionRates() {
    try {
        const client = await initializeStrideClient();
        let allHostZones = [];
        let nextKey = null;

        // Fetch all pages of host zones
        do {
            const requestParams = nextKey ? { pagination: { key: nextKey } } : {};
            const response = await client.stride.stakeibc.hostZoneAll(requestParams);
            if (response.hostZone) {
                allHostZones = allHostZones.concat(response.hostZone);
            }
            nextKey = response.pagination?.nextKey ? new Uint8Array(response.pagination.nextKey) : null;
        } while (nextKey && nextKey.length > 0);

        console.log('✅ Fetched Host Zones:', allHostZones);

        // Redemption rates for available host zones
        const redemptionRates = allHostZones.reduce((rates, zone) => {
            if (zone.lastRedemptionRate) {
                rates[zone.chainId] = parseFloat(zone.lastRedemptionRate) / 1e18;
            }
            return rates;
        }, {});

        // console.log('📊 Redemption Rates:', redemptionRates);
        return redemptionRates;
    } catch (error) {
        console.error('❌ Error fetching redemption rates:', error);
        throw error;
    }
}

// Fetch redemption rate for Celestia
export async function fetchRedemptionRateForTIA() {
    try {
        const apiUrl = "https://stride-api.polkachu.com/Stride-Labs/stride/stakeibc/host_zone";
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
       // console.log("🔍 Full API Response for TIA :", data);

        const celestiaZone = data.host_zone.find(zone => zone.chain_id === "celestia");

        if (!celestiaZone || !celestiaZone.last_redemption_rate) {
            console.warn("⚠️ last_redemption_rate is missing for TIA. Using fallback.");
            return 1.0; 
        }

        const redemptionRate = parseFloat(celestiaZone.last_redemption_rate);
        console.log("📊 Redemption Rate for TIA :", redemptionRate);
        return redemptionRate;
    } catch (error) {
        console.error("❌ Error fetching redemption rate for TIA:", error);
        return 1.0; 
    }
}

// Unified function to fetch all redemption rates (stATOM and stTIA)
export async function fetchAllRedemptionRates() {
    try {
        const [hostZoneRates, tiaRate] = await Promise.all([
            fetchRedemptionRates(),
            fetchRedemptionRateForTIA(),
        ]);

        if (tiaRate !== null) {
            hostZoneRates["stTIA"] = tiaRate;
        } else {
            console.warn("⚠️ Skipping TIA rate because it was not found.");
        }

        console.log("📊 All Redemption Rates:", hostZoneRates);
        return hostZoneRates;
    } catch (error) {
        console.error("❌ Error fetching all redemption rates:", error);
        return {};
    }
}

// Attach functions to the global `window` object for testing
window.initializeStrideClient = initializeStrideClient;
window.fetchRedemptionRates = fetchRedemptionRates;
window.fetchRedemptionRateForTIA = fetchRedemptionRateForTIA;
window.fetchAllRedemptionRates = fetchAllRedemptionRates;
