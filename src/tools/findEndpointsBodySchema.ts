import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { loadSwagger } from "../services/swaggerLoader.js";
import {
  getDTOFromContent,
  getSchema,
  removeDynamicParamsInPath,
} from "../util.js";
import { METHODS_WITH_BODY } from "../constants/index.js";
import { TMethods } from "../types/index.js";
import { OpenAPI, OpenAPIV3 } from "openapi-types";

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

      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [
          method,
          operation,
        ] of Object.entries<OpenAPIV3.OperationObject>(methods)) {
          if (METHODS_WITH_BODY.includes(method.toLowerCase() as TMethods)) {
            const requestBodyObj =
              operation.requestBody as OpenAPIV3.RequestBodyObject;
            const haystack = `${removeDynamicParamsInPath(path)} ${
              operation.summary || ""
            } ${operation.description || ""}`.toLowerCase();

            if (haystack.includes(keyword.toLowerCase())) {
              const bodyType = {
                ...(operation?.requestBody || {}),
                schema: getSchema(
                  spec,
                  getDTOFromContent(requestBodyObj?.content)
                ),
                content: undefined,
              };

              matches.push({
                method,
                path,
                summary: operation.summary || "",
                description: operation.description || "",
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
