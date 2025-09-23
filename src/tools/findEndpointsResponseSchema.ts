import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import z from "zod";
import { getDTOFromContent, getSchema } from "../util.js";
import { OpenAPIV3 } from "openapi-types";

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

      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [
          method,
          details,
        ] of Object.entries<OpenAPIV3.OperationObject>(methods)) {
          const haystack = `${path} ${details.summary || ""} ${
            details.description || ""
          }`.toLowerCase();
          if (haystack.includes(keyword.toLowerCase())) {
            let responseType = {};

            for (const [status, responseDetails] of Object.entries(
              details.responses
            )) {
              if (typeof responseDetails === "object") {
                const responseObj = responseDetails as OpenAPIV3.ResponseObject;
                responseType = {
                  ...responseType,
                  [status]: {
                    ...responseDetails,
                    schema: getSchema(
                      spec,
                      getDTOFromContent(responseObj.content)
                    ),
                    content: undefined,
                  },
                };
              }
            }
            matches.push({
              method: method.toUpperCase(),
              path,
              summary: details.summary || "",
              description: details.description || "",
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
