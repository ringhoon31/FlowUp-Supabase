#!/bin/sh
set -e

echo "=== Oracle Wallet Setup ==="

mkdir -p /tmp/flowup-wallet

if [ ! -f /etc/secrets/wallet.b64 ]; then
    echo "ERROR: Render Secret File wallet.b64 not found"
    exit 1
fi

base64 -d /etc/secrets/wallet.b64 > /tmp/flowup-wallet.zip

unzip -o -q /tmp/flowup-wallet.zip -d /tmp/flowup-wallet

TNS_FILE=$(find /tmp/flowup-wallet -type f -name "tnsnames.ora" -print -quit)

if [ -z "$TNS_FILE" ]; then
    echo "ERROR: tnsnames.ora not found in extracted Wallet"
    echo "Wallet filenames:"
    find /tmp/flowup-wallet -type f -printf '%f\n'
    exit 1
fi

export ORACLE_WALLET_PATH="$(dirname "$TNS_FILE")"
export TNS_ADMIN="$ORACLE_WALLET_PATH"

echo "Oracle Wallet directory: $ORACLE_WALLET_PATH"
echo "Oracle Wallet configured successfully"

exec dotnet FlowUpApi.dll