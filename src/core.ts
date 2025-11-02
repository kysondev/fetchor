export type FetchorConfig = { baseURL?: string };

export function createFetchor(config: FetchorConfig = {}) {
  const endpoints: Record<string, any> = {};

  function define(name: string, options: any) {
    endpoints[name] = options;
  }

  return { define };
}
