import { OpenAPI } from "openapi-types";
import fs from "fs";

function loadConfig() {
  const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
  return {
    SWAGGER_URL: config.SWAGGER_URL || "http://localhost:3333/api-docs-json",
    BASIC_AUTH_USER: config.SWAGGER_BASIC_AUTH_USER || "",
    BASIC_AUTH_PASS: config.SWAGGER_BASIC_AUTH_PASS || "",
  };
}

let swaggerSpec: any = null;

export async function loadSwagger(): Promise<OpenAPI.Document> {
  if (swaggerSpec) {
    return swaggerSpec;
  }

  const { BASIC_AUTH_PASS, BASIC_AUTH_USER, SWAGGER_URL } = loadConfig();

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

  swaggerSpec = await res.json();

  return swaggerSpec;
}
