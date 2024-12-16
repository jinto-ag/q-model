import {
    IEvent,
    IModelRegistryEvent,
} from './types';

export class Event implements IEvent {
  public name: string;
  private listners: ((...args: any[]) => void)[] = [];

  constructor(name: string) {
    this.name = name;
  }

  subscribe(callback: (...args: any[]) => void) {}
  unsubscribe() {}
  emit(args: any[]) {}
}

export class ModelRegistryEvent implements IModelRegistryEvent {
  readonly beforeRegister: IEvent = new Event('beforeRegister');
  readonly afterRegister: IEvent = new Event('afterRegister');
  readonly beforeOverwrite: IEvent = new Event('beforeOverwrite');
  readonly afterOverwrite: IEvent = new Event('afterOverwrite');
  readonly beforeModelRegister: IEvent = new Event('beforeModelRegister');
  readonly afterModelRegister: IEvent = new Event('afterModelRegister');

  private events: Record<string, IEvent> = {};
  private static instances: Record<string, ModelRegistryEvent> = {};
  private name: string;

  private constructor(name: string) {
    this.name = name;
  }

  static getInstance(name: string) {
    if (!this.instances[name]) {
      this.instances[name] = new ModelRegistryEvent(name);
    }

    return this.instances[name];
  }

  create(eventName: string) {
    this.events[eventName] = new Event(eventName);
    return this.events[eventName];
  }

  subscribe(eventName: string, callback: (...args: any[]) => void) {}

  unsubscribe(eventName: string) {}

  emit(eventName: string, args: any[]) {}

  getEvent(eventName: string) {
    return this.events[eventName];
  }
}
