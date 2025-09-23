import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import z from "zod";
import { getDTOFromContent, getDTOFromRef, getSchema } from "../util.js";
import { OpenAPIV3 } from "openapi-types";

export function registerFindEndpointsRelatedToEntityTool(server: McpServer) {
  server.registerTool(
    "findEndpointsRelatedToEntity",
    {
      title: "Find Endpoints Related to Entity",
      description:
        "Searches Swagger spec for endpoints related to a given entity (e.g., 'user', 'property'). Matches path, parameters, request/response schemas, and descriptions.",
      inputSchema: { entity: z.string() },
    },
    async ({ entity }) => {
      const spec = await loadSwagger();

      const matches = [];

      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [
          method,
          details,
        ] of Object.entries<OpenAPIV3.OperationObject>(methods)) {
          const requestBodyObj =
            details.requestBody as OpenAPIV3.RequestBodyObject;
          const requestBodySchema = getSchema(
            spec,
            getDTOFromContent(requestBodyObj.content)
          );

          const combined = [
            path,
            JSON.stringify(details.parameters || []),
            details.summary || "",
            details.description || "",
            JSON.stringify(details.requestBody || {}),
            JSON.stringify(details.responses || {}),
            JSON.stringify(requestBodySchema),
          ]
            .join(" ")
            .toLowerCase();

          if (combined.includes(entity.toLowerCase())) {
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
              text: `No endpoints found related to "${entity}".`,
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
