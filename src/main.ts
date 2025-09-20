import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import {
  findEndpointByKeyword,
  findEndpointsRelatedToEntity,
  getSchema,
} from "./util.js";
import { keyof } from "zod/v4";

const SWAGGER_URL =
  process.env.SWAGGER_URL || "http://localhost:3333/api-docs-json";
const BASIC_AUTH_USER = process.env.SWAGGER_USER || "";
const BASIC_AUTH_PASS = process.env.SWAGGER_PASS || "";

async function loadSwagger() {
  const authHeader =
    "Basic " +
    Buffer.from(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASS}`).toString("base64");

  const res = await fetch(SWAGGER_URL, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch Swagger spec: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

const server = new McpServer({
  name: "swagger-agent",
  version: "1.0.0",
});

server.registerTool(
  "fetchSwagger",
  {
    title: "Fetch Swagger Spec",
    description: "Loads and returns the Swagger / OpenAPI spec",
    inputSchema: {},
  },
  async () => {
    const spec = await loadSwagger();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(spec, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  "findEndpoints",
  {
    title: "Find Endpoints",
    description:
      "Searches the Swagger spec for endpoints matching a keyword in path/summary/tags",
    inputSchema: { keyword: z.string() },
  },
  async ({ keyword }) => {
    const spec = (await loadSwagger()) as any;
    const endpoints: string[] = [];

    for (const [path, methods] of Object.entries<any>(spec.paths || {})) {
      for (const [method, operation] of Object.entries<any>(methods)) {
        if (
          path.includes(keyword) ||
          operation?.summary?.includes(keyword) ||
          (operation?.tags || []).some((t: string) => t.includes(keyword))
        ) {
          endpoints.push(`${method.toUpperCase()} ${path}`);
        }
      }
    }

    if (endpoints.length === 0) {
      return {
        content: [
          { type: "text", text: `No endpoints found for "${keyword}".` },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Found endpoints:\n${endpoints.join("\n")}`,
        },
      ],
    };
  }
);

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
      method: "post" | "get" | "patch";
    }[] = [];

    // for (const [path, methods] of Object.entries<any>(spec.paths || {})) {
    //   if (path.includes(keyword)) {
    //     for (const [method, operation] of Object.entries<any>(methods)) {
    //       schema.push({
    //         path,
    //         response: null,
    //         method: method as any,
    //         body: {
    //           ...operation?.requestBody,
    //           content: {
    //             "application/json": {
    //               schema: getSchema(
    //                 spec,
    //                 operation.requestBody?.content?.[
    //                   "application/json"
    //                 ]?.schema?.["$ref"].replace("#/components/schemas/", "")
    //               ),
    //             },
    //           },
    //         },
    //       });
    //     }
    //   }
    // }

    // if (schema.length === 0) {
    //   return {
    //     content: [{ type: "text", text: `No schema found for "${keyword}".` }],
    //   };
    // }

    // return {
    //   content: [
    //     {
    //       type: "text",
    //       text: `Found schema:\n${schema
    //         .map((val) => JSON.stringify(val))
    //         .join("\n")}`,
    //     },
    //   ],
    // };

    return {
      content: [
        { type: "text", text: JSON.stringify(getSchema(spec, keyword)) },
      ],
    };
  }
);

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
    const results = await findEndpointsRelatedToEntity(spec, entity);

    if (!results.length) {
      return {
        content: [
          { type: "text", text: `No endpoints found related to "${entity}".` },
        ],
      };
    }

    const formatted = results
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

server.registerTool(
  "findEndpointByKeyword",
  {
    title: "Find Endpoint by Keyword",
    description: "Search Swagger spec for an endpoint related to a keyword",
    inputSchema: { keyword: z.string() },
  },
  async ({ keyword }) => {
    const spec = await loadSwagger();
    const results = await findEndpointByKeyword(spec, keyword);

    if (!results.length) {
      return {
        content: [
          {
            type: "text",
            text: `No endpoints found for keyword "${keyword}".`,
          },
        ],
      };
    }

    const formatted = results
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

server.registerResource(
  "swagger-spec",
  new ResourceTemplate("swagger://spec", { list: undefined }),
  {
    title: "Swagger Spec Resource",
    description: "Fetches and exposes the Swagger spec as a resource",
  },
  async (uri) => {
    const spec = await loadSwagger();
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(spec, null, 2),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
