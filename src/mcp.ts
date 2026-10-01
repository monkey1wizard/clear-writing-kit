import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { lintText } from "./check.js";

export function createMcpServer() {
  const server = new McpServer({ name: "clear-writing-kit-textlint", version: "1.0.0" });
  server.registerTool("lintText", {
    description: "Lint text using a clear-writing-kit language and genre profile.",
    inputSchema: z.object({
      text: z.string(),
      language: z.enum(["en-US", "zh-TW", "ja-JP"]),
      genre: z.enum(["document", "conversation"]),
      filename: z.string().optional()
    })
  }, async ({ text, language, genre, filename }) => {
    try {
      const { result } = await lintText({ text, language, genre, filename });
      const findings = result.messages.map(({ type, ruleId, message, line, column, endLine, endColumn, severity }) => ({
        type, ruleId, message, line, column, endLine, endColumn, severity
      }));
      return { content: [{ type: "text", text: JSON.stringify(findings) }], structuredContent: { findings } };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }] };
    }
  });
  return server;
}

export async function runMcpServer() {
  const server = createMcpServer();
  await server.connect(new StdioServerTransport());
}
