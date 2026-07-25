/**
 * Adapter that wraps the existing Oura tool dispatcher in an SDK Server,
 * so we can use StreamableHTTPServerTransport for claude.ai's custom
 * connector flow without rewriting every tool.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { tools, executeToolCall } from './tools.js';

export function createOuraMcpServer(): Server {
  const server = new Server(
    { name: 'oura-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await executeToolCall({
      name: request.params.name,
      arguments: (request.params.arguments ?? {}) as Record<string, any>,
    });
    return { content: result.content };
  });

  return server;
}
