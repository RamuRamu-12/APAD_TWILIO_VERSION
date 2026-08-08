# Ethereum Blockchain Integration Requirements

## Purpose

This document lists only the requirements needed to connect APAD's provenance system with Ethereum blockchain infrastructure. It covers required credentials, free resources, paid resources, and how to obtain them.

## Required Resources

### 1. Ethereum Layer 2 Network

APAD should use an Ethereum Layer 2 network instead of Ethereum mainnet for lower cost and faster transactions.

Recommended development network:

- Base Sepolia testnet

Other development options:

- Arbitrum Sepolia
- Optimism Sepolia
- Polygon Amoy

Recommended production options:

- Base mainnet
- Arbitrum One
- Optimism mainnet
- Polygon PoS

### 2. RPC Provider URL

An RPC URL is required to connect to the blockchain network.

The RPC provider allows APAD to:

- read blockchain data
- send blockchain transactions
- confirm transaction status
- interact with deployed smart contracts

Example:

```env
ETHEREUM_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

Free options:

- Public RPC endpoints
- Alchemy free tier
- Infura free tier
- QuickNode free tier
- Coinbase Developer Platform free tier

Paid options:

- Alchemy paid plan
- Infura paid plan
- QuickNode paid plan
- Coinbase Developer Platform paid plan
- Self-hosted blockchain node

Recommendation:

- Use a free RPC provider for development.
- Use a paid reliable RPC provider for production.

### 3. Relayer Wallet

A dedicated Ethereum wallet is required to sign blockchain transactions.

This wallet is called the relayer wallet.

Required item:

```env
ETHEREUM_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

Rules:

- Create a new wallet only for APAD.
- Do not use a personal wallet.
- Do not share the private key.
- Do not commit the private key to GitHub.
- Store the private key in `.env` for local development.
- Use a secret manager for production.

Free wallet options:

- MetaMask
- Rabby Wallet
- Coinbase Wallet

Recommendation:

- Use MetaMask for development.
- Use a dedicated production wallet with secure secret storage for production.

### 4. Gas Funds

The relayer wallet needs gas funds to send blockchain transactions.

For development:

- Use free testnet ETH.
- Testnet ETH has no real-money value.

For production:

- Use real ETH on the selected Layer 2 network.
- Production gas is paid.

Estimated production cost:

```text
Low-frequency anchoring: usually low monthly cost on L2
Hourly anchoring: approximately 720 transactions per month
Expected L2 gas range: roughly $5-$50/month depending on network congestion
```

### 5. Testnet ETH Faucet

A faucet gives free testnet ETH for development.

Required for:

- deploying contracts on testnet
- sending test blockchain transactions
- testing anchoring flow

Free faucet options:

- Base Sepolia faucet
- Alchemy faucet
- QuickNode faucet
- Coinbase faucet
- Google Cloud Web3 faucet, if available

How to get testnet ETH:

1. Create a test wallet in MetaMask.
2. Copy the wallet address.
3. Open a Base Sepolia faucet.
4. Paste the wallet address.
5. Request test ETH.
6. Confirm the balance in MetaMask.

### 6. Smart Contract Address

A deployed smart contract address is required.

The contract stores blockchain proof records such as Merkle roots.

Example:

```env
ETHEREUM_ANCHOR_CONTRACT=0xYOUR_DEPLOYED_CONTRACT
```

Free requirements:

- Solidity
- Hardhat or Foundry
- OpenZeppelin utilities
- Testnet deployment

Paid requirements:

- Production deployment gas
- Optional contract audit

Recommendation:

- Deploy first on Base Sepolia testnet.
- Deploy to Base mainnet or another L2 only after testing.

### 7. Chain ID

The chain ID identifies the blockchain network.

Examples:

```env
ETHEREUM_CHAIN_ID=84532
```

Common chain IDs:

| Network | Chain ID |
|---|---:|
| Base Sepolia | 84532 |
| Base Mainnet | 8453 |
| Arbitrum Sepolia | 421614 |
| Arbitrum One | 42161 |
| Optimism Sepolia | 11155420 |
| Optimism Mainnet | 10 |
| Polygon Amoy | 80002 |
| Polygon Mainnet | 137 |

### 8. Block Explorer URL

A block explorer URL is required to view blockchain transaction details.

Example:

```env
ETHEREUM_EXPLORER_URL=https://sepolia.basescan.org/tx/
```

Free explorer options:

- BaseScan
- Arbiscan
- Optimistic Etherscan
- PolygonScan

Explorer examples:

| Network | Explorer |
|---|---|
| Base Sepolia | `https://sepolia.basescan.org/tx/` |
| Base Mainnet | `https://basescan.org/tx/` |
| Arbitrum Sepolia | `https://sepolia.arbiscan.io/tx/` |
| Arbitrum One | `https://arbiscan.io/tx/` |
| Optimism Sepolia | `https://sepolia-optimism.etherscan.io/tx/` |
| Optimism Mainnet | `https://optimistic.etherscan.io/tx/` |
| Polygon Amoy | `https://amoy.polygonscan.com/tx/` |
| Polygon Mainnet | `https://polygonscan.com/tx/` |

## Environment Variables Required

For development on Base Sepolia:

```env
ETHEREUM_ENABLED=true
ETHEREUM_NETWORK=base-sepolia
ETHEREUM_CHAIN_ID=84532
ETHEREUM_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHEREUM_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETHEREUM_ANCHOR_CONTRACT=0xYOUR_DEPLOYED_CONTRACT
ETHEREUM_EXPLORER_URL=https://sepolia.basescan.org/tx/
```

## Free Resources Summary

The following can be used for free during development:

| Requirement | Free Option |
|---|---|
| Blockchain network | Base Sepolia testnet |
| Wallet | MetaMask |
| RPC | Public RPC or Alchemy free tier |
| Gas | Testnet ETH faucet |
| Contract language | Solidity |
| Contract tooling | Hardhat or Foundry |
| Contract utilities | OpenZeppelin |
| Explorer | BaseScan Sepolia |
| Backend blockchain library | `web3.py` or `ethers.js` |

## Paid Resources Summary

The following may require payment for production:

| Requirement | Paid Need |
|---|---|
| Production gas | Real ETH on selected L2 |
| Reliable RPC | Paid Alchemy, Infura, QuickNode, or Coinbase plan |
| Secret management | AWS Secrets Manager, Azure Key Vault, Google Secret Manager, or HashiCorp Vault |
| Contract deployment | One-time L2 deployment gas |
| Contract audit | Optional paid security audit |
| Monitoring | Optional production monitoring tools |

## How To Obtain Each Requirement

### Create A Wallet

1. Install MetaMask.
2. Create a new wallet.
3. Name it as an APAD relayer wallet.
4. Add Base Sepolia network.
5. Export the private key only for backend configuration.
6. Store it securely.

### Get RPC URL

Recommended free option: Alchemy.

1. Create an Alchemy account.
2. Create a new app.
3. Select Base Sepolia.
4. Copy HTTPS RPC URL.
5. Add it to environment variables.

### Get Testnet ETH

1. Copy the relayer wallet address.
2. Open a Base Sepolia faucet.
3. Paste the wallet address.
4. Request test ETH.
5. Confirm balance in MetaMask.

### Get Smart Contract Address

1. Deploy the anchor contract to Base Sepolia.
2. Copy the deployed contract address.
3. Add it to environment variables.
4. Verify the contract on BaseScan if required.

### Get Explorer URL

Use the explorer URL for the selected network.

For Base Sepolia:

```text
https://sepolia.basescan.org/tx/
```

For Base mainnet:

```text
https://basescan.org/tx/
```

## Development Recommendation

Use this setup for initial development:

```text
Network: Base Sepolia
RPC: Alchemy free tier
Wallet: New MetaMask wallet
Gas: Free Base Sepolia test ETH
Contract tooling: Hardhat
Explorer: BaseScan Sepolia
```

## Production Recommendation

Use this setup for production:

```text
Network: Base mainnet or Arbitrum One
RPC: Paid Alchemy, Infura, QuickNode, or Coinbase Developer Platform
Wallet: Dedicated production relayer wallet
Gas: Real ETH on selected L2
Secrets: Cloud secret manager
Explorer: BaseScan or Arbiscan
```

## Privacy Requirements

Never put the following on-chain:

- ad video files
- image files
- user phone numbers
- user emails
- patient data
- PHI
- private campaign metadata
- raw ad content

Only put the following on-chain:

- Merkle root
- batch ID or hashed batch ID
- transaction hash
- blockchain timestamp

## Final Recommendation

For APAD, the recommended requirement stack is:

```text
Base Sepolia for development
Alchemy free tier for RPC
MetaMask for relayer wallet
Free faucet ETH for testing
Hardhat for contract deployment
BaseScan for transaction verification
Base mainnet or Arbitrum One for production
Paid RPC and real L2 ETH for production
```
