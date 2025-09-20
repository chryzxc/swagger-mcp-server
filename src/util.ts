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
