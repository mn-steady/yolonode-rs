fetchBatchPrices().then(prices => console.log("Batch Prices:", prices));

fetchDerivativePrices().then(prices => console.log("Derivative Batch Prices:", prices));

fetchSTKDExchangeRate().then(exchangeRate => console.log("stkd-SCRT Exchange Rate:", exchangeRate));

fetchGovernanceProposals().then(price => console.log("Governance Proposals:", proposals));

window.fetchGovernanceProposals().then(console.log).catch(console.error);


log::info!("Selected Derivative: {}")

fetchAllRedemptionRates()
    .then(rates => console.log('All Redemption Rates:', rates))
    .catch(err => console.error('Error:', err));

fetchRedemptionRates()
    .then(rates => console.log('Host Zone Redemption Rates:', rates))
    .catch(err => console.error('Error:', err));

fetchRedemptionRateForTIA()
    .then(rate => console.log('Redemption Rate for TIA:', rate))
    .catch(err => console.error('Error:', err));

##Test Voting From console
#Connect Wallet 
await window.connectKeplrWallet(); 

#Test Fetching Props
const proposals = await window.fetchGovernanceProposals();
console.log(proposals);

#Vote on Proposal 
const result = await window.voteOnProposal(313, "Yes");
console.log(result);



