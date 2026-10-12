#!/bin/sh
set -e

# Render에 저장한 Wallet 복원
mkdir -p /tmp/flowup-wallet

base64 -d /etc/secrets/wallet.b64 > /tmp/flowup-wallet.zip

unzip -o -q /tmp/flowup-wallet.zip -d /tmp/flowup-wallet

# Oracle Wallet 경로 지정
export ORACLE_WALLET_PATH=/tmp/flowup-wallet

# C# API 실행
exec dotnet FlowUpApi.dll