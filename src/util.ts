export async function findEndpointByKeyword(spec: any, keyword: string) {
  const matches = [];

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, details] of Object.entries(methods as any)) {
      const haystack = `${path} ${(details as any).summary || ""} ${
        (details as any).description || ""
      }`.toLowerCase();
      if (haystack.includes(keyword.toLowerCase())) {
        matches.push({
          method: method.toUpperCase(),
          path,
          summary: (details as any).summary || "",
          description: (details as any).description || "",
        });
      }
    }
  }

  return matches;
}

export async function findEndpointsRelatedToEntity(spec: any, entity: any) {
  const matches = [];

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, details] of Object.entries(methods as any)) {
      const combined = [
        path,
        JSON.stringify((details as any).parameters || []),
        (details as any).summary || "",
        (details as any).description || "",
        JSON.stringify((details as any).requestBody || {}),
        JSON.stringify((details as any).responses || {}),
      ]
        .join(" ")
        .toLowerCase();

      if (combined.includes(entity.toLowerCase())) {
        matches.push({
          method: method.toUpperCase(),
          path,
          summary: (details as any).summary || "",
          description: (details as any).description || "",
        });
      }
    }
  }

  return matches;
}

export const getSchema = (spec: any, dto: string) => {
  const schema = spec.components.schemas[dto];

  if (!schema) {
    return null;
  }
  const requiredFields: string[] = schema?.required || [];

  if (schema.type === "object") {
    let formattedSchema = {};
    for (const [field, values] of Object.entries(schema.properties)) {
      formattedSchema = {
        ...formattedSchema,
        [field]:
          typeof values === "object"
            ? {
                ...values,
                ...(requiredFields.includes(field) ? { required: true } : {}),
                ...((values as any)?.["$ref"]
                  ? getSchema(spec, cleanRef((values as any)["$ref"]))
                  : {}),
              }
            : values,
      };
    }

    return formattedSchema;
  }
  return "";
};

export const cleanRef = (refValue: string) =>
  refValue.replace("#/components/schemas/", "");
