# Contract Integration Guide

## Overview
This guide explains how the PancakePrediction smart contracts have been integrated with the frontend.

## What Was Integrated

### 1. Smart Contract Setup
- **Contract**: PancakePredictionV2.sol
- **Network**: Base Sepolia Testnet
- **Oracle**: Chainlink ETH/USD Price Feed (`0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1`)
- **Round Duration**:
  - Betting Phase: 20 seconds
  - Total Round: 60 seconds (1 minute)
  - Buffer: 15 seconds

### 2. Frontend Integration
- **Web3 Library**: ethers.js v6
- **Features Implemented**:
  - Wallet connection (MetaMask)
  - Real-time round data fetching
  - Live ETH/USD price from Chainlink oracle
  - Bet placement (Bull/Bear)
  - Automatic network switching to Base Sepolia
  - User bet tracking
  - Pool size and multiplier calculations

### 3. Configuration Files Created
- `Frontend/lib/contracts/config.ts` - Contract addresses and network config
- `Frontend/lib/contracts/PancakePredictionV2.json` - Contract ABI
- `Frontend/lib/web3/provider.tsx` - Web3 context provider
- `Frontend/lib/web3/hooks.ts` - Custom hooks for contract interaction
- `Frontend/types/ethereum.d.ts` - TypeScript definitions for window.ethereum

### 4. UI Changes
- **Single Card Mode**: Now shows only 1 card (current round) instead of multiple cards
- **Timer**: Updated to 20 seconds for betting phase
- **Asset**: Fixed to ETH/USD (as defined in the contract)
- **Bet Tracking**: Shows user's position (UP/DOWN) after betting
- **Real-time Updates**: Price and round data refresh every 5-10 seconds

## Deployment Steps

### Step 1: Deploy the Smart Contract

1. Navigate to the backend contracts directory:
   ```bash
   cd Backend/contracts/v2
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Update the `.env.local` file with your deployment wallet:
   ```
   PRIVATE_KEY=your_private_key_here
   ```

4. Update `config.ts` with your admin and operator addresses:
   ```typescript
   Admin: {
     testnet: "YOUR_ADMIN_ADDRESS",
   },
   Operator: {
     testnet: "YOUR_OPERATOR_ADDRESS",
   },
   ```

5. Deploy the contract using Hardhat:
   ```bash
   npx hardhat run scripts/deploy.ts --network testnet
   ```

6. **IMPORTANT**: Save the deployed contract address from the output.

### Step 2: Update Frontend Configuration

1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```

2. Update the contract address in `lib/contracts/config.ts`:
   ```typescript
   export const CONTRACT_ADDRESSES = {
     baseSepolia: 'YOUR_DEPLOYED_CONTRACT_ADDRESS', // Replace this
   } as const;
   ```

### Step 3: Initialize the Contract

The contract needs to be initialized before users can bet:

1. Call `genesisStartRound()` (operator only):
   ```bash
   npx hardhat run scripts/genesisStart.ts --network testnet
   ```

2. Wait for the first round to reach lock time (20 seconds)

3. Call `genesisLockRound()` (operator only):
   ```bash
   npx hardhat run scripts/genesisLock.ts --network testnet
   ```

4. After this, the operator needs to call `executeRound()` every 20 seconds to progress the rounds

### Step 4: Set Up Automated Round Execution

For production, you'll need to automate the `executeRound()` calls. Options:

1. **Chainlink Automation** (Recommended):
   - Set up a Chainlink Keeper to call `executeRound()` every 20 seconds

2. **Custom Bot**:
   - Create a Node.js script that calls `executeRound()` on a timer
   - Example:
     ```javascript
     const { ethers } = require('ethers');
     const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
     const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
     const contract = new ethers.Contract(contractAddress, abi, wallet);

     setInterval(async () => {
       try {
         const tx = await contract.executeRound();
         await tx.wait();
         console.log('Round executed:', tx.hash);
       } catch (error) {
         console.error('Error executing round:', error);
       }
     }, 20000); // Every 20 seconds
     ```

### Step 5: Run the Frontend

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

4. Connect your MetaMask wallet

5. The app will automatically:
   - Switch to Base Sepolia network
   - Fetch the current round data
   - Display the live ETH/USD price
   - Allow you to place bets by swiping

## How It Works

### Round Flow
```
1. Start Round (Epoch N)
   ↓ (20 seconds - betting open)
2. Lock Round (Epoch N, record lock price)
   Start Round (Epoch N+1)
   ↓ (20 seconds - betting closed for N, open for N+1)
3. End Round (Epoch N, record close price, calculate rewards)
   Lock Round (Epoch N+1)
   Start Round (Epoch N+2)
   ↓ (20 seconds)
4. Repeat...
```

### Betting
- **Minimum Bet**: 0.001 ETH
- **Bull (UP)**: Price will be higher at close than at lock
- **Bear (DOWN)**: Price will be lower at close than at lock
- Users can only bet once per round during the betting phase

### Rewards
- Rewards are calculated based on the pool sizes
- Winners share the losing pool (minus treasury fee)
- Formula: `userReward = (userBetAmount × totalRewardPool) / winningPool`
- Treasury fee: 10% (testnet), 3% (mainnet)

## Testing

1. **Connect Wallet**: Ensure MetaMask is connected to Base Sepolia
2. **Get Test ETH**: Use Base Sepolia faucet (https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
3. **Place a Bet**: Swipe right (UP) or left (DOWN)
4. **Wait for Round to End**: Watch the timer count down
5. **Claim Rewards**: If you win, your rewards will be automatically calculated

## Important Notes

1. **Contract Must Be Active**: The operator must regularly call `executeRound()` for the system to work
2. **Oracle Updates**: The Chainlink oracle must be updating regularly (check heartbeat)
3. **Network**: Always use Base Sepolia for testing
4. **Gas Fees**: Users need ETH for gas fees when placing bets
5. **One Bet Per Round**: Users can only bet once per round
6. **No Refunds**: Bets cannot be cancelled once placed (unless round is invalid)

## Troubleshooting

### "Contract not found" error
- Make sure the contract is deployed
- Check the contract address in `config.ts`

### "Wrong network" error
- Switch to Base Sepolia in MetaMask
- ChainID: 84532

### "Round not bettable" error
- Check if you're in the betting phase (first 20 seconds of round)
- Check if you've already bet in this round
- Ensure the contract is active and rounds are executing

### Price not updating
- Check that the Chainlink oracle is active
- Verify the oracle address in the contract
- Check your internet connection

## Contract Functions Used

- `currentEpoch()`: Get current round number
- `rounds(epoch)`: Get round data
- `betBull(epoch)`: Place UP bet
- `betBear(epoch)`: Place DOWN bet
- `claim(epochs[])`: Claim rewards for winning rounds
- `ledger(epoch, user)`: Get user's bet info
- `claimable(epoch, user)`: Check if user can claim
- `oracle.latestRoundData()`: Get current ETH/USD price

## Next Steps

1. Deploy the contract to Base Sepolia
2. Set up automated round execution
3. Test thoroughly with small amounts
4. Consider adding:
   - Claim rewards functionality
   - Betting history
   - Round history/results
   - Leaderboard
   - Multiple prediction markets (not just ETH/USD)

## References

- [Chainlink Price Feeds](https://docs.chain.link/data-feeds/price-feeds)
- [Base Network Docs](https://docs.base.org/)
- [PancakeSwap Prediction Contracts](https://github.com/pancakeswap/pancake-prediction)
- [ethers.js Documentation](https://docs.ethers.org/v6/)
