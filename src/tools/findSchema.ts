import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import { getSchema } from "../util.js";
import { TMethods } from "../types/index.js";

export function registerFindSchemaTool(server: McpServer) {
  server.registerTool(
    "findSchema",
    {
      title: "Find Schema",
      description:
        "Searches the Swagger spec for schema matching a keyword in path/summary/tags",
      inputSchema: { keyword: z.string() },
    },
    async ({ keyword }) => {
      const spec = (await loadSwagger()) as any;
      const schema: {
        path: string;
        response: any;
        body: any;
        method: TMethods;
      }[] = [];

      for (const [path, methods] of Object.entries<any>(spec.paths || {})) {
        if (path.includes(keyword)) {
          for (const [method, operation] of Object.entries<any>(methods)) {
            schema.push({
              path,
              response: null,
              method: method as any,
              body: {
                ...operation?.requestBody,
                content: {
                  "application/json": {
                    schema: getSchema(
                      spec,
                      operation.requestBody?.content?.[
                        "application/json"
                      ]?.schema?.["$ref"].replace("#/components/schemas/", "")
                    ),
                  },
                },
              },
            });
          }
        }
      }

      if (schema.length === 0) {
        return {
          content: [
            { type: "text", text: `No schema found for "${keyword}".` },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Found schema:\n${schema
              .map((val) => JSON.stringify(val))
              .join("\n")}`,
          },
        ],
      };
    }
  );
}
