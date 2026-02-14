const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'backend_log.txt');
const logStream = fs.createWriteStream(logFile);

console.log('Starting backend server and logging to:', logFile);

// Directly spawn node server.js
const child = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
    process.stdout.write(data);
    logStream.write(data);
});

child.stderr.on('data', (data) => {
    process.stderr.write(data);
    logStream.write(data);
});

child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    logStream.end();
});
