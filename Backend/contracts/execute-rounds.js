// Auto-execute rounds every 20 seconds
const { exec } = require('child_process');

const CONTRACT = '0xe13b125064104289208396aCB9B201eF3aa22903'; // Pyth contract
const RPC = 'https://sepolia.base.org';
const KEY = '0x2812270ffa3e05a6f9a0e136b34f94fad94125652fc06053f09ad83dad293315';

// Path to cast.exe (from foundry installation)
const CAST = 'C:\\Users\\1234s\\.foundry\\bin\\cast.exe';

console.log('🤖 BobaSoda - Auto-executing rounds every 20 seconds');
console.log('Contract:', CONTRACT);
console.log('Press Ctrl+C to stop\n');

let successCount = 0;
let failCount = 0;

function executeRound() {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] Executing round...`);

    const cmd = `"${CAST}" send ${CONTRACT} "executeRound()" --rpc-url ${RPC} --private-key ${KEY}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            failCount++;
            console.log(`⚠️  Failed (${successCount} success / ${failCount} failed)\n`);
        } else {
            successCount++;
            console.log(`✅ Success! (${successCount} success / ${failCount} failed)\n`);
        }
    });
}

// Execute immediately
executeRound();

// Then execute every 5 seconds to catch the buffer window
// (Buffer is tight at 15s, so we need to check frequently)
setInterval(executeRound, 5000);
