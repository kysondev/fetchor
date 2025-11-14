export type FetchorConfig = {
  baseURL?: string;
  headers?: Record<string, string> | (() => Record<string, string>);
  onRequest?: (ctx: {
    endpoint: string;
    url: string;
    options: RequestInit;
    payload: unknown;
  }) => void | Promise<void>;
  onResponse?: (ctx: {
    endpoint: string;
    url: string;
    options: RequestInit;
    response: Response;
  }) => void | Promise<void>;
  onError?: (
    err: Error,
    ctx: { endpoint: string; url: string; options: RequestInit }
  ) => void | Promise<void>;
  retry?: {
    attempts?: number;
    delay?: number;
    backoff?: boolean;
  };
};

export type Query = Record<string, string | number | boolean | undefined>;

export type ParseFn<R> = (res: Response) => Promise<R>;

export type GetCall<P = any> = {
  params?: P;
  query?: Query;
  retry?: false | { attempts?: number; delay?: number; backoff?: boolean };
};
export type MutCall<B = any> = {
  body?: B;
  params?: Record<string, string | number>;
  query?: Query;
  retry?: false | { attempts?: number; delay?: number; backoff?: boolean };
};

export type GroupBuilder = {
  get<P = any, R = any>(
    path: string,
    opts?: { parse?: ParseFn<R> }
  ): (args?: GetCall<P> & { headers?: Record<string, string> }) => Promise<R>;
  delete<P = any, R = any>(
    path: string,
    opts?: { parse?: ParseFn<R> }
  ): (args?: GetCall<P> & { headers?: Record<string, string> }) => Promise<R>;
  post<B = any, R = any>(
    path: string,
    opts?: { parse?: ParseFn<R> }
  ): (args?: MutCall<B> & { headers?: Record<string, string> }) => Promise<R>;
  put<B = any, R = any>(
    path: string,
    opts?: { parse?: ParseFn<R> }
  ): (args?: MutCall<B> & { headers?: Record<string, string> }) => Promise<R>;
  patch<B = any, R = any>(
    path: string,
    opts?: { parse?: ParseFn<R> }
  ): (args?: MutCall<B> & { headers?: Record<string, string> }) => Promise<R>;
};

export type FetchorClient = {
  /** Create a grouped route builder. */
  group(base: string): GroupBuilder;
};
