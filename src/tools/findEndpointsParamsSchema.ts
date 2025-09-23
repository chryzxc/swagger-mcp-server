import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { loadSwagger } from "../services/swaggerLoader.js";
import { removeDynamicParamsInPath } from "../util.js";
import { OpenAPIV3 } from "openapi-types";

interface IMatchedData {
  method: string;
  path: string;
  summary: string;
  description: string;
  paramsType: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[];
}

export function registerFindEndpointsParamsSchemaTool(server: McpServer) {
  server.registerTool(
    "findEndpointsParamsSchema",
    {
      title: "Find Endpoint Parameters Schema",
      description: "Search Swagger spec for an endpoint params schema",
      inputSchema: { keyword: z.string() },
    },
    async ({ keyword }) => {
      const spec = await loadSwagger();
      const matches: IMatchedData[] = [];

      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [
          method,
          details,
        ] of Object.entries<OpenAPIV3.OperationObject>(methods)) {
          if (method.toLowerCase() === "get") {
            const haystack = `${removeDynamicParamsInPath(path)} ${
              details.summary || ""
            } ${details.description || ""}`.toLowerCase();

            if (haystack.includes(keyword.toLowerCase())) {
              matches.push({
                method,
                path,
                summary: details.summary || "",
                description: details.description || "",
                paramsType: details?.parameters || [],
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
            } \nSchema: \n${JSON.stringify(e.paramsType)}`
        )
        .join("\n\n\n");

      return {
        content: [{ type: "text", text: formatted }],
      };
    }
  );
}
