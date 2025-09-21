import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadSwagger } from "./services/swaggerLoader.js";
import { registerFindEndpointsTool } from "./tools/findEndpoints.js";
import { registerFindEndpointsByKeywordTool } from "./tools/findEndpointsByKeyword.js";
import { registerFindEndpointsParamsSchemaTool } from "./tools/findEndpointsParamsSchema.js";
import { registerFindEndpointsRelatedToEntityTool } from "./tools/findEndpointsRelatedToEntity.js";
import { registerFindEndpointsResponseSchemaTool } from "./tools/findEndpointsResponseSchema.js";
import { registerFindSchemaTool } from "./tools/findSchema.js";
import { registerFindEndpointsBodySchemaTool } from "./tools/findEndpointsBodySchema.js";
import { registerListEndpointsTool } from "./tools/listEndpoints.js";

const server = new McpServer({
  name: "swagger-agent",
  version: "1.0.0",
});

registerListEndpointsTool(server);
registerFindEndpointsBodySchemaTool(server);
registerFindEndpointsParamsSchemaTool(server);
registerFindEndpointsResponseSchemaTool(server);
registerFindEndpointsByKeywordTool(server);
registerFindEndpointsTool(server);
registerFindEndpointsRelatedToEntityTool(server);
registerFindSchemaTool(server);

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
