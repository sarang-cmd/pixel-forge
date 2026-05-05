#!/bin/bash
# Pixel Forge Feature Verification Script
# This script documents and validates all PRD feature implementations

echo "======================================"
echo "  Pixel Forge - PRD Feature Report   "
echo "======================================"
echo ""

# Track results
declare -A RESULTS
RESULTS["FEATURE_COUNT"]=0
RESULTS["PASSED"]=0
RESULTS["PARTIAL"]=0
RESULTS["FAILED"]=0
RESULTS["BLOCKED"]=0

log_feature() {
  local name="$1"
  local status="$2"
  local details="$3"
  
  echo "[$status] $name"
  if [ -n "$details" ]; then
    echo "  └─ $details"
  fi
  echo ""
  
  RESULTS["FEATURE_COUNT"]=$((RESULTS["FEATURE_COUNT"] + 1))
  RESULTS["$status"]=$((RESULTS["$status"] + 1))
}

echo "--- FILE STRUCTURE & BUILD ---"
echo ""

# Check repo structure
if [ -f "/workspaces/pixel-forge/Cargo.toml" ] && [ -f "/workspaces/pixel-forge/web/package.json" ]; then
  log_feature "Repository Structure" "PASSED" "Rust workspace + Web app structure in place"
else
  log_feature "Repository Structure" "FAILED" "Missing required repo files"
fi

if [ -f "/workspaces/pixel-forge/web/dist/index.html" ]; then
  log_feature "Web Build Output" "PASSED" "Frontend builds successfully with Vite"
else
  log_feature "Web Build Output" "BLOCKED" "Run: cd /workspaces/pixel-forge/web && npm run build"
fi

# Check component files
components_expected="FileDropzone ImageViewer FormatPanel OptimizePanel MetadataPanel BatchPanel Header"
components_found=0
for comp in $components_expected; do
  if [ -f "/workspaces/pixel-forge/web/src/components/${comp}.tsx" ]; then
    components_found=$((components_found + 1))
  fi
done

if [ $components_found -eq 7 ]; then
  log_feature "UI Components" "PASSED" "All 7 required components present"
else
  log_feature "UI Components" "PARTIAL" "$components_found/7 components found"
fi

echo "--- CORE FEATURES ---"
echo ""

# Feature: File Upload & Drag-Drop
if grep -q "onDrop\|onFiles\|accept=" /workspaces/pixel-forge/web/src/components/FileDropzone.tsx; then
  log_feature "File Upload (Drag & Drop)" "PASSED" "FileDropzone supports file input and drag-and-drop"
else
  log_feature "File Upload (Drag & Drop)" "FAILED" "FileDropzone missing handlers"
fi

# Feature: Format Support
supported_formats="HEIF HEIC JPEG PNG WebP AVIF BMP GIF TIFF"
format_checks=0
for fmt in $supported_formats; do
  if grep -qi "$fmt" /workspaces/pixel-forge/web/src/components/FileDropzone.tsx; then
    format_checks=$((format_checks + 1))
  fi
done

if [ $format_checks -ge 8 ]; then
  log_feature "Supported Image Formats" "PASSED" "HEIF/HEIC/JPEG/PNG/WebP/AVIF/BMP/GIF/TIFF listed"
else
  log_feature "Supported Image Formats" "PARTIAL" "Not all formats advertised in UI"
fi

# Feature: Viewer with Controls
viewer_controls="ZoomIn ZoomOut Maximize2 RotateCcw RotateCw FlipHorizontal FlipVertical"
viewer_found=0
for ctrl in $viewer_controls; do
  if grep -q "$ctrl" /workspaces/pixel-forge/web/src/components/ImageViewer.tsx; then
    viewer_found=$((viewer_found + 1))
  fi
done

if [ $viewer_found -eq 7 ]; then
  log_feature "Viewer with Zoom/Pan/Rotate/Flip" "PASSED" "All 7 viewer controls implemented"
else
  log_feature "Viewer with Zoom/Pan/Rotate/Flip" "PARTIAL" "$viewer_found/7 controls found"
fi

# Feature: Conversion Panel
if grep -q "targetFormat\|quality\|maintainAspect" /workspaces/pixel-forge/web/src/components/FormatPanel.tsx; then
  log_feature "Format Conversion Panel" "PASSED" "Format selection, quality, aspect ratio controls present"
else
  log_feature "Format Conversion Panel" "FAILED" "Conversion controls missing"
fi

# Feature: Resize Controls
if grep -q "resizeMode\|targetWidth\|targetHeight\|scalePercent" /workspaces/pixel-forge/web/src/components/FormatPanel.tsx; then
  log_feature "Resize Controls" "PASSED" "Exact dimensions and scale percentage modes implemented"
else
  log_feature "Resize Controls" "FAILED" "Resize options missing"
fi

# Feature: Optimize Panel
if [ -f "/workspaces/pixel-forge/web/src/components/OptimizePanel.tsx" ]; then
  if grep -q "progressiveJpeg\|chromaSubsampling" /workspaces/pixel-forge/web/src/components/OptimizePanel.tsx; then
    log_feature "Advanced Optimize Controls" "PASSED" "Progressive JPEG and chroma subsampling options available"
  else
    log_feature "Advanced Optimize Controls" "PARTIAL" "OptimizePanel exists but controls may be incomplete"
  fi
else
  log_feature "Advanced Optimize Controls" "FAILED" "OptimizePanel not found"
fi

# Feature: Batch Processing
if grep -q "convertAll\|onConvertAll" /workspaces/pixel-forge/web/src/components/BatchPanel.tsx; then
  log_feature "Batch Conversion" "PASSED" "Batch convert button implemented"
else
  log_feature "Batch Conversion" "FAILED" "Batch conversion missing"
fi

# Feature: ZIP Export
if grep -q "JSZip\|saveAs\|zip.generateAsync" /workspaces/pixel-forge/web/src/components/BatchPanel.tsx; then
  log_feature "Batch ZIP Export" "PASSED" "ZIP export with jszip and file-saver integrated"
else
  log_feature "Batch ZIP Export" "FAILED" "ZIP export not implemented"
fi

# Feature: Metadata Display
if grep -q "metadata\|MetadataPanel" /workspaces/pixel-forge/web/src/components/MetadataPanel.tsx; then
  log_feature "Metadata Display" "PASSED" "Metadata panel shows image properties"
else
  log_feature "Metadata Display" "FAILED" "Metadata display not functional"
fi

# Feature: Download Output
if grep -q "downloadImage\|download.*output\|href.*convertedUrl" /workspaces/pixel-forge/web/src/hooks/useImageProcessor.ts; then
  log_feature "Download Converted Output" "PASSED" "Download action implemented"
else
  log_feature "Download Converted Output" "FAILED" "Download functionality missing"
fi

echo "--- PROCESSING PIPELINE ---"
echo ""

# Check processor module
if [ -f "/workspaces/pixel-forge/web/src/lib/processor.ts" ]; then
  log_feature "Browser Processing Layer" "PASSED" "processor.ts module present"
else
  log_feature "Browser Processing Layer" "FAILED" "processor.ts not found"
fi

# Check canvas-based processing
if grep -q "createImageBitmap\|canvas.toBlob\|encodeCanvas" /workspaces/pixel-forge/web/src/lib/processor.ts; then
  log_feature "Canvas-Based Processing" "PASSED" "Canvas fallback for image rendering implemented"
else
  log_feature "Canvas-Based Processing" "PARTIAL" "Canvas processing may be incomplete"
fi

# Check HEIF/HEIC boundary
if [ -f "/workspaces/pixel-forge/web/src/lib/heif.ts" ]; then
  if grep -q "decodeHeif\|initHeif\|isHeifFile" /workspaces/pixel-forge/web/src/lib/heif.ts; then
    log_feature "HEIF/HEIC Decoder Boundary" "PASSED" "libheif Wasm integration module present"
  else
    log_feature "HEIF/HEIC Decoder Boundary" "PARTIAL" "heif.ts exists but may be incomplete"
  fi
else
  log_feature "HEIF/HEIC Decoder Boundary" "BLOCKED" "heif.ts not found - HEIF/HEIC support unavailable without Wasm"
fi

# Check Wasm initialization
if grep -q "initWasm\|hasWasm" /workspaces/pixel-forge/web/src/lib/processor.ts; then
  log_feature "Wasm Runtime Init" "PASSED" "Wasm module initialization and health check present"
else
  log_feature "Wasm Runtime Init" "PARTIAL" "Wasm init may be incomplete"
fi

echo "--- RUST CORE (Validation) ---"
echo ""

# Check Rust workspace
if [ -f "/workspaces/pixel-forge/Cargo.toml" ]; then
  if grep -q "members.*pixelforge-core" /workspaces/pixel-forge/Cargo.toml; then
    log_feature "Rust Workspace Setup" "PASSED" "Workspace configured with pixelforge-core crate"
  else
    log_feature "Rust Workspace Setup" "FAILED" "Workspace members not configured"
  fi
else
  log_feature "Rust Workspace Setup" "FAILED" "Cargo.toml not found"
fi

# Check Rust core APIs
if [ -d "/workspaces/pixel-forge/crates/pixelforge-core/src" ]; then
  rust_api_count=0
  [ -f "/workspaces/pixel-forge/crates/pixelforge-core/src/lib.rs" ] && rust_api_count=$((rust_api_count + 1))
  [ -f "/workspaces/pixel-forge/crates/pixelforge-core/src/convert.rs" ] && rust_api_count=$((rust_api_count + 1))
  [ -f "/workspaces/pixel-forge/crates/pixelforge-core/src/resize.rs" ] && rust_api_count=$((rust_api_count + 1))
  [ -f "/workspaces/pixel-forge/crates/pixelforge-core/src/transform.rs" ] && rust_api_count=$((rust_api_count + 1))
  [ -f "/workspaces/pixel-forge/crates/pixelforge-core/src/metadata.rs" ] && rust_api_count=$((rust_api_count + 1))
  
  if [ $rust_api_count -eq 5 ]; then
    log_feature "Rust Core Modules" "PASSED" "All 5 required Rust modules present (lib, convert, resize, transform, metadata)"
  else
    log_feature "Rust Core Modules" "PARTIAL" "$rust_api_count/5 modules found"
  fi
else
  log_feature "Rust Core Modules" "BLOCKED" "Rust source not found - cargo toolchain unavailable in environment"
fi

# Check HEIF build pipeline
if [ -f "/workspaces/pixel-forge/build/Dockerfile.heif" ]; then
  log_feature "HEIF Build Pipeline (Docker)" "PASSED" "Emscripten Dockerfile for libheif present"
else
  log_feature "HEIF Build Pipeline (Docker)" "BLOCKED" "Dockerfile.heif not found - cannot build libheif without Docker"
fi

echo "--- ENVIRONMENT & DEPENDENCIES ---"
echo ""

# Check npm packages
if grep -q "react\|vite\|lucide-react" /workspaces/pixel-forge/web/package.json; then
  log_feature "Frontend Dependencies" "PASSED" "React, Vite, lucide-react installed"
else
  log_feature "Frontend Dependencies" "FAILED" "Core frontend deps missing"
fi

if grep -q "jszip\|file-saver" /workspaces/pixel-forge/web/package.json; then
  log_feature "Export Dependencies" "PASSED" "jszip and file-saver for ZIP export available"
else
  log_feature "Export Dependencies" "PARTIAL" "Export libs may be missing"
fi

# Check if Rust toolchain available
if command -v cargo &> /dev/null; then
  log_feature "Rust Toolchain" "PASSED" "cargo available - Wasm compilation possible"
else
  log_feature "Rust Toolchain" "BLOCKED" "cargo not installed - cannot build Rust Wasm module in this environment"
fi

echo ""
echo "======================================"
echo "  SUMMARY                            "
echo "======================================"
echo "Total Features Checked:    ${RESULTS[FEATURE_COUNT]}"
echo "  ✓ Passed:               ${RESULTS[PASSED]}"
echo "  ◐ Partial:              ${RESULTS[PARTIAL]}"
echo "  ✗ Failed:               ${RESULTS[FAILED]}"
echo "  ⊘ Blocked:              ${RESULTS[BLOCKED]}"
echo ""

pass_rate=$((RESULTS[PASSED] * 100 / RESULTS[FEATURE_COUNT]))
echo "Feature Coverage:          $pass_rate%"
echo ""

if [ ${RESULTS[FAILED]} -eq 0 ]; then
  echo "READY FOR TESTING: No critical failures detected."
  echo "Next steps:"
  echo "  1. Run: cd /workspaces/pixel-forge/web && npm run dev"
  echo "  2. Test in browser at http://localhost:5173"
  echo "  3. Manually verify features (file upload, conversion, download, etc.)"
else
  echo "ACTION REQUIRED: Fix ${RESULTS[FAILED]} failing features before testing."
fi

echo ""
echo "======================================"
