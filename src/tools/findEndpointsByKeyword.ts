import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import z from "zod";

export function registerFindEndpointsByKeywordTool(server: McpServer) {
  server.registerTool(
    "findEndpointByKeyword",
    {
      title: "Find Endpoint by Keyword",
      description: "Search Swagger spec for an endpoint related to a keyword",
      inputSchema: { keyword: z.string() },
    },
    async ({ keyword }) => {
      const spec = await loadSwagger();
      const matches = [];

      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const [method, details] of Object.entries(methods as any)) {
          const haystack = `${path} ${(details as any).summary || ""} ${
            (details as any).description || ""
          }`.toLowerCase();
          if (haystack.includes(keyword.toLowerCase())) {
            matches.push({
              method: method.toUpperCase(),
              path,
              summary: (details as any).summary || "",
              description: (details as any).description || "",
            });
          }
        }
      }

      if (!matches.length) {
        return {
          content: [
            {
              type: "text",
              text: `No endpoints found for keyword "${keyword}".`,
            },
          ],
        };
      }

      const formatted = matches
        .map(
          (e) =>
            `${e.method} ${e.path}\nSummary: ${e.summary}\nDescription: ${e.description}`
        )
        .join("\n\n");

      return {
        content: [{ type: "text", text: formatted }],
      };
    }
  );
}
