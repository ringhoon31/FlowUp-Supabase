#!/bin/sh
set -e

echo "=== Oracle Wallet Setup ==="

mkdir -p /tmp/flowup-wallet

# Render Secret File 확인
if [ ! -f /etc/secrets/wallet-base64.txt ]; then
    echo "ERROR: wallet-base64.txt not found"
    exit 1
fi

base64 -d /etc/secrets/wallet-base64.txt > /tmp/flowup-wallet.zip
unzip -o -q /tmp/flowup-wallet.zip -d /tmp/flowup-wallet

# tnsnames.ora 검색
TNS_FILE=$(find /tmp/flowup-wallet -type f -name "tnsnames.ora" -print -quit)

if [ -z "$TNS_FILE" ]; then
    echo "ERROR: tnsnames.ora not found"
    echo "Extracted Wallet filenames:"
    find /tmp/flowup-wallet -type f -printf '%f\n'
    exit 1
fi

# Oracle Wallet 경로 설정
export ORACLE_WALLET_PATH="$(dirname "$TNS_FILE")"
export TNS_ADMIN="$ORACLE_WALLET_PATH"

echo "Oracle Wallet directory: $ORACLE_WALLET_PATH"
echo "Oracle Wallet configured successfully"

# Render 포트 확인
echo "Render PORT: ${PORT:-not-set}"

exec dotnet FlowUpApi.dll