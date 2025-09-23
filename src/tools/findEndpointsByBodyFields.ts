import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { METHODS_WITH_BODY } from "../constants/index.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import { TMethods } from "../types/index.js";
import { getDTOFromContent, getSchema } from "../util.js";
import { OpenAPIV3 } from "openapi-types";

export function registerFindEndpointsByBodyFieldsTool(server: McpServer) {
  server.registerTool(
    "findEndpointsByBodyFields",
    {
      title: "Find Endpoint By Body Fields",
      description:
        "Search Swagger spec for an endpoint that requires a specific fields in body payload (e.g. userId, amount, propertyId)",
      inputSchema: { fields: z.array(z.string()) },
    },
    async ({ fields }) => {
      const spec = await loadSwagger();
      const matches = [];

      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [
          method,
          details,
        ] of Object.entries<OpenAPIV3.OperationObject>(methods)) {
          if (METHODS_WITH_BODY.includes(method.toLowerCase() as TMethods)) {
            const requestBodyObj =
              details.requestBody as OpenAPIV3.RequestBodyObject;
            const schema = getSchema(
              spec,
              getDTOFromContent(requestBodyObj.content)
            );
            const hasField = Object.keys(schema).some((schemaField) =>
              fields.includes(schemaField)
            );
            if (hasField) {
              matches.push({
                method,
                path,
                summary: details.summary || "",
                description: details.description || "",
                schema,
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
              text: `No endpoints found for fields (${fields.join(",")}).`,
            },
          ],
        };
      }

      const formatted = matches
        .map(
          (e) =>
            `${e.method} ${e.path}\nSummary: ${e.summary}\nDescription: ${
              e.description
            } \nSchema: \n${JSON.stringify(e.schema)}`
        )
        .join("\n\n\n");

      return {
        content: [{ type: "text", text: formatted }],
      };
    }
  );
}
