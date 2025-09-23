import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { loadSwagger } from "../services/swaggerLoader.js";
import { OpenAPIV3 } from "openapi-types";

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

      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [
          method,
          details,
        ] of Object.entries<OpenAPIV3.OperationObject>(methods)) {
          if (
            method.toLowerCase() === "get" &&
            details.parameters?.some((paramObj: any) =>
              params.includes(paramObj.name)
            )
          ) {
            matches.push({
              method,
              path,
              summary: details.summary || "",
              description: details.description || "",
              paramsType: details?.parameters,
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
