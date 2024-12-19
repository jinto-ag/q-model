export enum FilterOperator {
  EQ = 'eq', // Equal to
  NE = 'ne', // Not equal to
  LT = 'lt', // Less than
  GT = 'gt', // Greater than
  LTE = 'lte', // Less than or equal to
  GTE = 'gte', // Greater than or equal to
  IN = 'in', // Contained in a list
  NIN = 'nin', // Not contained in a list
  INA = 'ina', // Value is in an array
  NINA = 'nina', // Value is not in an array
  CONTAINS = 'contains', // String contains
  NCONTAINS = 'ncontains', // String does not contain
  CONTAINSS = 'containss', // Case-insensitive string contains
  NCONTAINSS = 'ncontainss', // Case-insensitive string does not contain
  BETWEEN = 'between', // Between two values
  NBETWEEN = 'nbetween', // Not between two values
  NULL = 'null', // Value is null
  NNULL = 'nnull', // Value is not null
  STARTS_WITH = 'startswith', // String starts with
  NSTARTS_WITH = 'nstartswith', // String does not start with
  STARTS_WITHS = 'startswiths', // Case-insensitive starts with
  NSTARTS_WITHS = 'nstartswiths', // Case-insensitive does not start with
  ENDS_WITH = 'endswith', // String ends with
  NENDS_WITH = 'nendswith', // String does not end with
  ENDS_WITHS = 'endswiths', // Case-insensitive ends with
  NENDS_WITHS = 'nendswiths', // Case-insensitive does not end with
  OR = 'or', // Logical OR
  AND = 'and', // Logical AND
}

export type LogicalOperator = FilterOperator.AND | FilterOperator.OR;
