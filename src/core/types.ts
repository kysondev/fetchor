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
};

export type EndpointDef<P = any, R = any> = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  parse?: (res: Response) => Promise<R>;
  description?: string;
  defaultParams?: P;
};

export type Query = Record<string, string | number | boolean | undefined>;

export type EndpointMap = Record<string, EndpointDef<any, any>>;

type PayloadOf<P> = { params?: P; body?: any };

export type FetchorClient<E extends EndpointMap = {}> = {
  define<Name extends string, P = any, R = any>(
    name: Name,
    options: EndpointDef<P, R>
  ): FetchorClient<E & Record<Name, EndpointDef<P, R>>>;

  define<Defs extends EndpointMap>(defs: Defs): FetchorClient<E & Defs>;
} & {
  [K in keyof E]: E[K] extends EndpointDef<infer P, infer R>
    ? (payload?: PayloadOf<P>, opts?: { query?: Query }) => Promise<R>
    : never;
};
