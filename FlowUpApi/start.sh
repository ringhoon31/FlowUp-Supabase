#!/bin/sh
set -e

echo "=== Oracle Wallet Setup ==="

SECRET_FILE="/etc/secrets/wallet-base64.txt"
WALLET_ROOT="/tmp/flowup-wallet"

if [ ! -f "$SECRET_FILE" ]; then
    echo "ERROR: wallet-base64.txt not found at $SECRET_FILE"
    exit 1
fi

mkdir -p "$WALLET_ROOT"
base64 -d "$SECRET_FILE" > /tmp/flowup-wallet.zip
unzip -o -q /tmp/flowup-wallet.zip -d "$WALLET_ROOT"

TNS_FILE=$(find "$WALLET_ROOT" -type f -name 'tnsnames.ora' -print -quit)
if [ -z "$TNS_FILE" ]; then
    echo "ERROR: tnsnames.ora not found in extracted Wallet"
    exit 1
fi

export ORACLE_WALLET_PATH="$(dirname "$TNS_FILE")"
export TNS_ADMIN="$ORACLE_WALLET_PATH"

if grep -qi '^[[:space:]]*flowupdb_low[[:space:]]*=' "$TNS_FILE"; then
    echo "Oracle TNS alias flowupdb_low: FOUND"
else
    echo "ERROR: Oracle TNS alias flowupdb_low not found"
    exit 1
fi

SQLNET_FILE="$ORACLE_WALLET_PATH/sqlnet.ora"
if [ -f "$SQLNET_FILE" ]; then
    sed -i "s|?/network/admin|$ORACLE_WALLET_PATH|g" "$SQLNET_FILE"
fi

echo "Oracle Wallet directory: $ORACLE_WALLET_PATH"
echo "Oracle Wallet configured successfully"
echo "Render PORT: ${PORT:-5013}"

exec dotnet FlowUpApi.dll
