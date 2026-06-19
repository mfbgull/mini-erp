import { useState, useEffect } from 'react';
import './WebMCPStatus.css';

interface WindowWithWebMCPStatus extends Window {
  WebMCP?: {
    discoverTools?: () => Promise<string[]>;
    callTool?: (name: string, params: Record<string, unknown>) => Promise<unknown>;
  };
  mockWebMCP?: unknown;
}

export default function WebMCPStatus() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [tools, setTools] = useState<string[]>([]);

  useEffect(() => {
    const checkWebMCP = () => {
      const win = window as unknown as WindowWithWebMCPStatus;
      if (win.WebMCP) {
        setIsSupported(true);
        if (win.WebMCP.discoverTools) {
          win.WebMCP.discoverTools().then((availableTools: string[]) => {
            setTools(availableTools);
            setIsRegistered(availableTools.length > 0);
          });
        }
      }
    };

    checkWebMCP();
    const interval = setInterval(checkWebMCP, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isSupported) {
    const win = window as unknown as WindowWithWebMCPStatus;
    const isMock = win.WebMCP && win.mockWebMCP;

    if (isMock) {
      return (
        <div className="webmcp-status webmcp-status-mock">
          <div className="webmcp-status-title-mock">
            WebMCP: MOCK MODE
          </div>
          <div className="webmcp-status-subtitle webmcp-status-subtitle-mock">
            Using mock implementation for testing
          </div>
          <div className="webmcp-status-test">
            <strong>Test in Console:</strong>
            <code className="webmcp-status-code">
              {`await window.WebMCP.callTool("search_customers", {"query": "test"})`}
            </code>
          </div>
          <div className="webmcp-status-note">
            For real WebMCP: Use Chrome Canary with --enable-features=WebMCP
          </div>
        </div>
      );
    }

    return (
      <div className="webmcp-status webmcp-status-not-supported">
        WebMCP: Not Supported (Use Chrome Canary 146+ with --enable-features=WebMCP)
      </div>
    );
  }

  return (
    <div className={`webmcp-status ${isRegistered ? 'webmcp-status-active' : 'webmcp-status-initializing'}`}>
      <div className={isRegistered ? 'webmcp-status-title-active' : 'webmcp-status-title-initializing'}>
        WebMCP: {isRegistered ? 'Active' : 'Initializing...'}
      </div>
      {tools.length > 0 && (
        <div className="webmcp-status-tools">
          <div className="webmcp-status-tools-title">Available Tools ({tools.length}):</div>
          <ul className="webmcp-status-tools-list">
            {tools.map(tool => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
          <div className="webmcp-status-test-box">
            <strong>Test in Console:</strong>
            <code className="webmcp-status-code">
              {`await window.WebMCP.callTool("search_customers", {"query": "Baig"})`}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
