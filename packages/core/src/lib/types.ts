import { z } from 'zod';

export enum Casing {
  SNAKE_CASE = 'snakeCase',
  CAMEL_CASE = 'camelCase',
  KEBAB_CASE = 'kebabCase',
}

export type BaseKey = string | number;

/**
 * Base Event
 */
export interface IEvent {
  subscribe: (callback: (...args: any[]) => void) => void;
  unsubscribe: () => void;
  emit: (args: any[]) => void;
}

export interface CustomEvent {
  create: (eventName: string) => IEvent; // add custom event
  subscribe: (eventName: string, callback: (...args: any[]) => void) => void;
  unsubscribe: (eventName: string) => void;
  emit: (eventName: string, args: any[]) => void;

  //helper methods
  getEvent: (eventName: string) => IEvent;
}

export interface IModelRegistryEvent extends CustomEvent {
  //global events
  readonly beforeRegister: IEvent;
  readonly afterRegister: IEvent;
  readonly beforeOverwrite: IEvent;
  readonly afterOverwrite: IEvent;

  //specific model events
  readonly beforeModelRegister: IEvent;
  readonly afterModelRegister: IEvent;
}

export interface IModelFieldEvent extends CustomEvent {
  readonly beforeInit: IEvent;
  readonly afterInit: IEvent;
  readonly beforeSetModel: IEvent;
  readonly afterSetModel: IEvent;
  readonly beforeSetName: IEvent;
  readonly afterSetName: IEvent;
  readonly beforeValidate: IEvent;
  readonly afterValidate: IEvent;
}

export interface IModelEvent extends CustomEvent {
  readonly beforeInit: IEvent;
  readonly afterInit: IEvent;
  readonly beforeRegister: IEvent;
  readonly afterRegister: IEvent;

  // crud operation
  readonly beforeCreate: IEvent;
  readonly afterCreate: IEvent;
  readonly beforeUpdate: IEvent;
  readonly afterUpdate: IEvent;
  readonly beforeDelete: IEvent;
  readonly afterDelete: IEvent;
}

export interface ModelFieldOptions<T extends any = any> {
  name?: string;
  required?: boolean;
  readOnly?: boolean;
  nullable?: boolean;
  default?: T | null | (() => T | null);
  displayName?: string;
  validators?: ((value: T | null) => boolean)[];
  order?: number;
  hidden?: boolean;
  visuallyHidden?: boolean;
  compute?: <F extends ModelFields>(model: ModelValues<F>) => any;
}

// instance of ModelField
export type ModelFieldInstance<
  T extends any = any,
  Options extends ModelFieldOptions<T> = ModelFieldOptions<T>,
  M extends ModelDef = ModelDef,
> = (ModelFieldOptions<T> & Options) & {
  value: T | null;
  model: M;

  // methods
  validate: (options?: ModelFieldOptions<T> & Options) => Promise<boolean>;
  getName: () => string;
};

// model field definition
export type ModelFieldDef<
  Type extends any = any,
  Options extends ModelFieldOptions<Type> = ModelFieldOptions<Type>,
  M extends ModelDef = ModelDef,
> = ((
  value: Type | null,
  options?: Partial<ModelFieldOptions<Type> & Options>,
) => ModelFieldInstance<Type, ModelFieldOptions<Type> & Options, M>) &
  (ModelFieldOptions<Type> & Options) & {
    options: ModelFieldOptions<Type> & Options;
    value: Type | null;
    events: IModelFieldEvent;
    schema: z.ZodType<Type | null, any>;
    model: M;

    //static methods
    validate: (
      value: Type | null,
      options?: ModelFieldOptions<Type> & Options,
    ) => Promise<boolean>;
    setName: (name: string) => void;
    setModel: (model: M) => void;
    getName: () => string;
  };

export type ModelFields = { id?: ModelFieldDef } & Record<
  string,
  ModelFieldDef
>;

// model types
type BaseModelMeta<Fields extends ModelFields = any> = {
  name: string;
  pluralName: string; // this for apis
  description?: string;
  displayField?: keyof Fields;
  displayName?: string;
  order?: (keyof Fields)[];
  indices?: (keyof Fields | (keyof Fields)[])[];
  casing?: Casing; // field casing
  singularName?: string;
  pagination?: {
    limit?: number; // default limit
  };
};

export type ModelMeta<
  Fields extends ModelFields = any,
  T extends { abstract?: boolean } = any,
> = T['abstract'] extends true
  ? Omit<BaseModelMeta<Fields>, 'name'> & { abstract: true }
  : BaseModelMeta<Fields> & { abstract?: false };

/**
 * Model Registry
 */

export interface ModelRegistryOptions {
  defaultRegistry?: string;
  allowOverwrite?: boolean;
}

export interface IModelRegistry {
  name: string;
  options: ModelRegistryOptions;
  events: IModelRegistryEvent;

  // methods
  register: (name: string, model: ModelDef) => void;
  getModel: <M extends ModelDef>(name: string) => M | undefined;
  getAllModel: () => Record<string, ModelDef>;
  clear: () => void;
}

/**
 * Model Manager
 */
export interface IModelManager<
  Fields extends ModelFields = any,
  T extends { abstract?: boolean } = any,
> {
  model: ModelDef<Fields, T>;

  //methods
  all: () => Promise<ModelInstance<Fields>[]>;
  filter: (
    filters: { field: keyof Fields; operator: string; value: any }[],
  ) => Promise<ModelInstance<Fields>[]>;
  create: (
    value: Omit<ModelValues<Fields>, 'id'>,
    commit?: boolean,
  ) => Promise<ModelInstance<Fields>>;
  update: (
    id: BaseKey,
    values: PartialModelValues<Fields>,
    commit?: boolean,
  ) => Promise<ModelInstance<Fields>>;
  delete: (id: BaseKey, commit?: boolean) => Promise<void>;
}

export type ModelValues<Fields extends ModelFields = any> = {
  [key in keyof Fields]: Fields[key]['required'] extends true
    ? Fields[key]['value']
    : Fields[key]['value'] | undefined;
};

export type ModelFieldsOptions<Fields extends ModelFields = any> = {
  [key in keyof Fields]: Fields[key]['options'];
};

export type PartialModelValues<Fields extends ModelFields = any> = Partial<
  ModelValues<Fields>
>;

export type ModelInstance<Fields extends ModelFields = any> = {
  [key in keyof Fields]: ModelFieldInstance<
    Fields[key]['value'],
    Fields[key]['options']
  >;
} & {
  validate: () => Promise<boolean>;
  save: (commit?: boolean) => Promise<ModelInstance<Fields>>;
  update: (
    values: PartialModelValues<Fields>,
    commit?: boolean,
  ) => Promise<ModelInstance<Fields>>;
  delete: (commit?: boolean) => Promise<void>;
};

export type OmittedFields<
  Fields extends ModelFields,
  K extends keyof Fields,
> = Omit<Fields, K>;

export type ModelDef<
  Fields extends ModelFields = any,
  T extends { abstract?: boolean } = any,
  Meta extends ModelMeta<Fields, T> = any,
> = {
  meta: Meta;
  fields: Fields;
  objects: T['abstract'] extends false ? IModelManager<Fields, T> : never;
  registry: IModelRegistry;
  events: IModelEvent;

  // static methods
  extend: <
    NewFields extends ModelFields,
    NewT extends { abstract?: boolean } = any,
    NewMeta extends ModelMeta<NewFields, NewT> = any,
  >(params: {
    fields: NewFields;
    meta: NewMeta;
  }) => ModelDef<Fields & NewFields, NewT, Meta & NewMeta>;

  merge: <
    MD extends ModelDef[] = ModelDef[],
    MT extends { abstract?: boolean } = any,
    NewMeta extends ModelMeta<MD[number]['fields'], MT> = any,
  >(
    models: MD,
    meta: NewMeta,
  ) => ModelDef<MD[number]['fields'], MT, Meta & MD[number]['meta'] & NewMeta>;

  omit: <
    OmitFieldKeys extends keyof Fields,
    NewT extends { abstract?: boolean } = any,
    NewMeta extends ModelMeta<OmittedFields<Fields, OmitFieldKeys>, NewT> = any,
  >(
    fields: OmitFieldKeys[],
    meta: NewMeta,
  ) => ModelDef<OmittedFields<Fields, OmitFieldKeys>, NewT, NewMeta>;

  create: <
    NewFields extends ModelFields,
    NewT extends { abstract?: boolean } = any,
    NewMeta extends ModelMeta<NewFields, NewT> = any,
  >(params: {
    fields: NewFields;
    meta: NewMeta;
  }) => ModelDef<NewFields, NewT, NewMeta>;

  validate: <F extends Fields>(
    values: ModelValues<Fields>,
    options?: Partial<ModelFieldsOptions<F>>,
  ) => Promise<boolean>;

  //helper methods
  getField: <K extends string>(name: K) => Fields[K];
  getFieldNames: () => (keyof Fields)[];
  isValidField: (field: ModelFieldDef) => boolean; // check the given field is valid in this model
} & (<F extends Fields>(
  values: ModelValues<F>,
  options?: Partial<ModelFieldsOptions<F>>,
) => ModelInstance<F>);
