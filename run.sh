#!/bin/bash
echo "=================================================="
echo "🚀 Starting Lighthouse School Visit Local Server"
echo "=================================================="

# Check node
if command -v node >/dev/null 2>&1; then
  node build.js
fi

# Serve dist folder using python3 or npx
if command -v python3 >/dev/null 2>&1; then
  echo "Serving on http://localhost:8000 (Python Server)"
  cd dist && python3 -m http.server 8000
elif command -v npx >/dev/null 2>&1; then
  echo "Serving on http://localhost:8000 (npx serve)"
  npx serve dist -p 8000
else
  echo "Please open index.html or dist/index.html directly in your web browser."
fi
