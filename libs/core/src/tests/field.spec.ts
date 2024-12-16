import { z } from 'zod';
import { ModelFieldFactory } from '../lib';

describe('Model Field Tests', () => {
  describe('model field intialization', () => {
    const Field = ModelFieldFactory(z.string());

    it('should inititalize field properly', () => {
      const fieldInstance = Field({ name: 'test', default: 'test' });

      expect(fieldInstance.getName()).toBe('test');
      expect(fieldInstance.value).toBe('test');
    });
  });

  describe('model field validation', () => {
    const Field = ModelFieldFactory(z.string());

    it('should validate value', async () => {
      const fieldInstance = Field({ name: 'test' });
      expect(await fieldInstance.validate('test')).toBe(true);
    });

    it('should validate nullable value', async () => {
      const fieldInstance = Field({ name: 'test' });
      expect(await fieldInstance.validate(null, { nullable: true })).toBe(true);
      expect(
        //@ts-expect-error testing invalid value
        await fieldInstance.validate(undefined, {
          nullable: true,
          required: true,
        }),
      ).toBe(false);
      expect(await fieldInstance.validate(null, { nullable: false })).toBe(
        false,
      );
      expect(await fieldInstance.validate('null', { nullable: true })).toBe(
        true,
      );
      // @ts-expect-error testing invalid values
      expect(await fieldInstance.validate(2, { nullable: true })).toBe(false);
    });

    it('should validate optional value', async () => {
      const fieldInstance = Field({ name: 'test' });
      expect(await fieldInstance.validate(null, { required: true })).toBe(
        false,
      );
      expect(await fieldInstance.validate('null', { required: false })).toBe(
        true,
      );
      expect(await fieldInstance.validate('null', { required: true })).toBe(
        true,
      );
      // @ts-expect-error testing invalid values
      expect(await fieldInstance.validate(2, { required: true })).toBe(false);
    });

    it('should validate optional and nullable value', async () => {
      const fieldInstance = Field({ name: 'test' });
      expect(
        await fieldInstance.validate(null, { required: true, nullable: true }),
      ).toBe(true);
      expect(
        await fieldInstance.validate('null', {
          required: false,
          nullable: true,
        }),
      ).toBe(true);
      expect(
        await fieldInstance.validate('null', {
          required: true,
          nullable: true,
        }),
      ).toBe(true);
      expect(
        // @ts-expect-error testing invalid values
        await fieldInstance.validate(2, { required: true, nullable: true }),
      ).toBe(false);
    });
  });
});
