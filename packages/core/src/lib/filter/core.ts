import { FilterOperator } from './operators';

/**
 * Type to represent possible comparison values
 */
type ComparisonValue = any;

/**
 * Interface for custom comparison options
 */
interface ComparisonOptions {
  caseSensitive?: boolean;
  strict?: boolean;
}

/**
 * Advanced filtering utility for complex data comparisons
 */
export class FilterUtils {
  /**
   * Filters a collection of items based on specified filter criteria
   *
   * @param items - Array of items to be filtered
   * @param field - The field name to apply the filter on
   * @param operator - The filtering operator
   * @param comparisonValue - The value to compare against
   * @param options - Optional comparison configuration
   * @returns Filtered array of items
   */
  static filterItems<T>(
    items: T[],
    field: keyof T,
    operator: FilterOperator,
    comparisonValue: ComparisonValue,
    options: ComparisonOptions = {},
  ): T[] {
    const { caseSensitive = true, strict = true } = options;

    return items.filter((item) => {
      const fieldValue = item[field];
      return this.compareValues(fieldValue, comparisonValue, operator, {
        caseSensitive,
        strict,
      });
    });
  }

  /**
   * Compares values with enhanced logic and support for more complex scenarios
   *
   * @param value - The value to compare
   * @param comparisonValue - The value to compare against
   * @param operator - The operator defining the comparison logic
   * @param options - Comparison configuration options
   * @returns True if the comparison passes; otherwise, false
   */
  static compareValues(
    value: any,
    _comparisonValue: ComparisonValue,
    operator: FilterOperator,
    options: ComparisonOptions = {},
  ): boolean {
    // TODO: utilize the 'caseSensitive' option
    const { caseSensitive = true, strict = true } = options;

    let comparisonValue = _comparisonValue;
    if (
      /^(?:(?:\[(?:\[.*\]|.*)*\])|^(?:true|false|(?:"|')(?:\d+|\w+)(?:'|")))$/.exec(
        _comparisonValue,
      )
    ) {
      console.log('Regex match for the comparisonValue', _comparisonValue);

      try {
        comparisonValue = JSON.parse(
          _comparisonValue.replace(/'/, '"').replace(/'/, '"'),
        );
      } catch (error) {
        console.log('JSON parsing error: ', error);
      }
    }

    // Null and undefined handling
    const isNullOrUndefined = (val: any) => val === null || val === undefined;

    // Null-specific operators
    if (isNullOrUndefined(value)) {
      switch (operator) {
        case FilterOperator.NULL:
          return true;
        case FilterOperator.NNULL:
          return false;
        default:
          break;
      }
    }

    if (isNullOrUndefined(comparisonValue)) {
      switch (operator) {
        case FilterOperator.NULL:
          return false;
        case FilterOperator.NNULL:
          return true;
        default:
          break;
      }
    }

    // Type checking with optional strict mode
    const typeMatches = strict ? typeof value === typeof comparisonValue : true;

    if (
      !typeMatches &&
      operator !== FilterOperator.EQ &&
      operator !== FilterOperator.NE &&
      operator !== FilterOperator.IN
    ) {
      return false;
    }

    switch (operator) {
      // Equality checks
      case FilterOperator.EQ:
        return strict ? value === comparisonValue : value == comparisonValue;
      case FilterOperator.NE:
        return strict ? value !== comparisonValue : value != comparisonValue;

      // Numeric comparisons
      case FilterOperator.LT:
        return value < comparisonValue;
      case FilterOperator.GT:
        return value > comparisonValue;
      case FilterOperator.LTE:
        return value <= comparisonValue;
      case FilterOperator.GTE:
        return value >= comparisonValue;

      // Array operations
      case FilterOperator.IN:
        console.log(
          '🚀 ~ FilterUtils ~ comparisonValue:',
          comparisonValue,
          value,
        );
        if (Array.isArray(comparisonValue)) {
          return comparisonValue.some((val) =>
            Array.isArray(value) ? value.includes(val) : value === val,
          );
        }
        return Array.isArray(value)
          ? value.includes(comparisonValue)
          : value === comparisonValue;

      case FilterOperator.NIN:
        if (Array.isArray(comparisonValue)) {
          if (value === null || value === undefined) {
            return true;
          }
          return !comparisonValue.some((val) =>
            Array.isArray(value) ? value.includes(val) : value === val,
          );
        }
        if (Array.isArray(value)) {
          return !value.includes(comparisonValue);
        }
        return value !== comparisonValue;

      // String-specific operations
      case FilterOperator.CONTAINS:
        return (
          typeof value === 'string' &&
          typeof comparisonValue === 'string' &&
          value.includes(comparisonValue)
        );

      case FilterOperator.CONTAINSS:
        return (
          typeof value === 'string' &&
          typeof comparisonValue === 'string' &&
          value.toLowerCase().includes(comparisonValue.toLowerCase())
        );

      case FilterOperator.NCONTAINS:
        return (
          typeof value === 'string' &&
          typeof comparisonValue === 'string' &&
          !value.includes(comparisonValue)
        );

      case FilterOperator.STARTS_WITH:
        return (
          typeof value === 'string' &&
          typeof comparisonValue === 'string' &&
          value.startsWith(comparisonValue)
        );

      case FilterOperator.STARTS_WITHS:
        return (
          typeof value === 'string' &&
          typeof comparisonValue === 'string' &&
          value.toLowerCase().startsWith(comparisonValue.toLowerCase())
        );

      case FilterOperator.NSTARTS_WITH:
        return (
          typeof value === 'string' &&
          typeof comparisonValue === 'string' &&
          !value.startsWith(comparisonValue)
        );

      case FilterOperator.ENDS_WITH:
        return (
          typeof value === 'string' &&
          typeof comparisonValue === 'string' &&
          value.endsWith(comparisonValue)
        );

      case FilterOperator.NENDS_WITH:
        return (
          typeof value === 'string' &&
          typeof comparisonValue === 'string' &&
          !value.endsWith(comparisonValue)
        );

      case FilterOperator.ENDS_WITHS:
        return (
          typeof value === 'string' &&
          typeof comparisonValue === 'string' &&
          value.toLowerCase().endsWith(comparisonValue.toLowerCase())
        );

      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  /**
   * Complex multi-condition filtering
   *
   * @param items - Array of items to filter
   * @param conditions - Array of filtering conditions
   * @returns Filtered array of items
   */
  static multiFilter<T>(
    items: T[],
    conditions: Array<{
      field: keyof T;
      operator: FilterOperator;
      value: ComparisonValue;
      options?: ComparisonOptions;
    }>,
  ): T[] {
    return items.filter((item) =>
      conditions.every((condition) =>
        this.compareValues(
          item[condition.field],
          condition.value,
          condition.operator,
          condition.options,
        ),
      ),
    );
  }
}
