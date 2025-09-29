// Map Prisma model → JSON columns → TypeScript types
interface JsonFieldMap {
  Trigger: {
    // configuration: TriggerConfig;
  };
}

export function castJsonFields<TModel extends keyof JsonFieldMap>(
  record: any
): Omit<typeof record, keyof JsonFieldMap[TModel]> & JsonFieldMap[TModel] {
  const typedRecord: any = { ...record };

  // Get the keys of JsonFieldMap[TModel] as a typed array
  const jsonKeys = Object.keys({} as JsonFieldMap[TModel]) as Array<keyof JsonFieldMap[TModel]>;

  jsonKeys.forEach((key) => {
    if (key in typedRecord) {
      typedRecord[key] = typedRecord[key] as JsonFieldMap[TModel][typeof key];
    }
  });

  return typedRecord;
}
