import { DefaultModelRegistry, ModelRegistry } from './registry';
import {
  ModelDef,
  ModelFields,
  ModelFieldsOptions,
  ModelInstance,
  ModelMeta,
  ModelRegistryOptions,
  ModelValues,
} from './types';

export class BaseModel {}

export interface ModelFactoryParams<
  Fields extends ModelFields,
  Abstract extends { abstract?: boolean },
  Meta extends ModelMeta<Fields, Abstract>,
> {
  fields: Fields;
  meta: Meta;
}

export function ModelFactory<
  Fields extends ModelFields,
  Abstract extends { abstract?: boolean },
  Meta extends ModelMeta<Fields, Abstract>,
>(
  { fields, meta }: ModelFactoryParams<Fields, Abstract, Meta>,
  registryOptions?: { name: string; options: ModelRegistryOptions },
): ModelDef<Fields, Abstract, Meta> {
  const registry = registryOptions
    ? ModelRegistry.getInstance(registryOptions.name, registryOptions.options)
    : DefaultModelRegistry;

  const modelDef: ModelDef<Fields, Abstract, Meta> = {
    fields,
    meta,
    registry,

    //methods
    create: ({ fields, meta }) => {
      return ModelFactory({ fields, meta });
    },

    extend: ({ fields: newFields, meta: newMeta }) => {
      return ModelFactory({
        fields: { ...fields, ...newFields },
        meta: { ...meta, ...newMeta },
      });
    },

    merge: (models, newMeta) => {
      let newFields: Fields = { ...fields };
      let mergedMeta: Meta = { ...meta };

      models.forEach((model) => {
        newFields = { ...newFields, ...model.fields };
        mergedMeta = { ...mergedMeta, ...model.meta };
      });

      return ModelFactory({
        fields: newFields,
        meta: { ...mergedMeta, ...newMeta },
      });
    },

    omit: (fieldsToOmit, newMeta) => {
      const omittedFields = Object.fromEntries(
        Object.entries(fields).filter(
          ([name]) => !fieldsToOmit.includes(name as any),
        ),
      );

      return ModelFactory({
        fields: omittedFields,
        meta: { ...meta, ...newMeta } as any,
      }) as any;
    },

    validate: async (values, options) => {
      const results: Record<Extract<keyof Fields, string>, boolean> = {} as any;

      for (const name in fields) {
        const field = fields[name];
        const extraOptions = options?.[name];
        results[name] = await field.validate(values[name], extraOptions);
      }

      return !Object.values(results).some((value) => value !== true);
    },
  };

  const modelDefFn = <F extends Fields>(
    values: ModelValues<F>,
    options?: ModelFieldsOptions<F>,
  ) => {
    // initialize fields
    const _fields = Object.fromEntries(
      Object.entries(fields).map(([name, field]) => {
        const updatedOptions = {
          ...(fields[name].options || {}),
          ...(options?.[name as keyof F] || {}),
        };

        return [name, field(values[name], updatedOptions)];
      }),
    );

    const modelInstance: ModelInstance<Fields> = {
      ..._fields,
      validate: async () => {
        const results = {} as Record<string, boolean>;
        for (const name in _fields) {
          const field = _fields[name];
          results[name] = await field.validate();
        }

        return !Object.values(results).some((value) => value !== true);
      },
    };

    return modelInstance;
  };

  Object.assign(modelDefFn, modelDef);

  for (const name in fields) {
    const field = fields[name];
    field.setName(name);
    field.setModel(modelDefFn as any);
  }

  registry.register((meta as any).name, modelDefFn as any);

  return modelDefFn as any;
}
