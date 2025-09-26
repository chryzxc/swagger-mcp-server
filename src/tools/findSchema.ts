import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import { getDTOFromContent, getSchema } from "../util.js";
import { TMethods } from "../types/index.js";
import { OpenAPIV3 } from "openapi-types";

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
      const spec = await loadSwagger();
      const schema = [];

      for (const [path, methods] of Object.entries(spec.paths || {})) {
        if (path.includes(keyword)) {
          for (const [
            method,
            operation,
          ] of Object.entries<OpenAPIV3.OperationObject>(methods)) {
            const requestBody = (operation.requestBody ||
              {}) as OpenAPIV3.RequestBodyObject;

            const responses = operation.responses
              ? Object.entries(operation.responses).reduce(
                  (acc, [key, value]) => {
                    const responseValue = value as OpenAPIV3.ResponseObject;
                    return {
                      ...acc,
                      [key]: {
                        ...responseValue,
                        content: {
                          "application/json": {
                            schema: responseValue.content
                              ? getSchema(
                                  spec,
                                  getDTOFromContent(responseValue.content)
                                )
                              : null,
                          },
                        },
                      },
                    };
                  },
                  {}
                )
              : null;

            schema.push({
              path,
              method: method as TMethods,
              parameters: operation.parameters,
              tags: operation.tags,
              responses,
              body: {
                ...requestBody,
                content: {
                  "application/json": {
                    schema: requestBody.content
                      ? getSchema(spec, getDTOFromContent(requestBody.content))
                      : null,
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
