type QueryKeyPrimitive = string | number | boolean | null;

export type QueryKeyParams = Record<string, QueryKeyPrimitive | undefined>;

const normalizeParams = (params?: QueryKeyParams) => {
  if (!params) {
    return {};
  }

  return Object.keys(params)
    .sort()
    .reduce<Record<string, QueryKeyPrimitive>>((acc, key) => {
      const value = params[key];
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
};

export const queryKeys = {
  analytics: {
    all: ['analytics'] as const,
    overviewScope: (scope: string) => ['analytics', 'overview', scope] as const,
    overview: (scope: string, params?: QueryKeyParams) =>
      ['analytics', 'overview', scope, normalizeParams(params)] as const,
    structuredQuery: (metric: string, dimension: string, filters?: QueryKeyParams) =>
      ['analytics', 'structured', metric, dimension, normalizeParams(filters)] as const,
  },
  entities: {
    all: ['entities'] as const,
    modulesList: (params?: QueryKeyParams) => ['entities', 'modules', 'list', normalizeParams(params)] as const,
    modulesTrainer: () => ['entities', 'modules', 'trainer'] as const,
    groupsList: (params?: QueryKeyParams) => ['entities', 'groups', 'list', normalizeParams(params)] as const,
    usersByRole: (role: string) => ['entities', 'users', role] as const,
    parentStagiaires: () => ['entities', 'parent', 'stagiaires'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    userScope: (userKey: QueryKeyPrimitive) => ['notifications', 'user', userKey] as const,
    list: (userKey: QueryKeyPrimitive, params?: QueryKeyParams) =>
      ['notifications', 'user', userKey, 'list', normalizeParams(params)] as const,
    unread: (userKey: QueryKeyPrimitive) => ['notifications', 'user', userKey, 'unread'] as const,
  },
};
