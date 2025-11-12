# Subscription Contract Deployment Guide

This guide explains how to deploy the Subscription smart contract to Autonomys Auto EVM networks.

## Contract Details

- **File**: `contracts/Subscription.sol`
- **Solidity Version**: ^0.8.30
- **License**: MIT
- **Networks**:
  - Testnet (Chronos): Chain ID 8700
  - Mainnet: Chain ID 870

## Deployment Options

### Option 1: Deploy via Remix IDE (Recommended for Quick Deploy)

1. **Open Remix IDE**
   - Go to https://remix.ethereum.org

2. **Create the Contract**
   - Create a new file: `Subscription.sol`
   - Copy the contents from `contracts/Subscription.sol`

3. **Compile the Contract**
   - Go to "Solidity Compiler" tab
   - Select compiler version: `0.8.20` or higher
   - Click "Compile Subscription.sol"

4. **Connect to Autonomys Network**
   - Go to "Deploy & Run Transactions" tab
   - Select "Environment": "Injected Provider - MetaMask"
   - Make sure MetaMask is connected to the correct network:
     - **Testnet (Chronos)**:
       - Network Name: AutoEVM Testnet (Chronos)
       - RPC URL: `https://rpc-0.chronos.autonomys.xyz`
       - Chain ID: `8700`
       - Currency: tAI3
       - Explorer: `https://explorer.auto-evm.chronos.autonomys.xyz`
     - **Mainnet**:
       - Network Name: AutoEVM Mainnet
       - RPC URL: `https://auto-evm.mainnet.autonomys.xyz`
       - Chain ID: `870`
       - Currency: AI3
       - Explorer: `https://explorer.mainnet.autonomys.xyz`

5. **Deploy**
   - Select contract: `Subscription`
   - Click "Deploy"
   - Confirm transaction in MetaMask
   - Wait for transaction confirmation

6. **Copy Contract Address**
   - After deployment, copy the contract address
   - Add it to your `.env.local`:
     ```
     NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xYourContractAddress
     ```

### Option 2: Deploy via Hardhat

1. **Install Hardhat**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. **Initialize Hardhat**
   ```bash
   npx hardhat init
   ```

3. **Configure Hardhat**

   Create `hardhat.config.js`:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");

   const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

   module.exports = {
     solidity: "0.8.20",
     networks: {
       chronos: {
         url: "https://rpc-0.chronos.autonomys.xyz",
         chainId: 8700,
         accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
       },
       autonomys: {
         url: "https://auto-evm.mainnet.autonomys.xyz",
         chainId: 870,
         accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
       },
     },
   };
   ```

4. **Create Deployment Script**

   Create `scripts/deploy.js`:
   ```javascript
   async function main() {
     console.log("Deploying Subscription contract...");

     const Subscription = await ethers.getContractFactory("Subscription");
     const subscription = await Subscription.deploy();

     await subscription.waitForDeployment();

     const address = await subscription.getAddress();
     console.log("Subscription contract deployed to:", address);
     console.log("\nAdd this to your .env.local:");
     console.log(`NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=${address}`);
   }

   main()
     .then(() => process.exit(0))
     .catch((error) => {
       console.error(error);
       process.exit(1);
     });
   ```

5. **Deploy**
   ```bash
   # Deploy to Chronos Testnet
   npx hardhat run scripts/deploy.js --network chronos

   # Deploy to Autonomys Mainnet
   npx hardhat run scripts/deploy.js --network autonomys
   ```

### Option 3: Deploy via Foundry

1. **Install Foundry**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Initialize Foundry Project**
   ```bash
   forge init
   ```

3. **Deploy**
   ```bash
   # Deploy to Chronos Testnet
   forge create contracts/Subscription.sol:Subscription \
     --rpc-url https://rpc-0.chronos.autonomys.xyz \
     --private-key YOUR_PRIVATE_KEY

   # Deploy to Autonomys Mainnet
   forge create contracts/Subscription.sol:Subscription \
     --rpc-url https://auto-evm.mainnet.autonomys.xyz \
     --private-key YOUR_PRIVATE_KEY
   ```

## After Deployment

1. **Update Environment Variables**

   Add the contract address to `.env.local`:
   ```
   NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xYourDeployedContractAddress
   ```

2. **Verify Contract (Optional but Recommended)**

   On the block explorer:
   - Go to your contract address
   - Click "Verify and Publish"
   - Select compiler version: `0.8.20`
   - Paste the contract code
   - Submit verification

3. **Test the Contract**

   - Restart your development server: `npm run dev`
   - Go to `/pricing` page
   - Connect your wallet
   - Check the debug panel (bottom right)
   - Contract address should now be displayed

## Contract Functions

### User Functions

- `subscribe(Plan plan, uint256 duration)` - Subscribe to a plan (payable)
- `extendSubscription(uint256 duration)` - Extend current subscription (payable)
- `cancelSubscription()` - Cancel subscription
- `getSubscription(address user)` - Get subscription details
- `isSubscriptionActive(address user)` - Check if subscription is active

### Owner Functions

- `transferOwnership(address newOwner)` - Transfer contract ownership

## Payment Flow

1. User calls `subscribe()` with:
   - `plan`: 1 (BASIC), 2 (PRO), or 3 (UNLIMITED)
   - `duration`: Time in seconds (30 days = 2592000)
   - `value`: Payment amount in AI3/tAI3 tokens

2. Contract:
   - Updates user subscription
   - Transfers payment to owner address
   - Emits `Subscribed` event

3. Frontend:
   - Listens for transaction confirmation
   - Updates UI with new subscription status

## Security Considerations

- Owner address receives all payments immediately
- No refunds mechanism (by design)
- Subscriptions automatically expire based on timestamp
- Users can cancel but won't get refunds

## Troubleshooting

### Transaction Failed

- Check you have enough AI3/tAI3 for payment + gas
- Ensure correct network (Chain ID 8700 for testnet, 870 for mainnet)
- Verify contract address is correct

### Contract Not Found

- Ensure `NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM` is set in `.env.local`
- Restart your Next.js server after updating `.env.local`

### Wrong Network

- Switch MetaMask to correct network
- Check Chain ID matches (8700 or 870)

## Support

For issues or questions:
- Check console logs for detailed errors
- Use the debug panel on `/pricing` page
- Verify all environment variables are set correctly
