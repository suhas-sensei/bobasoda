/**
 * Auto-execute rounds every 30 seconds for ETH Prediction Game
 *
 * This script manages the round lifecycle:
 * - Rounds last 30 seconds
 * - Price is locked at 25 seconds (Pyth price capture)
 * - Round resolves at 30 seconds
 */

const { exec } = require('child_process');

const CONTRACT = '0x2193622E5797C9D4C6cD8b486814453F4b2530B4';
const RPC = 'https://sepolia.base.org';
const KEY = '0x2812270ffa3e05a6f9a0e136b34f94fad94125652fc06053f09ad83dad293315';

// Detect OS and set cast path
const os = require('os');
const CAST = os.platform() === 'win32'
  ? 'C:\\Users\\suhas\\.foundry\\bin\\cast.exe'
  : 'cast';

const ROUND_INTERVAL = 30000; // 30 seconds
let roundStartTime = Date.now();

console.log('🤖 Auto-executing ETH Prediction rounds every 30 seconds!');
console.log('📊 Contract:', CONTRACT);
console.log('🔗 Network: Base Sepolia');
console.log('⏰ Interval: 30 seconds per round');
console.log('🔒 Price locks at 25 seconds');
console.log('✅ Resolution at 30 seconds');
console.log('Press Ctrl+C to stop\n');

function executeRound() {
    const time = new Date().toLocaleTimeString();
    const elapsed = Math.floor((Date.now() - roundStartTime) / 1000);

    console.log(`[${time}] Executing round (${elapsed}s elapsed)...`);

    const cmd = os.platform() === 'win32'
        ? `"${CAST}" send ${CONTRACT} "executeRound()" --rpc-url ${RPC} --private-key ${KEY}`
        : `${CAST} send ${CONTRACT} "executeRound()" --rpc-url ${RPC} --private-key ${KEY}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log('⏭️  Waiting for next interval...');
            console.log('   Error:', error.message.split('\n')[0]);
        } else {
            console.log('✅ Round executed successfully!');
            roundStartTime = Date.now(); // Reset round timer
        }
        console.log('');
    });
}

// Execute immediately on startup
console.log('🚀 Starting round execution...\n');
executeRound();

// Then execute every 30 seconds
setInterval(executeRound, ROUND_INTERVAL);

// Log status every 5 seconds
setInterval(() => {
    const elapsed = Math.floor((Date.now() - roundStartTime) / 1000);
    if (elapsed < 30) {
        const status = elapsed < 25
            ? `🟢 Betting active (${elapsed}/25s until lock)`
            : `🔒 Price locked (${elapsed}/30s until resolution)`;
        console.log(`[${new Date().toLocaleTimeString()}] ${status}`);
    }
}, 5000);
