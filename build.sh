#!/bin/bash
set -e

echo "🛠️ Running trunk build --release..."
trunk build --release

echo "🔧 Building for wasm32-unknown-unknown..."
cargo build --release --target wasm32-unknown-unknown

echo "🔗 Running wasm-bindgen..."
wasm-bindgen target/wasm32-unknown-unknown/release/yolonode.wasm \
  --out-dir dist/pkg \
  --target web \
  --no-typescript \
  --weak-refs

echo "📦 Bundling JavaScript files with webpack..."
npx webpack

echo "📁 Copying static files..."
mkdir -p dist/static
cp -r static/* dist/static

# Optional check
if [ -f dist/pkg/yolonode.js ]; then
  echo "✅ wasm-bindgen output verified: yolonode.js found in dist/pkg"
else
  echo "❌ ERROR: yolonode.js not found in dist/pkg!"
  exit 1
fi

echo "✅ Build completed successfully!"
