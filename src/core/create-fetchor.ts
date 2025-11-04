import { FetchorError } from "./error";
import { EndpointDef, FetchorClient, FetchorConfig } from "./types";
import { withParams, withQuery } from "./utils";

export function createFetchor<
  E extends Record<string, EndpointDef<any, any>> = {}
>(config: FetchorConfig = {}): FetchorClient<E> {
  const endpoints: Record<string, EndpointDef<any, any>> = {};

  function define<Name extends string, P = any, R = any>(
    name: Name,
    options: EndpointDef<P, R>
  ): any;
  function define<Defs extends Record<string, EndpointDef<any, any>>>(
    defs: Defs
  ): any;
  function define(arg1: any, arg2?: any): any {
    if (typeof arg1 === "string") {
      endpoints[arg1] = arg2;
    } else if (arg1 && typeof arg1 === "object") {
      for (const [k, v] of Object.entries(arg1)) {
        endpoints[k] = v as EndpointDef<any, any>;
      }
    }
    return client as any;
  }

  const client = new Proxy({} as FetchorClient, {
    get(_, prop: string) {
      if (prop === "define") return define;
      const ep = endpoints[prop];
      if (!ep) throw new Error(`Unknown endpoint: ${prop}`);

      return async (payload?: any, opts?: any): Promise<any> => {
        const base = config.baseURL ?? "";
        let final = withParams(ep.url, payload?.params);
        final = withQuery(final, opts?.query);

        const init: RequestInit = {
          method: ep.method ?? "GET",
          headers:
            typeof config.headers === "function"
              ? config.headers()
              : config.headers ?? { "Content-Type": "application/json" },
        };

        if (
          ["POST", "PUT", "PATCH"].includes(init.method!) &&
          payload?.body !== undefined
        ) {
          init.body = JSON.stringify(payload.body);
        }

        const url = base + final;

        try {
          // onRequest hook
          await config.onRequest?.({
            endpoint: prop,
            url,
            options: init,
            payload,
          });

          const res = await fetch(url, init);

          // onResponse hook
          await config.onResponse?.({
            endpoint: prop,
            url,
            options: init,
            response: res,
          });

          if (!res.ok) {
            let body: any;
            try {
              body = await res.json();
            } catch {
              body = await res.text();
            }

            const err = new FetchorError(
              body?.message || `Request failed with ${res.status}`,
              res.status,
              body
            );
            await config.onError?.(err, { endpoint: prop, url, options: init });
            throw err;
          }

          return ep.parse ? await ep.parse(res) : res.json();
        } catch (err) {
          // onError hook
          await config.onError?.(err as Error, {
            endpoint: prop,
            url,
            options: init,
          });
          throw err;
        }
      };
    },
  });

  return client as unknown as FetchorClient<E>;
}
