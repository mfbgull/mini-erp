#!/usr/bin/env node
const { spawn } = require('child_process');
const API_KEY = 'sk-user-2J_y9Dp0AaegFTzWxwUnJgssq5iycgjWvet7AIkZHZofzNanF4gsBs1PjLS4O1Tx8qfknpcsRiVxDnT06JjV9ymeOqEGX3E1lToN9gfEdFf7aj96r2jVO_UscZBBLf3kDBM';
const PROJECT_PATH = '/home/fawad/ai/minierp';

function callMcp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['@testsprite/testsprite-mcp@latest'], {
      env: { ...process.env, API_KEY },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let output = '';
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { child.kill(); reject(new Error('Timeout after 600s')); }
    }, 600000);
    child.stdout.on('data', (data) => {
      output += data.toString();
      const lines = output.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === 1) {
            resolved = true;
            clearTimeout(timeout);
            child.stdin.end();
            child.kill();
            resolve(parsed);
          }
        } catch(e) {}
      }
    });
    child.stderr.on('data', () => {});
    child.on('close', () => {
      if (!resolved) {
        clearTimeout(timeout);
        reject(new Error('No response. Output: ' + output.slice(-1000)));
      }
    });
    const request = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) + '\n';
    child.stdin.write(request);
  });
}

// Wrapper that calls a tool via tools/call
async function callTool(toolName, args = {}) {
  console.log(`Calling tool: ${toolName}...`);
  const result = await callMcp('tools/call', { name: toolName, arguments: args });
  return result;
}

async function main() {
  const step = process.argv[2];
  
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
        console.log(JSON.stringify(result, null, 2));
        break;
        
      case 'bootstrap-be':
        result = await callTool('testsprite_bootstrap', {
          localPort: 3011,
          type: 'backend',
          projectPath: PROJECT_PATH,
          testScope: 'codebase'
        });
        console.log(JSON.stringify(result, null, 2));
        break;
        
      case 'code-summary':
        result = await callTool('testsprite_generate_code_summary', {
          projectRootPath: PROJECT_PATH
        });
        console.log(JSON.stringify(result, null, 2));
        break;
        
      case 'prd':
        result = await callTool('testsprite_generate_standardized_prd', {
          projectPath: PROJECT_PATH
        });
        console.log(JSON.stringify(result, null, 2));
        break;
        
      case 'fe-testplan':
        result = await callTool('testsprite_generate_frontend_test_plan', {
          projectPath: PROJECT_PATH,
          needLogin: true
        });
        console.log(JSON.stringify(result, null, 2));
        break;
        
      case 'be-testplan':
        result = await callTool('testsprite_generate_backend_test_plan', {
          projectPath: PROJECT_PATH
        });
        console.log(JSON.stringify(result, null, 2));
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
        console.log(JSON.stringify(result, null, 2));
        break;
        
      case 'dashboard':
        const modContext = process.argv[3] || '';
        result = await callTool('testsprite_open_test_result_dashboard', {
          projectPath: PROJECT_PATH,
          modificationContext: modContext
        });
        console.log(JSON.stringify(result, null, 2));
        break;
        
      default:
        console.log('Usage: node run-testsprite.js [bootstrap-fe|bootstrap-be|code-summary|prd|fe-testplan|be-testplan|execute|dashboard]');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
