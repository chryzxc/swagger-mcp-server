import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import z from "zod";
import { getDTOFromContent, getSchema } from "../util.js";

export function registerFindEndpointsResponseSchemaTool(server: McpServer) {
  server.registerTool(
    "findEndpointsResponseSchema",
    {
      title: "Find Endpoint Response Schema",
      description: "Search Swagger spec for an endpoint response schema",
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
            let responseType = {};

            for (const [status, responseDetails] of Object.entries(
              (details as any).responses
            )) {
              if (typeof responseDetails === "object") {
                responseType = {
                  ...responseType,

                  [status]: {
                    ...responseDetails,

                    schema: getSchema(
                      spec,
                      getDTOFromContent((responseDetails as any)?.content)
                    ),
                    content: undefined,
                  },
                };
              }
            }
            matches.push({
              method: method.toUpperCase(),
              path,
              summary: (details as any).summary || "",
              description: (details as any).description || "",
              responseType,
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
            `${e.method} ${e.path}\nSummary: ${e.summary}\nDescription: ${
              e.description
            } \nSchema: \n${JSON.stringify(e.responseType)}`
        )
        .join("\n\n\n");

      return {
        content: [{ type: "text", text: formatted }],
      };
    }
  );
}
