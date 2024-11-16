// src/shade-import.js
import { queryPrice } from '@shadeprotocol/shadejs';
import { SecretNetworkClient } from 'secretjs';

// Attach SecretNetworkClient to `window` for global access
window.SecretNetworkClient = SecretNetworkClient;

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
