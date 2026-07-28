export interface ToolResult {
  output: string;
  success: boolean;
  type: string;
}

export class AgentTools {
  static async executeBash(command: string): Promise<ToolResult> {
    console.log(`[bash] Executing: ${command}`);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate work
    
    let output = "";
    if (command.includes("ls")) {
      output = "README.md\npackage.json\nsrc\nnode_modules";
    } else if (command.includes("npm test")) {
      output = "1 passing (12ms)\n0 failing";
    } else {
      output = `Executed: ${command}\nexit code 0`;
    }
    
    return { output, success: true, type: 'BASH' };
  }

  static async fileRead(path: string): Promise<ToolResult> {
    console.log(`[file_read] Reading: ${path}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      output: `/* Content of ${path} */\n// (Simulation of file read for agent context)`,
      success: true,
      type: 'FILE_READ'
    };
  }

  static async fileWrite(path: string, content: string): Promise<ToolResult> {
    console.log(`[file_write] Writing to: ${path}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      output: `Successfully wrote ${content.length} bytes to ${path}`,
      success: true,
      type: 'FILE_WRITE'
    };
  }

  static async globSearch(pattern: string): Promise<ToolResult> {
    console.log(`[glob] Searching: ${pattern}`);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      output: `Matches for ${pattern}:\n- src/main.ts\n- src/lib/ai.ts`,
      success: true,
      type: 'GLOB'
    };
  }

  static async webSearch(query: string): Promise<ToolResult> {
    console.log(`[web_search] Searching: ${query}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      output: `Search Results for "${query}":\n[1] https://example.com - Example Domain\n[2] https://github.com/anthropics/mcp - MCP Standard`,
      success: true,
      type: 'WEB_SEARCH'
    };
  }
}
