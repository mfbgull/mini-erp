interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
  handler: (params: any) => Promise<any>;
}

class MockWebMCP {
  private tools: Map<string, ToolDefinition> = new Map();
  private isEnabled: boolean = false;

  enable() {
    this.isEnabled = true;
    console.log('🧪 Mock WebMCP enabled for testing');
  }

  registerTool(tool: ToolDefinition) {
    if (!this.isEnabled) {
      console.warn('Mock WebMCP not enabled. Call mockWebMCP.enable() first');
      return;
    }
    this.tools.set(tool.name, tool);
    console.log(`✅ Tool registered: ${tool.name}`);
  }

  async discoverTools(): Promise<string[]> {
    if (!this.isEnabled) {
      throw new Error('Mock WebMCP not enabled');
    }
    return Array.from(this.tools.keys());
  }

  async callTool(name: string, params: any): Promise<any> {
    if (!this.isEnabled) {
      throw new Error('Mock WebMCP not enabled');
    }

    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }

    console.log(`🚀 Mock WebMCP: Calling ${name}`, params);
    
    try {
      const result = await tool.handler(params);
      console.log(`✅ Mock WebMCP: ${name} succeeded`, result);
      return result;
    } catch (error) {
      console.error(`❌ Mock WebMCP: ${name} failed`, error);
      throw error;
    }
  }

  getToolInfo(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }
}

const mockWebMCP = new MockWebMCP();

if (typeof window !== 'undefined') {
  (window as any).mockWebMCP = mockWebMCP;
  
  if (!(window as any).WebMCP) {
    console.log('Mock WebMCP available as window.mockWebMCP');
    console.log('Enable with: window.mockWebMCP.enable()');
    console.log('Or use real Chrome Canary with --enable-features=WebMCP');
  }
}

export default mockWebMCP;
