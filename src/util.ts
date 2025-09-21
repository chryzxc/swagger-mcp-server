export const getSchema = (spec: any, dto: string) => {
  const schema = spec.components.schemas[dto];

  if (!schema) {
    return null;
  }
  const requiredFields: string[] = schema?.required || [];

  const mapObject = (objValue: Record<any, any> = {}) => {
    let obj = {};
    for (const [field, values] of Object.entries(objValue)) {
      obj = {
        ...obj,
        [field]:
          typeof values === "object"
            ? {
                ...(requiredFields.includes(field) ? { required: true } : {}),
                ...mapObject(values || {}),
                ...((values as any)?.["$ref"]
                  ? getSchema(spec, getDTOFromRef((values as any)?.["$ref"]))
                  : {}),
              }
            : values,
      };
    }
    if ((obj as any)?.["$ref"]) {
      delete (obj as any)["$ref"];
    }
    return obj;
  };

  if (schema.type === "object") {
    let formattedSchema = mapObject(schema?.properties);

    return formattedSchema;
  }
  return "";
};

export const getDTOFromContent = (content: any) =>
  content?.["application/json"]?.schema?.$ref?.replace(
    "#/components/schemas/",
    ""
  );

export const getDTOFromRef = (refValue: string) =>
  refValue?.replace("#/components/schemas/", "");

export const removeDynamicParamsInPath = (rawPath: string) =>
  rawPath
    .split("/")
    .filter((val) => !val.includes("{") || !val.includes("}"))
    .join("/");
