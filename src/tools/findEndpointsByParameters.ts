import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { loadSwagger } from "../services/swaggerLoader.js";

export function registerFindEndpointsByParametersTool(server: McpServer) {
  server.registerTool(
    "findEndpointsByParametersSchema",
    {
      title: "Find Endpoint By Parameters",
      description:
        "Search Swagger spec for an endpoint that requires a specific parameters (e.g. userId, amount, propertyId)",
      inputSchema: { params: z.array(z.string()) },
    },
    async ({ params }) => {
      const spec = await loadSwagger();
      const matches = [];

      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const [method, details] of Object.entries(methods as any)) {
          if (
            method.toLowerCase() === "get" &&
            (details as any).parameters?.some((paramObj: any) =>
              params.includes(paramObj.name)
            )
          ) {
            matches.push({
              method,
              path,
              summary: (details as any).summary || "",
              description: (details as any).description || "",
              paramsType: (details as any)?.parameters,
            });
          }
        }
      }

      if (!matches.length) {
        return {
          content: [
            {
              type: "text",
              text: `No endpoints found using parameters (${params.join(
                ","
              )}).`,
            },
          ],
        };
      }

      const formatted = matches
        .map(
          (e) =>
            `${e.method} ${e.path}\nSummary: ${e.summary}\nDescription: ${
              e.description
            } \nSchema: \n${JSON.stringify(e.paramsType)}`
        )
        .join("\n\n\n");

      return {
        content: [{ type: "text", text: formatted }],
      };
    }
  );
}
