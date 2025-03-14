// src/shade-import.js
import { batchQueryIndividualPrices } from '@shadeprotocol/shadejs';
import { queryDerivativeScrtInfo } from '@shadeprotocol/shadejs';
import { DEFAULT_API_ENDPOINT } from './secret-import';

window.secretClient = null;

window.getSecretClient = function (lcdEndpoint) {
    if (!window.secretClient) {
        try {
            window.secretClient = createSecretClient(lcdEndpoint);
            console.log("✅ Cached Secret client created:", window.secretClient);
        } catch (error) {
            console.error("❌ Error creating Secret client:", error);
            return null;
        }
    }
    return window.secretClient;
};

// Function to fetch multiple prices individually but in a batch  
// This is a less efficient version of the multi-price query in the oracle contract, 
// however the benefits are that an error in any single price will not cause all prices to fail. 

window.fetchBatchPrices = async function (
    oracleKeys = ["BTC", "ETH", "SHD", "SCRT", "ATOM", "TIA", "SILK"],
    options = {}
) {
    const {
        queryRouterContractAddress = "secret15mkmad8ac036v4nrpcc7nk8wyr578egt077syt",
        queryRouterCodeHash = "1c7e86ba4fdb6760e70bf08a7df7f44b53eb0b23290e3e69ca96140810d4f432",
        oracleContractAddress = "secret10n2xl5jmez6r9umtdrth78k0vwmce0l5m9f5dm",
        oracleCodeHash = "32c4710842b97a526c243a68511b15f58d6e72a388af38a7221ff3244c754e91",
        lcdEndpoint = DEFAULT_API_ENDPOINT,
    } = options;

    if (!lcdEndpoint) {
        throw new Error("❌ LCD endpoint is not defined. Please provide a valid endpoint.");
    }

    let client = window.getSecretClient(lcdEndpoint);
    if (!client) {
        return { prices: {}, error: "Failed to create Secret client" };
    }

    const DECIMALS = 1e18; // Constant for rate conversion

    try {
        // Fetch prices individually in a batch
        const priceData = await batchQueryIndividualPrices({
            queryRouterContractAddress,
            queryRouterCodeHash,
            oracleContractAddress,
            oracleCodeHash,
            oracleKeys,
            lcdEndpoint,
        });

        const formattedPrices = {};
        oracleKeys.forEach((key) => {
            if (priceData[key]?.rate) {
                try {
                    formattedPrices[key] = (parseFloat(priceData[key].rate) / DECIMALS).toFixed(4);
                    console.log(`📊 Formatted ${key} Price:`, formattedPrices[key]);
                } catch (formatError) {
                    console.error(`❌ Error formatting price for ${key}:`, formatError);
                    formattedPrices[key] = "Error Formatting";
                }
            } else {
                formattedPrices[key] = "No Data";
                console.warn(`No price data found for ${key}`);
            }
        });

        return { prices: formattedPrices, fetchedAt: new Date().toISOString() };
    } catch (error) {
        console.error("❌ Error fetching batch prices:", error);
        return { prices: {}, error: "Failed to fetch batch prices" };
    }
};

// Fetch derivative prices
window.fetchDerivativePrices = async function (
    derivativeKeys = ["stkd-SCRT", "Stride ATOM", "Stride TIA"],
    options = {}
) {
    return window.fetchBatchPrices(derivativeKeys, options);
};

// Fetch Silk price
window.fetchSilkPrice = async function (
    derivativeKeys = ["SILK"],
    options = {}
) {
    return window.fetchBatchPrices(derivativeKeys, options);
};

//Fetch STKD Exchange Rate
window.fetchSTKDExchangeRate = async function () {
    try {
        const derivativeInfo = await queryDerivativeScrtInfo({
            queryRouterContractAddress: "secret15mkmad8ac036v4nrpcc7nk8wyr578egt077syt",
            queryRouterCodeHash: "1c7e86ba4fdb6760e70bf08a7df7f44b53eb0b23290e3e69ca96140810d4f432",
            contractAddress: "secret1k6u0cy4feepm6pehnz804zmwakuwdapm69tuc4",
            codeHash: "f6be719b3c6feb498d3554ca0398eb6b7e7db262acb33f84a8f12106da6bbb09",
            queryTimeSeconds: Math.floor(Date.now() / 1000),
        });

        console.log("📊 stkd-SCRT Exchange Rate:", derivativeInfo.exchangeRate);
        return derivativeInfo.exchangeRate;
    } catch (error) {
        console.error("❌ Error fetching stkd-SCRT to SCRT exchange rate:", error);
        throw error;
    }
};

// Fetch all ShadeSwap pools though GraphQL
window.fetchAllShadeSwapPools = async function () {
    const GRAPHQL_ENDPOINT = "https://prodv1.securesecrets.org/graphql";
    const query = `
        query {
            pools {
                id
                token0Id
                token1Id
            }
        }
    `;

    try {
        console.log("🔍 Fetching ShadeSwap pools...");

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });

        const json = await response.json();

        if (json.errors) {
            console.error("❌ GraphQL Errors:", json.errors);
            return [];
        }

        const pools = json?.data?.pools || [];
        console.log("✅ Fetched Pools:", pools); 

        return pools;
    } catch (error) {
        console.error("❌ Error fetching ShadeSwap pools:", error);
        return [];
    }
};

// Fetch dSHD price through GraphQL
window.fetchDSHDPrice = async function () {
    const GRAPHQL_ENDPOINT = "https://prodv1.securesecrets.org/graphql";
    const DSHD_ID = "563526c3-2187-4f3a-a41b-813f599bf59c"; 

    const query = `
        query {
            prices(query: { ids: ["${DSHD_ID}"] }) {
                id
                value
            }
        }
    `;

    try {
        console.log("🚀 Fetching dSHD price...");

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });

        const json = await response.json();
        console.log("✅ GraphQL Response for dSHD:", json);

        if (json.errors) {
            console.error("❌ GraphQL Errors:", json.errors);
            return { error: "Failed to fetch dSHD price" };
        }

        const priceData = json?.data?.prices?.[0];

        if (priceData && priceData.value) {
            const formattedPrice = parseFloat(priceData.value).toFixed(6);
            console.log(`dSHD: ${formattedPrice}`);
            return { price: formattedPrice };
        } else {
            console.warn("No price data found for dSHD");
            return { error: "No price data available" };
        }
    } catch (error) {
        console.error("❌ Error fetching dSHD price:", error);
        return { error: "Request failed" };
    }
};

// Fetch all token prices through GraphQL
window.fetchAllTokenPricesWithNames = async function () {
    const GRAPHQL_ENDPOINT = "https://prodv1.securesecrets.org/graphql";

    // Step 1: Fetch All Tokens
    const tokensQuery = {
        operationName: "getTokens",
        query: `
            query getTokens {
                tokens {
                    id
                    name
                    symbol
                    description
                    logoPath
                    PriceToken {
                        priceId
                    }
                }
            }
        `,
        variables: {}
    };

    try {
        console.log("🔍 Fetching token details...");

        const tokensResponse = await fetch(GRAPHQL_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tokensQuery),
        });

        const tokensJson = await tokensResponse.json();
        if (tokensJson.errors) {
            console.error("❌ GraphQL Errors (Tokens):", tokensJson.errors);
            return;
        }

        const tokens = tokensJson?.data?.tokens || [];
        console.log("✅ Tokens Loaded:", tokens.length);

        // Step 2: Extract Token IDs for Price Query
        const tokenIds = tokens
            .filter(token => token.PriceToken.length > 0) // Only tokens with prices
            .map(token => token.PriceToken[0].priceId);

        if (tokenIds.length === 0) {
            console.warn("⚠️ No tokens with valid prices found.");
            return;
        }

        // Step 3: Fetch Prices Using Token IDs
        console.log("🔍 Fetching token prices...");
        const pricesQuery = {
            operationName: "getPrices",
            query: `
                query getPrices($ids: [String!]) {
                    prices(query: { ids: $ids }) {
                        id
                        value
                    }
                }
            `,
            variables: { ids: tokenIds }
        };

        const pricesResponse = await fetch(GRAPHQL_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pricesQuery),
        });

        const pricesJson = await pricesResponse.json();
        if (pricesJson.errors) {
            console.error("❌ GraphQL Errors (Prices):", pricesJson.errors);
            return;
        }

        const priceData = pricesJson?.data?.prices || [];

        // Step 4: Map Prices to Tokens
        const priceMap = new Map(priceData.map(price => [price.id, price.value]));

        const formattedPrices = {};
        tokens.forEach(token => {
            const priceId = token.PriceToken[0]?.priceId;
            if (priceId && priceMap.has(priceId)) {
                formattedPrices[token.symbol] = priceMap.get(priceId)?.toFixed(6) || "No Data";
            }
        });

        console.log("📊 Final Token Prices:", formattedPrices);
        return formattedPrices;

    } catch (error) {
        console.error("❌ Error fetching token prices:", error);
    }
};

// Fetch all ShadeSwap Pools on page load
(async () => {
    console.log("🚀 Initializing ShadeSwap Pool Fetcher...");
    await window.fetchAllShadeSwapPools();
})();
