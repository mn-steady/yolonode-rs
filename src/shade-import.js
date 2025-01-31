// src/shade-import.js
import { batchQueryIndividualPrices } from '@shadeprotocol/shadejs';
import { queryDerivativeScrtInfo } from '@shadeprotocol/shadejs';
import { DEFAULT_LCD_ENDPOINT } from './secret-import';

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

// Function to fetch derivative prices
window.fetchDerivativePrices = async function (
    derivativeKeys = ["stkd-SCRT", "Stride ATOM", "Stride TIA"],
    options = {}
) {
    const {
        queryRouterContractAddress = "secret15mkmad8ac036v4nrpcc7nk8wyr578egt077syt",
        queryRouterCodeHash = "1c7e86ba4fdb6760e70bf08a7df7f44b53eb0b23290e3e69ca96140810d4f432",
        oracleContractAddress = "secret10n2xl5jmez6r9umtdrth78k0vwmce0l5m9f5dm",
        oracleCodeHash = "32c4710842b97a526c243a68511b15f58d6e72a388af38a7221ff3244c754e91",
        lcdEndpoint = DEFAULT_LCD_ENDPOINT,
    } = options;

    console.log("Fetching derivative prices using LCD endpoint:", lcdEndpoint);

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
        // Fetch derivative prices individually in a batch
        const priceData = await batchQueryIndividualPrices({
            queryRouterContractAddress,
            queryRouterCodeHash,
            oracleContractAddress,
            oracleCodeHash,
            oracleKeys: derivativeKeys,
            lcdEndpoint,
        });

        const formattedPrices = {};

        // Format fetched prices
        derivativeKeys.forEach((key) => {
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
        console.error("Error fetching derivative prices:", error);
        return { prices: {}, error: "Failed to fetch derivative prices" };
    }
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

        console.log("stkd-SCRT Exchange Rate:", derivativeInfo.exchangeRate);
        return derivativeInfo.exchangeRate;
    } catch (error) {
        console.error("Error fetching stkd-SCRT to SCRT exchange rate:", error);
        throw error;
    }
};


