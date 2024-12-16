import { z } from 'zod';
import {
  DefaultModelRegistry,
  ModelFactory,
  ModelFieldFactory
} from '../lib';

const Field = ModelFieldFactory(z.string());

const TestModel = ModelFactory({
  fields: {
    id: Field({ displayName: 'ID', visuallyHidden: true }),
    name: Field({ displayName: 'Name', name: 'no-name' }),
  },
  meta: {
    name: 'test-model',
    pluralName: 'test-models',
    displayField: 'name',
    pagination: { limit: 10 },
  },
});

describe('Model tests', () => {
  describe('Initialization', () => {
    const TestModel = ModelFactory({
      fields: { id: Field(), name: Field() },
      meta: { name: 'test-model', pluralName: 'test-models' },
    });

    it('checking model intialized correctly', () => {
      expect(TestModel).toHaveProperty('fields.id');
    });
  });

  it('checking model extend method', () => {
    const ExtendedModel = TestModel.extend({
      fields: { username: Field() },
      meta: { name: 'extended-model', pluralName: 'extended-models' },
    });

    expect(ExtendedModel).toHaveProperty('fields.username');
    expect(ExtendedModel).toHaveProperty('meta.name', 'extended-model');
    expect(ExtendedModel).toHaveProperty('meta.displayField', 'name');
    expect(ExtendedModel).toHaveProperty('meta.pagination.limit', 10);
  });

  it('checking model merge method', () => {
    const ExtendedModel = TestModel.extend({
      fields: { username: Field() },
      meta: { name: 'extended-model', pluralName: 'extended-models' },
    });

    const MergedModel = TestModel.merge([ExtendedModel], {
      name: 'merged-model',
      pluralName: 'merged-models',
    });

    expect(MergedModel).toHaveProperty('fields.username');
    expect(MergedModel).toHaveProperty('meta.name', 'merged-model');
  });

  it('checking model omit method', () => {
    const OmittedModel = TestModel.omit(['name'], {
      name: 'omitted-model',
      pluralName: 'omitted-models',
    });

    expect(OmittedModel).not.toHaveProperty('fields.name');
    expect(OmittedModel).toHaveProperty('meta.name', 'omitted-model');
    expect(OmittedModel).toHaveProperty('meta.displayField', 'name');
    expect(OmittedModel).toHaveProperty('meta.pagination.limit', 10);
  });

  it('checking model create method', () => {
    const NewModel = TestModel.create({
      fields: { id: Field(), name: Field() },
      meta: { name: 'new-model', pluralName: 'new-models' },
    });

    expect(NewModel).toHaveProperty('fields.name');
    expect(NewModel).toHaveProperty('meta.name', 'new-model');
    expect(NewModel).toHaveProperty('meta.pluralName', 'new-models');
  });

  describe('model instance initialization', () => {
    it('should create valid model instance', async () => {
      const testModel = TestModel(
        { id: 'ff', name: null },
        { name: { hidden: true, nullable: true, name: 'new-name' } },
      );

      expect(testModel.name.value).toBe(null);
      expect(testModel.name.hidden).toBe(true);
      expect(testModel.name.nullable).toBe(true);
      expect(testModel.id.visuallyHidden).toBe(true);
      expect(testModel).toHaveProperty('id');
      expect(testModel.name.getName()).toBe('new-name');

      expect(await testModel.validate()).toBe(true);
      expect(
        await TestModel.validate(
          { id: '', name: '' },
          { name: { nullable: true } },
        ),
      ).toBe(true);
    });

    it('should assign name for the field', () => {
      const testModel = TestModel({ id: 'ff', name: null });

      expect(TestModel.fields.id.getName()).toBe('id');
      expect(TestModel.fields.name.getName()).toBe('new-name');
      expect(testModel.id.getName()).toBe('id');
      expect(testModel.name.getName()).toBe('new-name');
    });
  });

  describe('checking model validation', () => {
    it('should validate non-nullable value', async () => {
      expect(
        await TestModel.validate(
          { id: '', name: '' },
          { name: { nullable: false } },
        ),
      ).toBe(true);
      expect(
        await TestModel.validate(
          { id: '', name: null },
          { name: { nullable: false } },
        ),
      ).toBe(false);
    });

    it('should validate nullable value', async () => {
      expect(
        await TestModel.validate(
          { id: '', name: null },
          { name: { nullable: true } },
        ),
      ).toBe(true);
      expect(
        await TestModel.validate(
          { id: '', name: '' },
          { name: { nullable: true } },
        ),
      ).toBe(true);
    });

    it('should validate optional and required value', async () => {
      expect(
        await TestModel.validate(
          { id: '', name: undefined },
          { name: { required: false } },
        ),
      ).toBe(true);
      expect(
        await TestModel.validate(
          { id: '', name: undefined },
          { name: { required: true } },
        ),
      ).toBe(false);
      expect(
        await TestModel.validate(
          { id: '', name: 'f' },
          { name: { required: true } },
        ),
      ).toBe(true);
      expect(
        await TestModel.validate(
          //@ts-expect-error testing invalid types
          { id: '', name: 2 },
          { name: { required: true } },
        ),
      ).toBe(false);
    });
  });

  const registry = DefaultModelRegistry;
  console.log({ models: registry.getAllModel() });
});
