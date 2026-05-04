# Pixelforge

Pixelforge is a browser-native image studio for local viewing, conversion, resizing, and metadata inspection.

## Project layout

- `crates/pixelforge-core/` - Rust Wasm image pipeline for standard formats.
- `web/` - Vite + React frontend.
- `build/` - HEIF/HEIC build tooling scaffold.

## Status

The project scaffold is in place. The Rust core and web app shells have been created, and the HEIF build pipeline is stubbed for the next implementation pass.

## Next steps

1. Install Rust, wasm-pack, and Node dependencies.
2. Build the Rust Wasm crate.
3. Wire the browser UI to the Wasm exports and HEIF decoder path.
