# YoloProto
A Leptos-based Rust project with Keplr wallet integration.

## Features
- Dark background and gold text
- Top bar with "YoloProto" and "Connect Wallet" button
- Keplr wallet connectivity

## Setup
1. Clone the repository and navigate to the directory.
2. Navigate to the project root directory
3. Run: ./build.sh
4. To test Locall: python3 -m http.server --bind 127.0.0.1
5. Push to github with pages setup

## Manual Steps if you dont want to use the build.sh
1. Clone the repository and navigate to the directory.
2. Navigate to the project root directory
3. Run: trunk build --release 
4. Run: cargo build --release --target wasm32-unknown-unknown
5. Run: wasm-bindgen --out-dir dist/pkg --target web target/wasm32-unknown-unknown/release/yoloproto.wasm
6. Run: mkdir -p dist/static
7. Run: cp static/* dist/static
8. To test Locall: python3 -m http.server --bind 127.0.0.1
9. Push to github with pages setup


