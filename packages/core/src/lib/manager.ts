import { createCacheManager } from './cache/core';
import { FilterOperator } from './filter';
import {
    BaseKey,
    IModelManager,
    ModelDef,
    ModelFields,
    ModelInstance,
    ModelMeta,
    ModelQueryMode,
    ModelValues,
} from './types';

export class ModelManager<Fields extends ModelFields = any>
  implements IModelManager<Fields>
{
  public model: ModelDef<
    Fields,
    { abstract: false },
    ModelMeta<Fields, { abstract: false }>
  >;
  private cache = createCacheManager<
    ModelInstance<Fields> | ModelInstance<Fields>[]
  >();

  constructor(
    model: ModelDef<
      Fields,
      { abstract: false },
      ModelMeta<Fields, { abstract: false }>
    >,
  ) {
    this.model = model;
  }

  all(mode = ModelQueryMode.CACHE): Promise<ModelInstance<Fields>[]> {
    const key = this.model.meta.name;
    return this.cache.get(key) || [];
  }

  filter(
    filters: { field: keyof Fields; operator: FilterOperator; value: any }[],
    mode = ModelQueryMode.CACHE,
  ): Promise<ModelInstance<Fields>[]> {}

  create(
    value: Omit<ModelValues<Fields>, 'id'>,
    commit?: boolean,
  ): Promise<ModelInstance<Fields>> {}

  update(
    id: BaseKey,
    values: Partial<ModelValues<Fields>>,
    commit?: boolean,
  ): Promise<ModelInstance<Fields>> {}

  delete(id: BaseKey, commit?: boolean): Promise<void> {}
}
