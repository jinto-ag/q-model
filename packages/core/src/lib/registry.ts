import { ModelRegistryEvent } from './events';
import {
    IModelRegistry,
    ModelDef,
    ModelRegistryOptions,
} from './types';

export class ModelRegistry implements IModelRegistry {
  name: string;
  options: ModelRegistryOptions;
  events: ModelRegistryEvent;

  private models: Map<string, ModelDef> = new Map();
  private static instances: Map<string, ModelRegistry> = new Map();

  private constructor(name: string, options: ModelRegistryOptions) {
    this.options = options;
    this.name = name;
    this.events = ModelRegistryEvent.getInstance(name);
  }

  static getInstance(name: string, options: ModelRegistryOptions) {
    if (!this.instances.get(name)) {
      this.instances.set(name, new ModelRegistry(name, options));
    }

    return this.instances.get(name) as ModelRegistry;
  }

  register(name: string, model: ModelDef) {
    const doesModelExist = this.models.get(name);

    if (!this.options.allowOverwrite && doesModelExist) {
      throw new Error(
        `Model '${name}' already exists. If it is intended, enable allowOverwrite option`,
      );
    }

    this.models.set(name, model);
  }

  getModel<M extends ModelDef>(name: string) {
    return this.models.get(name) as M | undefined;
  }

  getAllModel() {
    return Object.fromEntries(this.models.entries());
  }

  clear() {
    this.models.clear();
  }
}

export const DefaultModelRegistry = ModelRegistry.getInstance('default', {
  allowOverwrite: true,
});
