const SWAGGER_URL =
  process.env.SWAGGER_URL || "http://localhost:3333/api-docs-json";
const BASIC_AUTH_USER = process.env.SWAGGER_USER || "";
const BASIC_AUTH_PASS = process.env.SWAGGER_PASS || "";

export async function loadSwagger() {
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

  return await res.json();
}
