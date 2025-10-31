# **Bobasoda — The Fastest Prediction Market Game on Base**
---

## **Milestones**

| Status | Milestone |
|:------:|:-----------|
| ✅| Base network configured successfully |
| ✅| Live links and frontend routes fully operational |
| ✅| ETH Pool logic implemented and tested |
| ✅| 1-Minute fast-paced betting flow verified in testnet |
| ⚠️ | Enhanced chart view *(WIP)* |
| ⚠️| Further feature enhancements and analytics *(WIP)* |

---

## **What is Bobasoda?**
Bobasoda is a one-minute prediction market game built on **[Base](https://base.org)**, where players bet on whether the price of an asset will go up or down in the next 60 seconds.  
It’s quick, fun, and entirely on-chain — a blend of trading instincts and game-like excitement.

---

## **How It Works**

### **1. Join a Round**
Every 60 seconds, a new round begins. Players predict whether the price will go **Up** or **Down** at the end of the minute.

### **2. Wait for the Clock to Run Out**
Once the round locks, all entries are sealed. The result is fetched from a trusted **price oracle**.

### **3. Claim Your Winnings**
If your prediction is correct, you instantly win a share of the prize pool.  
If not — your stake goes toward rewarding the winners of that round.

---

## **What Makes Bobasoda Different**

⚡ **1-Minute Rounds** — No waiting around. You get instant results and non-stop action.  
🧩 **Base Subwallets Integration** — Onboarding is seamless. New users can play without dealing with complex wallet setups.  
💰 **Instant Payouts** — Smart contracts handle rewards transparently and automatically.  
🌐 **Built on Base** — Low fees, fast transactions, and a growing ecosystem.  
🎮 **Game + Market Fusion** — It feels like a game but runs on real crypto markets.

---

## **Why People Love It**
Bobasoda is **fast-paced, transparent, and social**.  
It takes the excitement of trading and turns it into a game anyone can play — no charts, no jargon, just your gut feeling and a 60-second timer.

---

## **Built for the On-Chain Generation**

- Fully decentralized and powered by smart contracts  
- Gas-efficient and scalable through **Base**  
- Works seamlessly on both desktop and mobile browsers  
- On-chain leaderboards and streak-based rewards coming soon

---

## **Tech Stack**

- **[Base](https://base.org)** — L2 blockchain for scalability and speed  
- **[Solidity](https://soliditylang.org)** — Smart contract development  
- **[Foundry](https://book.getfoundry.sh)** — For contract testing and deployment  
- **[Chainlink](https://chain.link)** — Trusted price oracles  
- **[Next.js](https://nextjs.org)** + **[Vercel](https://vercel.com)** — Frontend and hosting  
- **[Subwallet SDK](https://docs.base.org/tools/subwallet)** — Wallet onboarding  
- **[Ethers.js](https://docs.ethers.io)** — Blockchain interaction  

---

## **How I Built It**

Building Bobasoda was an exciting journey of combining blockchain technology with game-like user experience. Here's the technical story behind it:

### **1. The Foundation: Smart Contracts**

The core of Bobasoda is built on **PancakePrediction smart contracts** adapted for the Base network. I chose this architecture because:

- **Proven Battle-Tested Logic**: Based on PancakeSwap's prediction market contracts that have processed millions of dollars in bets
- **Round-Based System**: Clean epoch-based rounds that automatically progress every 60 seconds
- **Oracle Integration**: Built-in Chainlink oracle support for trustless price feeds

**Key Contract Modifications**:
```
- Interval: 60 seconds (20s betting + 40s resolution)
- Network: Base Sepolia testnet
- Oracle: Chainlink ETH/USD price feed
- Min Bet: 0.001 ETH for accessibility
```

I used **Foundry** for smart contract development because it's blazing fast and provides excellent testing capabilities. The contracts were deployed using Hardhat for better network compatibility.

### **2. Frontend Architecture: React + Web3**

The frontend needed to be fast, intuitive, and mobile-first. I built it using:

**Core Stack**:
- **Next.js 15**: For server-side rendering and optimal performance
- **TypeScript**: Full type safety across the entire codebase
- **Ethers.js v6**: Modern Web3 library for blockchain interactions
- **Framer Motion**: Smooth animations and gesture handling

**Design Philosophy**:
The UI is inspired by TikTok/Instagram Reels with a swipeable card interface:
- **Swipe Right**: Bet UP (Bull position)
- **Swipe Left**: Bet DOWN (Bear position)
- **Auto-Progress**: Automatically moves to next round after 60 seconds

This makes crypto betting feel like a familiar social media experience.

### **3. Web3 Integration: Connecting Everything**

The trickiest part was seamlessly connecting the frontend to smart contracts. Here's how I solved it:

**Custom Web3 Context Provider** (`lib/web3/provider.tsx`):
- Manages wallet connection state
- Automatically switches to Base Sepolia network
- Provides contract instance to entire app
- Handles connection errors gracefully

**Custom React Hooks** (`lib/web3/hooks.ts`):
- `usePredictionContract()`: Fetches round data and user bets
- `useOraclePrice()`: Gets live ETH/USD prices every 10 seconds
- `useBetPlacement()`: Handles Bull/Bear bet transactions

This abstraction keeps the main app code clean and testable.

### **4. Real-Time Updates: Keeping Players Engaged**

To make the game feel alive, I implemented several real-time features:

- **Live Price Feed**: ETH/USD price updates every 10 seconds from Chainlink oracle
- **Countdown Timer**: Shows exact seconds remaining in current round
- **Pool Statistics**: Live bull/bear pool sizes and potential multipliers
- **Bet Tracking**: Instantly shows your position after betting

All data is fetched directly from the blockchain - no centralized database needed.

### **5. Solving the Round Automation Challenge**

The smart contracts require an operator to call `executeRound()` every 60 seconds. I solved this with:

**Automated Bot** (`Backend/contracts/execute-rounds.js`):
- Monitors blockchain for round progression
- Automatically calls `executeRound()` when needed
- Handles errors and retries failed transactions
- Runs continuously to ensure smooth gameplay

**Alternative**: For production, I recommend Chainlink Automation (formerly Keepers) for decentralized round execution.

### **6. Base Network Integration**

Choosing **Base** was crucial for several reasons:

- **Low Gas Fees**: Makes small 0.001 ETH bets economically viable
- **Fast Confirmations**: Transactions settle in seconds, not minutes
- **Growing Ecosystem**: Access to Coinbase's user base
- **EVM Compatible**: Easy to deploy existing Solidity contracts

Network configuration in `lib/contracts/config.ts`:
```typescript
chainId: 84532 (Base Sepolia)
rpcUrl: https://sepolia.base.org
```

### **7. User Experience Optimizations**

Several small touches make a big difference:

- **Automatic Network Switching**: App detects wrong network and prompts switch
- **Loading States**: Clear feedback during transactions
- **Error Handling**: User-friendly messages for failed bets
- **Mobile Responsive**: Optimized for phone screens (375px - 428px width)
- **Gesture Controls**: Intuitive swipe mechanics using Framer Motion

### **8. Testing & Deployment**

**Smart Contract Testing**:
- Unit tests with Foundry for contract logic
- Integration tests for oracle connections
- Testnet deployment on Base Sepolia

**Frontend Testing**:
- TypeScript for compile-time safety
- Manual testing on multiple devices
- Real testnet transactions to verify flow

**Deployment**:
- Frontend: Vercel (automatic deployments from main branch)
- Contracts: Hardhat deploy script to Base Sepolia
- Bot: Node.js process on cloud server

### **9. Key Technical Challenges Solved**

**Challenge 1: BigInt Handling**  
*Problem*: JavaScript doesn't natively handle Solidity's uint256  
*Solution*: Updated TypeScript config to ES2020, used BigInt throughout

**Challenge 2: Round Timing**  
*Problem*: Keeping frontend timer in sync with blockchain  
*Solution*: Fetch timestamps from contract, calculate client-side difference

**Challenge 3: Transaction Failures**  
*Problem*: Users lose gas on failed bets  
*Solution*: Pre-validate betting conditions before sending transaction

**Challenge 4: Wallet Onboarding**  
*Problem*: Complex wallet setup scares away new users  
*Solution*: Planning Base Subwallet integration for seamless onboarding

### **10. What's Next**

The foundation is solid, now focusing on:
- [ ] Base Subwallet integration (gasless transactions)
- [ ] Claim rewards UI
- [ ] Historical round data and statistics
- [ ] Leaderboard system
- [ ] Multiple prediction markets (BTC, SOL, etc.)
- [ ] Mainnet deployment

### **Tools & Technologies Used**

**Blockchain**:
- Solidity 0.8.x
- Foundry (testing)
- Hardhat (deployment)
- Chainlink (oracles)
- Base L2 network

**Frontend**:
- Next.js 15
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Ethers.js v6

**DevOps**:
- Git/GitHub
- Vercel (hosting)
- Node.js (automation bot)

---
**Base Subwallet x Bobasoda** — Bringing speed, simplicity, and on-chain fun together.
