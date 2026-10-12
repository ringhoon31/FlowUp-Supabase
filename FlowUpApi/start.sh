#!/bin/sh
set -e

# Oracle Wallet 복원
mkdir -p /tmp/flowup-wallet

base64 -d /etc/secrets/wallet.b64 > /tmp/flowup-wallet.zip

unzip -o -q /tmp/flowup-wallet.zip -d /tmp/flowup-wallet

# tnsnames.ora 파일의 실제 위치 찾기
TNS_FILE=$(find /tmp/flowup-wallet -name tnsnames.ora -type f -print -quit)

if [ -z "$TNS_FILE" ]; then
    echo "ERROR: Oracle Wallet tnsnames.ora not found"
    exit 1
fi

# 실제 Wallet 폴더를 Oracle에 전달
export ORACLE_WALLET_PATH="$(dirname "$TNS_FILE")"
export TNS_ADMIN="$ORACLE_WALLET_PATH"

echo "Oracle Wallet directory configured"

# C# API 실행
exec dotnet FlowUpApi.dll