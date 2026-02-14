const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Execute Java code
 * @param {string} code - The Java source code
 * @param {string} input - Input string for stdin
 * @returns {Promise<{output: string, error: string, executionTime: number}>}
 */
const executeJava = (code, input = '') => {
    return new Promise((resolve) => {
        const jobId = uuidv4();
        // Extract class name (naive regex, assumes public class matches filename)
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Main';

        // If class is not Main and we are renaming, we might have issues if code assumes filename.
        // For simplicity, we will force the class to be 'Main' if not found, or trust the user code matches.
        // Better approach: wrap in a temp folder.

        const jobDir = path.join(TEMP_DIR, jobId);
        fs.mkdirSync(jobDir);

        const filePath = path.join(jobDir, `${className}.java`);

        // Write code to file
        fs.writeFileSync(filePath, code);

        // Compile
        exec(`javac "${filePath}"`, { cwd: jobDir }, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
                // Cleanup
                try {
                    fs.rmSync(jobDir, { recursive: true, force: true });
                } catch (e) {
                    console.error("Cleanup error after compilation failure", e);
                }
                return resolve({
                    output: '',
                    error: `Compilation Error:\n${compileStderr || compileError.message}`,
                    executionTime: 0
                });
            }

            // Execute
            const executionStart = Date.now();
            const runProcess = spawn('java', ['-cp', '.', className], { cwd: jobDir });

            let outputBuffer = '';
            let errorBuffer = '';

            // Handle stdin
            if (input) {
                runProcess.stdin.write(input);
                runProcess.stdin.end();
            }

            runProcess.stdout.on('data', (data) => {
                outputBuffer += data.toString();
            });

            runProcess.stderr.on('data', (data) => {
                errorBuffer += data.toString();
            });

            runProcess.on('close', (code) => {
                const executionTime = Date.now() - executionStart;

                // Cleanup
                try {
                    fs.rmSync(jobDir, { recursive: true, force: true });
                } catch (e) {
                    console.error("Cleanup error", e);
                }

                if (code !== 0) {
                    return resolve({
                        output: outputBuffer,
                        error: `Runtime Error (Exit Code ${code}):\n${errorBuffer}`,
                        executionTime
                    });
                }

                resolve({
                    output: outputBuffer,
                    error: errorBuffer,
                    executionTime
                });
            });

            // Timeout safety (3 seconds)
            setTimeout(() => {
                runProcess.kill();
                resolve({
                    output: outputBuffer,
                    error: 'Time Limit Exceeded (3s)',
                    executionTime: Date.now() - executionStart
                });
            }, 3000);
        });
    });
};

module.exports = { executeJava };
