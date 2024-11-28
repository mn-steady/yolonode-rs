// src/shade-import.js
import { queryPrice, batchQueryIndividualPrices } from '@shadeprotocol/shadejs';
import { SecretNetworkClient } from 'secretjs';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Attach SecretNetworkClient to `window` for global access
window.SecretNetworkClient = SecretNetworkClient;

// Default LCD endpoint
const DEFAULT_LCD_ENDPOINT = "https://rpc.ankr.com/http/scrt_cosmos";

// Function to create SecretNetworkClient with a configurable LCD endpoint
function createSecretClient(endpoint = DEFAULT_LCD_ENDPOINT) {
    console.log("Creating SecretNetworkClient with endpoint:", endpoint);

    return new SecretNetworkClient({
        url: endpoint,
        chainId: "secret-4",
    });
}

window.fetchSHDPrice = async function () {
    try {
        const priceData = await queryPrice({
            contractAddress: "secret10n2xl5jmez6r9umtdrth78k0vwmce0l5m9f5dm",
            codeHash: "32c4710842b97a526c243a68511b15f58d6e72a388af38a7221ff3244c754e91",
            oracleKey: 'SHD',
        });
        
        // Format the rate for display, assuming `rate` needs division for decimal precision.
        const rateFormatted = (parseFloat(priceData.rate) / 1e18).toFixed(4);
        console.log("Formatted SHD Price:", rateFormatted);
        return rateFormatted;
    } catch (error) {
        console.error("Error fetching SHD price:", error);
        throw error;
    }
};

window.fetchSCRTPrice = async function () {
    try {
        const priceData = await queryPrice({
            contractAddress: "secret10n2xl5jmez6r9umtdrth78k0vwmce0l5m9f5dm",
            codeHash: "32c4710842b97a526c243a68511b15f58d6e72a388af38a7221ff3244c754e91",
            oracleKey: 'SCRT',
        });

        const rateFormatted = (parseFloat(priceData.rate) / 1e18).toFixed(4);
        console.log("Formatted SCRT Price:", rateFormatted);
        return rateFormatted;
    } catch (error) {
        console.error("Error fetching SCRT price:", error);
        throw error;
    }
};

window.fetchSTKDPrice = async function () {
    try {
        const priceData = await queryPrice({
            contractAddress: "secret10n2xl5jmez6r9umtdrth78k0vwmce0l5m9f5dm",
            codeHash: "32c4710842b97a526c243a68511b15f58d6e72a388af38a7221ff3244c754e91",
            oracleKey: 'stkd-SCRT',
        });

        const rateFormatted = (parseFloat(priceData.rate) / 1e18).toFixed(4);
        console.log("Formatted stkd-SCRT Price:", rateFormatted);
        return rateFormatted;
    } catch (error) {
        console.error("Error fetching stkd-SCRT price:", error);
        throw error;
    }
};

window.fetchBTCPrice = async function () {
    try {
        const priceData = await queryPrice({
            contractAddress: "secret10n2xl5jmez6r9umtdrth78k0vwmce0l5m9f5dm",
            codeHash: "32c4710842b97a526c243a68511b15f58d6e72a388af38a7221ff3244c754e91",
            oracleKey: 'BTC',
        });

        const rateFormatted = (parseFloat(priceData.rate) / 1e18).toFixed(4);
        console.log("Formatted BTC Price:", rateFormatted);
        return rateFormatted;
    } catch (error) {
        console.error("Error fetching BTC price:", error);
        throw error;
    }
};

window.fetchETHPrice = async function () {
    try {
        const priceData = await queryPrice({
            contractAddress: "secret10n2xl5jmez6r9umtdrth78k0vwmce0l5m9f5dm",
            codeHash: "32c4710842b97a526c243a68511b15f58d6e72a388af38a7221ff3244c754e91",
            oracleKey: 'ETH',
        });

        const rateFormatted = (parseFloat(priceData.rate) / 1e18).toFixed(4);
        console.log("Formatted ETH Price:", rateFormatted);
        return rateFormatted;
    } catch (error) {
        console.error("Error fetching ETH price:", error);
        throw error;
    }
};

// Function to fetch multiple prices individually but in a batch  
// This is a less efficient version of the multi-price query in the oracle contract, 
// however the benefits are that an error in any single price will not cause all prices to fail. 

window.fetchBatchPrices = async function (
    oracleKeys = ["BTC", "ETH", "SHD", "SCRT", "ATOM", "TIA", "stkd-SCRT", "SILK"],
    options = {}
) {
    const {
        queryRouterContractAddress = "secret15mkmad8ac036v4nrpcc7nk8wyr578egt077syt",
        queryRouterCodeHash = "1c7e86ba4fdb6760e70bf08a7df7f44b53eb0b23290e3e69ca96140810d4f432",
        oracleContractAddress = "secret10n2xl5jmez6r9umtdrth78k0vwmce0l5m9f5dm",
        oracleCodeHash = "32c4710842b97a526c243a68511b15f58d6e72a388af38a7221ff3244c754e91",
        lcdEndpoint = DEFAULT_LCD_ENDPOINT,
    } = options;

    console.log("Using LCD endpoint:", lcdEndpoint);

    // Ensure the LCD endpoint is valid
    if (!lcdEndpoint) {
        throw new Error("LCD endpoint is not defined. Please provide a valid endpoint.");
    }

    // Create Secret Network client
    let client;
    try {
        client = createSecretClient(lcdEndpoint);
        console.log("Secret client created:", client);
    } catch (error) {
        console.error("Error creating Secret client:", error);
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

        // Format fetched prices
        oracleKeys.forEach((key) => {
            if (priceData[key]?.rate) {
                try {
                    formattedPrices[key] = (parseFloat(priceData[key].rate) / DECIMALS).toFixed(4);
                    console.log(`Formatted ${key} Price:`, formattedPrices[key]);
                } catch (formatError) {
                    console.error(`Error formatting price for ${key}:`, formatError);
                    formattedPrices[key] = "Error Formatting";
                }
            } else {
                formattedPrices[key] = "No Data";
                console.warn(`No price data found for ${key}`);
            }
        });

        return { prices: formattedPrices, fetchedAt: new Date().toISOString() };
    } catch (error) {
        console.error("Error fetching batch prices:", error);
        return { prices: {}, error: "Failed to fetch batch prices" };
    }
};

// Calculator price convertor function
function calculate_liquidation_price() {
    const liquidationPriceInput = document.getElementById("liquidation-price");
    const exchangeRateInput = document.getElementById("exchange-rate");
    const resultElement = document.getElementById("base-asset-price");

    const liquidationPrice = parseFloat(liquidationPriceInput.value);
    const exchangeRate = parseFloat(exchangeRateInput.value);

    if (isNaN(liquidationPrice) || isNaN(exchangeRate) || exchangeRate <= 0) {
        resultElement.textContent = "Please enter valid inputs.";
        return;
    }

    const baseAssetPrice = liquidationPrice / exchangeRate;
    resultElement.textContent = `$${baseAssetPrice.toFixed(4)}`;
}

