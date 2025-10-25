// Test betting with two accounts on opposite sides
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const CONTRACT = '0xFbdcDBc17Fd692B4D4b0c73AC50c0c9A7a6e0C71'; // Updated - no notContract modifier
const RPC = 'https://sepolia.base.org';
const CAST = 'C:\\Users\\1234s\\.foundry\\bin\\cast.exe';

// Two test accounts (EOA)
const ACCOUNT1_KEY = '0x11f0f9cfbef1feba67b462469878312629ffefaa8052be57f4f1009d3091955c';
const ACCOUNT2_KEY = '0x3629b3045a9d9ced96a9deedf9b05e5e453cc6c1d57b4cac024ba39e4c583a2c';

let ACCOUNT1_ADDRESS = '';
let ACCOUNT2_ADDRESS = '';
let testEpoch = null;
let hasBetThisRound = false;

console.log('🎲 BobaSoda Betting Test Script');
console.log('Contract:', CONTRACT);
console.log('Testing opposite bets from two accounts\n');

// Get account addresses
async function getAccountAddresses() {
  try {
    const { stdout: addr1 } = await execPromise(`"${CAST}" wallet address --private-key ${ACCOUNT1_KEY}`);
    const { stdout: addr2 } = await execPromise(`"${CAST}" wallet address --private-key ${ACCOUNT2_KEY}`);
    ACCOUNT1_ADDRESS = addr1.trim();
    ACCOUNT2_ADDRESS = addr2.trim();
    console.log('Account 1:', ACCOUNT1_ADDRESS);
    console.log('Account 2:', ACCOUNT2_ADDRESS);
    console.log('');
  } catch (error) {
    console.error('Error getting account addresses:', error.message);
  }
}

// Get current epoch
async function getCurrentEpoch() {
  try {
    const { stdout } = await execPromise(`"${CAST}" call ${CONTRACT} "currentEpoch()(uint256)" --rpc-url ${RPC}`);
    return BigInt(stdout.trim());
  } catch (error) {
    console.error('Error getting current epoch:', error.message);
    return null;
  }
}

// Parse cast output (handles "123 [1.23e2]" format)
function parseCastValue(line) {
  const firstPart = line.trim().split(' ')[0];
  return firstPart;
}

// Get round data
async function getRound(epoch) {
  try {
    const { stdout } = await execPromise(
      `"${CAST}" call ${CONTRACT} "rounds(uint256)(uint256,uint256,uint256,uint256,int256,int256,uint256,uint256,uint256,uint256,uint256,bool)" ${epoch} --rpc-url ${RPC}`
    );

    const lines = stdout.trim().split('\n');
    return {
      epoch: BigInt(parseCastValue(lines[0])),
      startTimestamp: BigInt(parseCastValue(lines[1])),
      lockTimestamp: BigInt(parseCastValue(lines[2])),
      closeTimestamp: BigInt(parseCastValue(lines[3])),
      lockPrice: BigInt(parseCastValue(lines[4])),
      closePrice: BigInt(parseCastValue(lines[5])),
      totalAmount: BigInt(parseCastValue(lines[6])),
      bullAmount: BigInt(parseCastValue(lines[7])),
      bearAmount: BigInt(parseCastValue(lines[8])),
      rewardBaseCalAmount: BigInt(parseCastValue(lines[9])),
      rewardAmount: BigInt(parseCastValue(lines[10])),
      oracleCalled: lines[11].trim() === 'true'
    };
  } catch (error) {
    console.error('Error getting round data:', error.message);
    return null;
  }
}

// Place bull bet
async function betBull(epoch, amount, privateKey, accountName) {
  try {
    console.log(`  📈 ${accountName} betting ${amount} ETH on BULL (UP)...`);
    const { stdout, stderr } = await execPromise(
      `"${CAST}" send ${CONTRACT} "betBull(uint256)" ${epoch} --value ${amount}ether --rpc-url ${RPC} --private-key ${privateKey}`
    );
    console.log(`  ✅ ${accountName} BULL bet placed!`);
    return true;
  } catch (error) {
    console.error(`  ❌ ${accountName} BULL bet failed:`, error.message);
    return false;
  }
}

// Place bear bet
async function betBear(epoch, amount, privateKey, accountName) {
  try {
    console.log(`  📉 ${accountName} betting ${amount} ETH on BEAR (DOWN)...`);
    const { stdout, stderr } = await execPromise(
      `"${CAST}" send ${CONTRACT} "betBear(uint256)" ${epoch} --value ${amount}ether --rpc-url ${RPC} --private-key ${privateKey}`
    );
    console.log(`  ✅ ${accountName} BEAR bet placed!`);
    return true;
  } catch (error) {
    console.error(`  ❌ ${accountName} BEAR bet failed:`, error.message);
    return false;
  }
}

// Check if user can claim
async function canClaim(epoch, userAddress) {
  try {
    const { stdout } = await execPromise(
      `"${CAST}" call ${CONTRACT} "claimable(uint256,address)(bool)" ${epoch} ${userAddress} --rpc-url ${RPC}`
    );
    return stdout.trim() === 'true';
  } catch (error) {
    console.error('Error checking claimable:', error.message);
    return false;
  }
}

// Get user bet info
async function getUserBet(epoch, userAddress) {
  try {
    const { stdout } = await execPromise(
      `"${CAST}" call ${CONTRACT} "ledger(uint256,address)(uint8,uint256,bool)" ${epoch} ${userAddress} --rpc-url ${RPC}`
    );
    const lines = stdout.trim().split('\n');
    return {
      position: parseInt(parseCastValue(lines[0])), // 0 = Bull, 1 = Bear
      amount: BigInt(parseCastValue(lines[1])),
      claimed: lines[2].trim() === 'true'
    };
  } catch (error) {
    return { position: 0, amount: 0n, claimed: false };
  }
}

// Get ETH balance
async function getBalance(address) {
  try {
    const { stdout } = await execPromise(`"${CAST}" balance ${address} --rpc-url ${RPC}`);
    return BigInt(parseCastValue(stdout));
  } catch (error) {
    return 0n;
  }
}

// Claim rewards
async function claim(epochs, privateKey, accountName) {
  try {
    console.log(`  💰 ${accountName} claiming rewards for epoch ${epochs}...`);
    const epochsArray = `[${epochs}]`;
    const { stdout } = await execPromise(
      `"${CAST}" send ${CONTRACT} "claim(uint256[])" "${epochsArray}" --rpc-url ${RPC} --private-key ${privateKey}`
    );
    console.log(`  ✅ ${accountName} claimed rewards!`);
    return true;
  } catch (error) {
    console.error(`  ❌ ${accountName} claim failed:`, error.message);
    return false;
  }
}

// Main monitoring loop
async function monitorAndBet() {
  const now = Math.floor(Date.now() / 1000);
  const epoch = await getCurrentEpoch();

  if (!epoch) {
    return;
  }

  const round = await getRound(epoch);
  if (!round) {
    return;
  }

  const lockTime = Number(round.lockTimestamp);
  const closeTime = Number(round.closeTimestamp);
  const timeUntilLock = lockTime - now;
  const timeUntilClose = closeTime - now;

  let phase = '';
  if (now < lockTime) {
    phase = '🟢 BETTING OPEN';
  } else if (now < closeTime) {
    phase = '🔴 LOCKED';
  } else {
    phase = '⏳ WAITING';
  }

  // Display status
  process.stdout.write(`\r[Epoch ${epoch}] ${phase} | Time: ${timeUntilLock > 0 ? timeUntilLock + 's to lock' : timeUntilClose > 0 ? timeUntilClose + 's to close' : 'Processing...'} | Pool: ${Number(round.bullAmount) / 1e18}Ξ BULL / ${Number(round.bearAmount) / 1e18}Ξ BEAR              `);

  // If new round started, reset bet flag
  if (testEpoch !== null && epoch > testEpoch) {
    console.log('\n\n' + '='.repeat(70));
    console.log(`📊 ROUND ${testEpoch} COMPLETED - Checking Results`);
    console.log('='.repeat(70));

    // Get final round data
    const finalRound = await getRound(testEpoch);
    if (finalRound) {
      console.log(`\n💰 Final Pool:`);
      console.log(`  BULL: ${Number(finalRound.bullAmount) / 1e18} ETH`);
      console.log(`  BEAR: ${Number(finalRound.bearAmount) / 1e18} ETH`);
      console.log(`  Total: ${Number(finalRound.totalAmount) / 1e18} ETH`);
      console.log(`  Reward Pool: ${Number(finalRound.rewardAmount) / 1e18} ETH`);

      console.log(`\n📈 Prices:`);
      console.log(`  Lock Price: $${Number(finalRound.lockPrice) / 1e8}`);
      console.log(`  Close Price: $${Number(finalRound.closePrice) / 1e8}`);

      const winner = finalRound.closePrice > finalRound.lockPrice ? 'BULL (UP)' : 'BEAR (DOWN)';
      console.log(`  Winner: ${winner}`);

      // Check if accounts can claim
      console.log(`\n🎁 Checking Claimable Rewards:`);
      const acc1Claimable = await canClaim(testEpoch, ACCOUNT1_ADDRESS);
      const acc2Claimable = await canClaim(testEpoch, ACCOUNT2_ADDRESS);

      const acc1Bet = await getUserBet(testEpoch, ACCOUNT1_ADDRESS);
      const acc2Bet = await getUserBet(testEpoch, ACCOUNT2_ADDRESS);

      console.log(`  Account 1 (${acc1Bet.position === 0 ? 'BULL' : 'BEAR'}): ${acc1Claimable ? '✅ CAN CLAIM' : '❌ CANNOT CLAIM'}`);
      console.log(`  Account 2 (${acc2Bet.position === 0 ? 'BULL' : 'BEAR'}): ${acc2Claimable ? '✅ CAN CLAIM' : '❌ CANNOT CLAIM'}`);

      // Try to claim for winner
      if (acc1Claimable) {
        const balanceBefore = await getBalance(ACCOUNT1_ADDRESS);
        await claim(testEpoch, ACCOUNT1_KEY, 'Account 1');
        const balanceAfter = await getBalance(ACCOUNT1_ADDRESS);
        const reward = balanceAfter - balanceBefore;
        console.log(`  💵 Account 1 received: ${Number(reward) / 1e18} ETH`);
      }

      if (acc2Claimable) {
        const balanceBefore = await getBalance(ACCOUNT2_ADDRESS);
        await claim(testEpoch, ACCOUNT2_KEY, 'Account 2');
        const balanceAfter = await getBalance(ACCOUNT2_ADDRESS);
        const reward = balanceAfter - balanceBefore;
        console.log(`  💵 Account 2 received: ${Number(reward) / 1e18} ETH`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('Waiting for next round to place new bets...\n');
    hasBetThisRound = false;
    testEpoch = null;
  }

  // Place bets when betting is open and we haven't bet this round yet
  if (now < lockTime && !hasBetThisRound && timeUntilLock > 10) {
    console.log('\n\n' + '='.repeat(70));
    console.log(`🎲 PLACING BETS FOR ROUND ${epoch}`);
    console.log('='.repeat(70));

    // Place opposite bets
    const bet1 = await betBull(epoch, '0.001', ACCOUNT1_KEY, 'Account 1');
    const bet2 = await betBear(epoch, '0.002', ACCOUNT2_KEY, 'Account 2');

    if (bet1 && bet2) {
      hasBetThisRound = true;
      testEpoch = epoch;
      console.log(`\n✅ Both bets placed successfully!`);
      console.log(`Waiting for round ${epoch} to complete...\n`);
    } else {
      console.log(`\n⚠️  Some bets failed, will retry next round\n`);
    }
  }
}

// Start the script
async function start() {
  await getAccountAddresses();

  // Monitor every second
  setInterval(monitorAndBet, 1000);
}

start();
