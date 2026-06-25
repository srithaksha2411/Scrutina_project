#!/bin/bash

echo "=========================================="
echo "SCRUTINA FIX VERIFICATION SCRIPT"
echo "=========================================="
echo ""

echo "1. Checking if dataEnrichmentService has business name protection..."
if grep -q "CRITICAL: NEVER overwrite existing businessName" backend/services/dataEnrichmentService.js; then
    echo "✅ Business name protection: PRESENT"
else
    echo "❌ Business name protection: MISSING"
fi

echo ""
echo "2. Checking if businessDiscoveryService has name extraction..."
if grep -q "extractBusinessNameFromAddress" backend/services/businessDiscoveryService.js; then
    echo "✅ Name extraction from address: PRESENT"
else
    echo "❌ Name extraction from address: MISSING"
fi

echo ""
echo "3. Checking if mongoDBStorageService has validation..."
if grep -q "Business name is required" backend/services/mongoDBStorageService.js; then
    echo "✅ Storage validation: PRESENT"
else
    echo "❌ Storage validation: MISSING"
fi

echo ""
echo "4. Checking if address cleaning is implemented..."
if grep -q "cleanAddressFromBusinessName" backend/services/dataEnrichmentService.js; then
    echo "✅ Address cleaning: PRESENT"
else
    echo "❌ Address cleaning: MISSING"
fi

echo ""
echo "5. Checking Research model source enum..."
if grep -q "google_maps" backend/models/Research.js; then
    echo "✅ Source enum updated: PRESENT"
else
    echo "❌ Source enum updated: MISSING"
fi

echo ""
echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "If all checks show ✅, the fixes are in place."
echo "You need to:"
echo "1. Restart the backend server (Ctrl+C, then npm run dev)"
echo "2. Navigate to Dashboard page (not Results page)"
echo "3. Enter a NEW search query"
echo "4. Click 'Start Research'"
echo "5. Wait for results"
echo ""
echo "The 'Research Results' page shows OLD data from database."
echo "You need to run a NEW search to see fixed data."
