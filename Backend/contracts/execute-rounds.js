// Auto-execute rounds every 60 seconds
const { exec } = require('child_process');

const CONTRACT = '0x2193622E5797C9D4C6cD8b486814453F4b2530B4';
const RPC = 'https://sepolia.base.org';
const KEY = '0x2812270ffa3e05a6f9a0e136b34f94fad94125652fc06053f09ad83dad293315';

// Path to cast.exe (from foundry installation)
const CAST = 'C:\\Users\\suhas\\.foundry\\bin\\cast.exe';

console.log('🤖 Auto-executing rounds every 60 seconds with Pyth!');
console.log('Press Ctrl+C to stop\n');

function executeRound() {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] Executing round...`);

    const cmd = `"${CAST}" send ${CONTRACT} "executeRound()" --rpc-url ${RPC} --private-key ${KEY}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log('⏭️  Waiting for next interval...\n');
        } else {
            console.log('✅ Success!\n');
        }
    });
}

// Execute immediately
executeRound();

// Then execute every 60 seconds
setInterval(executeRound, 60000);
