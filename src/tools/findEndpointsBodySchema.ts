import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { loadSwagger } from "../services/swaggerLoader.js";
import {
  getDTOFromContent,
  getSchema,
  removeDynamicParamsInPath,
} from "../util.js";

export function registerFindEndpointsBodySchemaTool(server: McpServer) {
  server.registerTool(
    "findEndpointsBodySchema",
    {
      title: "Find Endpoint Body Schema",
      description: "Search Swagger spec for an endpoint body schema",
      inputSchema: { keyword: z.string() },
    },
    async ({ keyword }) => {
      const spec = await loadSwagger();
      const matches = [];

      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const [method, details] of Object.entries(methods as any)) {
          if (["post", "patch", "put"].includes(method.toLowerCase())) {
            const haystack = `${removeDynamicParamsInPath(path)} ${
              (details as any).summary || ""
            } ${(details as any).description || ""}`.toLowerCase();
            if (haystack.includes(keyword.toLowerCase())) {
              const bodyType = {
                ...((details as any)?.requestBody || {}),
                schema: getSchema(
                  spec,
                  getDTOFromContent((details as any)?.requestBody?.content)
                ),
                content: undefined,
              };

              matches.push({
                method,
                path,
                summary: (details as any).summary || "",
                description: (details as any).description || "",
                bodyType,
              });
            }
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
            `${e.method} ${e.path}\nSummary: ${e.summary}\nDescription: ${
              e.description
            } \nSchema: \n${JSON.stringify(e.bodyType)}`
        )
        .join("\n\n\n");

      return {
        content: [{ type: "text", text: formatted }],
      };
    }
  );
}
