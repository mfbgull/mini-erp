#!/usr/bin/env node
/**
 * Robust TestSprite MCP caller.
 * Keeps stdin open, waits patiently for the response.
 */
const { spawn } = require('child_process');
const API_KEY = 'sk-user-2J_y9Dp0AaegFTzWxwUnJgssq5iycgjWvet7AIkZHZofzNanF4gsBs1PjLS4O1Tx8qfknpcsRiVxDnT06JjV9ymeOqEGX3E1lToN9gfEdFf7aj96r2jVO_UscZBBLf3kDBM';
const PROJECT_PATH = '/home/fawad/ai/minierp';

function callTool(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    console.error(`[run.js] Starting MCP server to call "${toolName}"...`);
    
    const child = spawn('npx', ['@testsprite/testsprite-mcp@latest'], {
      env: { ...process.env, API_KEY },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let outputBuffer = '';
    let resolved = false;

    // 10 minute timeout
    const timeout = setTimeout(() => {
      if (!resolved) {
        child.kill();
        reject(new Error('TIMEOUT after 600s. Collected output:\n' + outputBuffer.slice(-2000)));
      }
    }, 600000);

    child.stdout.on('data', (data) => {
      outputBuffer += data.toString();
      // Try to find a complete JSON-RPC response
      const lines = outputBuffer.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === 1) {
            resolved = true;
            clearTimeout(timeout);
            // Don't kill immediately - let it flush
            setTimeout(() => { child.kill(); }, 100);
            resolve({ parsed, fullOutput: outputBuffer });
            return;
          }
        } catch(e) {
          // Partial JSON - keep collecting
        }
      }
    });

    child.stderr.on('data', (data) => {
      // stderr may contain progress info
      const msg = data.toString();
      if (msg.includes('Error') || msg.includes('error')) {
        console.error('[stderr]', msg.trim());
      }
    });

    child.on('close', (code) => {
      if (!resolved) {
        clearTimeout(timeout);
        reject(new Error(`Process exited (code ${code}). Output:\n${outputBuffer.slice(-2000)}`));
      }
    });

    // Send the request via tools/call
    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    }) + '\n';

    console.error(`[run.js] Sending request...`);
    child.stdin.write(request);
    
    // Keep stdin open so the server doesn't exit prematurely
    // Write whitespace periodically to keep the pipe alive
    const keepalive = setInterval(() => {
      if (!resolved && child.stdin.writable) {
        child.stdin.write(' ');
      }
    }, 5000);

    // Clear keepalive on resolve
    const origResolve = resolve;
    // We'll clear the interval in the stdout handler
    
    // Also clear on child exit
    child.on('close', () => clearInterval(keepalive));
  });
}

async function main() {
  const step = process.argv[2];
  if (!step) {
    console.log('Usage: node run.js [bootstrap-fe|bootstrap-be|code-summary|prd|fe-testplan|be-testplan|execute|dashboard]');
    process.exit(1);
  }

  try {
    let result;
    
    switch(step) {
      case 'bootstrap-fe':
        result = await callTool('testsprite_bootstrap', {
          localPort: 3010,
          type: 'frontend',
          projectPath: PROJECT_PATH,
          testScope: 'codebase'
        });
        break;
      case 'bootstrap-be':
        result = await callTool('testsprite_bootstrap', {
          localPort: 3011,
          type: 'backend',
          projectPath: PROJECT_PATH,
          testScope: 'codebase'
        });
        break;
      case 'code-summary':
        result = await callTool('testsprite_generate_code_summary', {
          projectRootPath: PROJECT_PATH
        });
        break;
      case 'prd':
        result = await callTool('testsprite_generate_standardized_prd', {
          projectPath: PROJECT_PATH
        });
        break;
      case 'fe-testplan':
        result = await callTool('testsprite_generate_frontend_test_plan', {
          projectPath: PROJECT_PATH,
          needLogin: true
        });
        break;
      case 'be-testplan':
        result = await callTool('testsprite_generate_backend_test_plan', {
          projectPath: PROJECT_PATH
        });
        break;
      case 'execute':
        const testIds = process.argv[3] ? process.argv[3].split(',') : [];
        const serverMode = process.argv[4] || 'development';
        const additionalInstruction = process.argv.slice(5).join(' ') || '';
        result = await callTool('testsprite_generate_code_and_execute', {
          projectName: 'minierp',
          projectPath: PROJECT_PATH,
          testIds: testIds,
          additionalInstruction: additionalInstruction,
          serverMode: serverMode
        });
        break;
      case 'dashboard':
        result = await callTool('testsprite_open_test_result_dashboard', {
          projectPath: PROJECT_PATH,
          modificationContext: process.argv[3] || ''
        });
        break;
      default:
        console.error(`Unknown step: ${step}`);
        process.exit(1);
    }

    // Print the parsed result
    console.log(JSON.stringify(result.parsed, null, 2));
    
    // Also save to file for inspection
    const fs = require('fs');
    const outPath = `/tmp/testsprite-${step}-${Date.now()}.json`;
    fs.writeFileSync(outPath, JSON.stringify(result.parsed, null, 2));
    console.error(`\n[run.js] Full output saved to ${outPath}`);
    
  } catch (e) {
    console.error('FATAL:', e.message);
    process.exit(1);
  }
}

main();
