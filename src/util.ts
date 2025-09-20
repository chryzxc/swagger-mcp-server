export const getSchema = (spec: any, dto: string) => {
  const schema = spec.components.schemas[dto];

  // fo;

  for (const [path, methods] of Object.entries<any>(spec.paths || {})) {
    if (path.includes(keyword)) {
      for (const [method, operation] of Object.entries<any>(methods)) {
        schema.push({
          path,
          response: null,
          method: method as any,
          body: {
            ...operation?.requestBody,
            content: {
              "application/json": {
                schema: getSchema(
                  operation.requestBody?.content?.[
                    "application/json"
                  ]?.schema?.["$ref"].replace("#/components/schemas/", "")
                ),
              },
            },
          },
        });
      }
    }
  }
};
