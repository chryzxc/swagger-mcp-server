import { OpenAPIV3 } from "openapi-types";

export const getSchema = (spec: any, dto: string): Record<any, any> => {
  const schema = spec.components.schemas[dto];

  if (!schema) {
    return {};
  }
  const requiredFields: string[] = schema?.required || [];

  const mapObject = (objValue: OpenAPIV3.SchemaObject = {}) => {
    let obj = {};
    for (const [field, values] of Object.entries(objValue)) {
      obj = {
        ...obj,
        [field]:
          typeof values === "object"
            ? {
                ...(requiredFields.includes(field) ? { required: true } : {}),
                ...mapObject(values || {}),
                ...(values?.["$ref"]
                  ? getSchema(spec, getDTOFromRef(values?.["$ref"]))
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
  return {};
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
