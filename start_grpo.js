const { spawn } = require('child_process');
const path = require('path');

const pythonPath = 'C:\\Program Files\\Python311\\python.exe';
const scriptPath = path.join(__dirname, 'grpo_server.py');

console.log(`Starting GRPO server: ${pythonPath} ${scriptPath}`);

const proc = spawn(pythonPath, [scriptPath], {
  stdio: 'inherit',
  cwd: __dirname
});

proc.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

proc.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  proc.kill();
});
