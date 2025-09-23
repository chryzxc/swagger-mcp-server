import { OpenAPI } from "openapi-types";

const SWAGGER_URL =
  process.env.SWAGGER_URL || "http://localhost:3333/api-docs-json";
const BASIC_AUTH_USER = process.env.SWAGGER_USER || "";
const BASIC_AUTH_PASS = process.env.SWAGGER_PASS || "";

let swaggerSpec: any = null;

export async function loadSwagger(): Promise<OpenAPI.Document> {
  if (swaggerSpec) {
    return swaggerSpec;
  }

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
