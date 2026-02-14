const { Server } = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const sessions = new Map(); // socketId -> process

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Allow all for debugging
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join_team', (teamId) => {
            console.log(`[Socket] Request to join team: ${teamId}`);
            if (teamId) {
                socket.join(`team_${teamId}`);
                console.log(`[Socket] ${socket.id} joined room: team_${teamId}`);
            }
        });

        socket.on('run_code', async ({ code, language }) => {
            const jobId = uuidv4();
            const jobDir = path.join(TEMP_DIR, jobId);
            fs.mkdirSync(jobDir);

            let filename;

            // Prepare files based on language
            if (language === 'java') {
                const classMatch = code.match(/public\s+class\s+(\w+)/);
                const className = classMatch ? classMatch[1] : 'Main';
                filename = `${className}.java`;

                fs.writeFileSync(path.join(jobDir, filename), code);

                // Compile first
                const compileProcess = spawn('javac', [filename], { cwd: jobDir });

                compileProcess.on('close', (code) => {
                    if (code !== 0) {
                        socket.emit('output', { type: 'error', data: 'Compilation Failed' });
                        try { fs.rmSync(jobDir, { recursive: true, force: true }); } catch (e) { }
                        return;
                    }
                    // Run
                    startExecution('java', [className], jobDir);
                });

            } else if (language === 'python') {
                filename = 'Main.py';
                fs.writeFileSync(path.join(jobDir, filename), code);
                startExecution('python', ['-u', filename], jobDir); // -u for unbuffered output
            } else if (language === 'javascript') {
                filename = 'Main.js';
                fs.writeFileSync(path.join(jobDir, filename), code);
                startExecution('node', [filename], jobDir);
            } else if (language === 'cpp') {
                filename = 'Main.cpp';
                fs.writeFileSync(path.join(jobDir, filename), code);
                // Compile
                const compile = spawn('g++', [filename, '-o', 'Main'], { cwd: jobDir });
                compile.on('close', (code) => {
                    if (code !== 0) {
                        socket.emit('output', { type: 'error', data: 'Compilation Failed' });
                        try { fs.rmSync(jobDir, { recursive: true, force: true }); } catch (e) { }
                        return;
                    }
                    startExecution('./Main', [], jobDir); // Linux/Mac. Windows might be Main.exe
                });
            }

            function startExecution(cmd, args, cwd) {
                const process = spawn(cmd, args, { cwd });
                sessions.set(socket.id, { process, jobDir });

                socket.emit('status', 'running');

                process.stdout.on('data', (data) => {
                    socket.emit('output', { type: 'stdout', data: data.toString() });
                });

                process.stderr.on('data', (data) => {
                    socket.emit('output', { type: 'stderr', data: data.toString() });
                });

                process.on('close', (code) => {
                    socket.emit('status', 'stopped');
                    socket.emit('output', { type: 'system', data: `\nProcess exited with code ${code}` });
                    cleanup(socket.id);
                });
            }
        });

        socket.on('input', (data) => {
            const session = sessions.get(socket.id);
            if (session && session.process) {
                try {
                    session.process.stdin.write(data + '\n'); // Append newline usually needed for scanners
                } catch (e) {
                    console.error("Failed to write to stdin", e);
                }
            }
        });

        socket.on('disconnect', () => {
            cleanup(socket.id);
            console.log(`Client disconnected: ${socket.id}`);
        });

        function cleanup(socketId) {
            const session = sessions.get(socketId);
            if (session) {
                if (session.process) session.process.kill();
                try {
                    fs.rmSync(session.jobDir, { recursive: true, force: true });
                } catch (e) { console.error("Cleanup failed", e); }
                sessions.delete(socketId);
            }
        }
    });

    return io;
};

module.exports = initializeSocket;
