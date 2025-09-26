# Swagger MCP Agent

The **Swagger MCP Agent** is a custom **Model Context Protocol (MCP)** server that integrates Swagger/OpenAPI specifications with AI assistants.  
It allows MCP-compatible clients (like VSCode MCP, Claude Desktop, or Cursor) to understand and interact with your API documentation.

With this agent, you can:

- Navigate API endpoints
- Inspect request and response schemas
- Search for endpoints by parameters or keywords
- Generate example API calls
- Assist in API integration and development

---

## 🚀 Features

- **Swagger/OpenAPI Support** – Load and parse API specs into MCP resources.
- **MCP Tools** – Expose helper tools to search and navigate endpoints.
- **TypeScript Support** – Written in modern TypeScript for type safety.
- **Developer-Friendly** – Works with MCP Inspector, VSCode MCP, Claude Desktop, and other MCP clients.

---

## 📦 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/chryzxc/swagger-mcp-server.git
cd swagger-mcp-server

# Install dependencies
npm install
```

---

## ▶️ Running the Server

You can run the MCP server directly using **tsx** or build first.

### Run directly

```bash
npx tsx /src/main.ts
```

### Add `config.json` in root directory

```bash
{
  "SWAGGER_URL": "https://some-domain/api-docs-json",
  "SWAGGER_BASIC_AUTH_USER": "",
  "SWAGGER_BASIC_AUTH_PASS": ""
}
```

### Build and run

```bash
npm run build
node dist/main.js
```

### Run inspector

```bash
npm run inspector
```

---

## ⚙️ MCP Client Configuration

Add the Swagger MCP server to your MCP client configuration.

### VSCode Example (`.vscode/settings.json`)

```json
{
  "mcp.servers": {
    "swagger-agent": {
      "command": "node",
      "args": ["E:/Projects/swagger-mcp-server/dist/main.js"],
      "env": {
        "SWAGGER_BASIC_AUTH_USER": "",
        "SWAGGER_BASIC_AUTH_PASS": "",
        "SWAGGER_URL": "http://localhost:3333/api-docs-json"
      },
      "type": "stdio"
    }
  }
}
```

> 💡 Adjust the path according to your local project location.

---

## 🛠️ Usage

Once configured, your MCP client can interact with your Swagger spec. Examples:

```text
> "List all available endpoints"
> "What are the required fields in user endpoint"
> "Show the request parameters for /users/{id}"
> "Find endpoints related to users"
> "Give me the body payload schema for /orders"
> "Give me the response schema for /orders"
> "What are the endpoints that requires `userId` field"
```

The Swagger MCP Agent will fetch and analyze your spec, returning structured responses.

## 📝 License

MIT License © 2025 Christian Villablanca
