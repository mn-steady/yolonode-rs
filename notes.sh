fetchBatchPrices().then(prices => console.log("Batch Prices:", prices));

fetchDerivativePrices().then(prices => console.log("Derivative Batch Prices:", prices));

fetchSTKDExchangeRate().then(exchangeRate => console.log("stkd-SCRT Exchange Rate:", exchangeRate));

fetchGovernanceProposals().then(price => console.log("Governance Proposals:", proposals));

window.fetchGovernanceProposals().then(console.log).catch(console.error);

fetchAllRedemptionRates()
    .then(rates => console.log('All Redemption Rates:', rates))
    .catch(err => console.error('Error:', err));

fetchRedemptionRates()
    .then(rates => console.log('Host Zone Redemption Rates:', rates))
    .catch(err => console.error('Error:', err));

fetchRedemptionRateForTIA()
    .then(rate => console.log('Redemption Rate for TIA:', rate))
    .catch(err => console.error('Error:', err));

#Graph QL Endpoint
https://prodv1.securesecrets.org/graphql 

#Query Tokens
query {
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

#Query Price of specific token
query {
  prices(query: { ids: ["563526c3-2187-4f3a-a41b-813f599bf59c"] }) {
    id
    value
  }
}

fetchAllTokenPricesWithNames();

##Test Voting From console
#Connect Wallet 
await window.connectKeplrWallet(); 

#Test Fetching Props
const proposals = await window.fetchGovernanceProposals();
console.log(proposals);

#Vote on Proposal 
const result = await window.voteOnProposal(313, "Yes");
console.log(result);



