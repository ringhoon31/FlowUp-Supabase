FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Oracle Wallet 압축 해제 도구 설치
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*

# C# API 복사
COPY --from=build /app/publish .

# Oracle Wallet 복원 스크립트 복사
COPY start.sh /app/start.sh

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000

# Wallet 복원 후 C# API 실행
ENTRYPOINT ["sh", "-c", "echo 'FlowUp Docker entrypoint started'; exec sh /app/start.sh"]