// Continuous execution - execute immediately after each success
const { exec } = require('child_process');

const CONTRACT = '0xFbdcDBc17Fd692B4D4b0c73AC50c0c9A7a6e0C71'; // Pyth contract (no notContract modifier)
const RPC = 'https://sepolia.base.org';
const KEY = '0x2812270ffa3e05a6f9a0e136b34f94fad94125652fc06053f09ad83dad293315';

// Path to cast.exe (from foundry installation)
const CAST = 'C:\\Users\\1234s\\.foundry\\bin\\cast.exe';

console.log('🤖 BobaSoda - Continuous round execution');
console.log('Contract:', CONTRACT);
console.log('Will execute immediately after each success\n');

let successCount = 0;
let failCount = 0;
let isExecuting = false;

function executeRound() {
    if (isExecuting) return; // Prevent overlapping executions
    isExecuting = true;

    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] Executing round...`);

    const cmd = `"${CAST}" send ${CONTRACT} "executeRound()" --rpc-url ${RPC} --private-key ${KEY}`;

    exec(cmd, (error, stdout, stderr) => {
        isExecuting = false;

        if (error) {
            failCount++;
            console.log(`⚠️  Failed (${successCount} success / ${failCount} failed)`);
            // Retry after 5 seconds on failure
            setTimeout(executeRound, 5000);
        } else {
            successCount++;
            console.log(`✅ Success! (${successCount} success / ${failCount} failed)`);
            // Execute immediately after success (the next round should be ready in ~20s)
            setTimeout(executeRound, 20000);
        }
    });
}

// Start executing
executeRound();
