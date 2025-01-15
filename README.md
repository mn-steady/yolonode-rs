# YoloNode
A Leptos-based Rust project with Keplr, Shade Protocol, and Stride API connectivity

## Features
- Keplr API for wallet connectivity, signing transactions, and interacting with the user's account on the blockchain
- Secret Network API for querying blockchain data (e.g., governance proposals) and managing signed transactions
- Shade Protocol API for retrieving price feeds and derivative information
- Stride API for accessing staking and liquid staking-related derivative data, such as redemption rates for host zones
- Multiple View Sections
- Desktop/Mobile layouts

## Setup
1. Clone the repository and navigate to the directory
2. Run: ./build.sh
3. To test Local: python3 -m http.server --bind 127.0.0.1
4. Push to github with pages setup

## Manual Steps if you dont want to use the build.sh
1. Clone the repository and navigate to the directory
2. Run: trunk build --release 
3. Run: cargo build --release --target wasm32-unknown-unknown
4. Run: wasm-bindgen --out-dir dist/pkg --target web target/wasm32-unknown-unknown/release/yolonode.wasm
5. Run: mkdir -p dist/static
6. Run: cp static/* dist/static
7. To test Locall: python3 -m http.server --bind 127.0.0.1
8. Push to github with pages setup


