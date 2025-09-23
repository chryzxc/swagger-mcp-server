import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import z from "zod";
import { OpenAPIV3 } from "openapi-types";

export function registerFindEndpointsByKeywordTool(server: McpServer) {
  server.registerTool(
    "findEndpointsByKeyword",
    {
      title: "Find Endpoint by Keyword",
      description: "Search Swagger spec for an endpoint related to a keyword",
      inputSchema: { keyword: z.string() },
    },
    async ({ keyword }) => {
      const spec = await loadSwagger();
      const matches = [];

      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [
          method,
          details,
        ] of Object.entries<OpenAPIV3.OperationObject>(methods)) {
          const haystack = `${path} ${details.summary || ""} ${
            details.description || ""
          }`.toLowerCase();
          if (haystack.includes(keyword.toLowerCase())) {
            matches.push({
              method: method.toUpperCase(),
              path,
              summary: details.summary || "",
              description: details.description || "",
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
