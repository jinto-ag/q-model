import * as changeCase from 'change-case';
import { z } from 'zod';
import { ModelDef, ModelFieldDef, ModelFieldOptions } from './types';

export type RequiredProps<
  Type extends any = any,
  Options extends ModelFieldOptions<Type> = ModelFieldOptions<Type>,
> = {
  [Key in keyof Options]: undefined extends Options[Key]
    ? Options[Key]
    : NonNullable<Options[Key]>;
};

export type ModelFactoryReturnType<
  Type extends any = any,
  Options extends ModelFieldOptions<Type> = ModelFieldOptions<Type>,
  M extends ModelDef = ModelDef,
> = (
  options?: RequiredProps<Type, Options>,
) => ModelFieldDef<Type, RequiredProps<Type, Options>, M>;

export function ModelFieldFactory<
  Type extends any = any,
  Options extends ModelFieldOptions<Type> = ModelFieldOptions<Type>,
  M extends ModelDef = ModelDef,
>(
  schema: z.ZodType<Type | null, any>,
  factoryOptions?: ModelFieldOptions<Type> & Options,
): ModelFactoryReturnType<Type, ModelFieldOptions<Type> & Options, M> {
  return (fieldOptions) => {
    const { name: fieldName, ...options } = {
      ...(factoryOptions || {}),
      ...(fieldOptions || {}),
    };

    let model: M | null = null;
    let name: string | undefined = fieldName;

    const fieldDef: ModelFieldDef<Type, typeof options, M> = {
      options,
      ...options,
      // default properties
      required: options.required || true,
      readOnly: options.readOnly || false,
      nullable: options.nullable || false,
      default: options.default,
      displayName: options.displayName || changeCase.capitalCase(name || ''),
      validators: options.validators || [],
      order: options.order,
      hidden: options.hidden || false,
      visuallyHidden: options.visuallyHidden || false,
      compute: options.compute,
      value:
        typeof options.default === 'function'
          ? options?.default?.()
          : options.default,

      schema: transformSchema(schema, options),
      // events, //add events

      // static methods
      setModel: (model) => {
        model = model;
        fieldDefFn.model = model;
      },

      setName: (fieldName) => {
        name = name || fieldName;
        fieldDefFn.displayName =
          fieldDefFn.displayName || changeCase.capitalCase(fieldName);
      },

      getName: () => {
        return name!;
      },

      validate: async (value, extraOptions) => {
        const updatedOptions = { ...options, ...(extraOptions || {}) };

        // update schema according to new options
        const refinedSchema = transformSchema(schema, updatedOptions);

        const output = await refinedSchema.safeParseAsync(value);
        if (output.success) {
          return true;
        }

        return false;
      },
    };

    const fieldDefFn: ModelFieldDef<Type, typeof options, M> = (
      value,
      extraOptions = {},
    ) => {
      const { name: fieldName, ...updatedOptions } = {
        ...options,
        ...extraOptions,
      };

      // assigning name from options
      name = fieldName || name;

      return {
        // type
        __type: ['ModelField'],
        // options
        ...updatedOptions,
        required: updatedOptions.required || true,
        readOnly: updatedOptions.readOnly || false,
        nullable: updatedOptions.nullable || false,
        default: updatedOptions.default || null,
        displayName:
          updatedOptions.displayName || changeCase.capitalCase(name || ''),
        validators: updatedOptions.validators || [],
        order: updatedOptions.order,
        hidden: updatedOptions.hidden || false,
        visuallyHidden: updatedOptions.visuallyHidden || false,
        compute: updatedOptions.compute,

        // properties
        model: model as any,
        value: value
          ? value
          : value === null
            ? value
            : typeof updatedOptions.default === 'function'
              ? updatedOptions?.default?.()
              : updatedOptions.default,

        // methods
        validate: async (extraOptions) => {
          const refinedOptions = { ...updatedOptions, ...(extraOptions || {}) };
          const refinedSchema = transformSchema(schema, refinedOptions);

          // validation logic
          const output = await refinedSchema.safeParseAsync(value);
          if (output.success) {
            return true;
          }

          return false;
        },

        getName: () => {
          return name;
        },
      };
    };

    Object.assign(fieldDefFn, fieldDef);

    return fieldDefFn as any;
  };
}

/**
 * Helper functions
 */

export const transformSchema = <
  Type extends any,
  Options extends ModelFieldOptions<Type | null>,
>(
  schema: z.ZodType<Type | null>,
  options: Options,
) => {
  if (options.default) {
    if (typeof options.default === 'function') {
      schema = schema.default(options.default as any) as any;
    } else {
      schema = schema.default(() => options.default as any) as any;
    }
  }

  if (options.nullable) {
    schema = schema.nullable().refine((value) => value !== undefined);
  } else {
    schema = schema.refine((value) => value !== null);
  }

  if (!options.required) {
    schema = schema.optional() as any;
  } else {
    if (options.nullable) {
      schema = schema.nullable();
    }
  }

  return schema;
};

export function isValidField(field: any): field is ModelFieldDef {
  if (!field || typeof field !== 'function') {
    return false;
  }

  const validProps = ['name', 'setName', 'setModel', '__type'];

  return (
    validProps.every((prop) => Object.keys(field).includes(prop)) &&
    field.__type.includes('ModelField')
  );
}
