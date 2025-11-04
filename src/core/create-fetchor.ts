import { FetchorError } from "./error";
import { FetchorClient, FetchorConfig, GroupBuilder, MutCall, GetCall, ParseFn } from "./types";
import { withParams, withQuery } from "./utils";

export function createFetchor(config: FetchorConfig = {}): FetchorClient {
  const client = new Proxy({} as FetchorClient, {
    get(_, prop: string) {
      if (prop === "group") {
        const group = (base: string): GroupBuilder => {
          const coreCall = async (
            method: string,
            path: string,
            args: any,
            parse?: ParseFn<any>
          ) => {
            const endpoint = `${method} ${base}${path}`;
            const urlPath = withParams(base + path, args?.params);
            const url = withQuery((config.baseURL ?? "") + urlPath, args?.query);

            const headersFromConfig =
              typeof config.headers === "function"
                ? config.headers()
                : config.headers ?? { "Content-Type": "application/json" };

            const init: RequestInit = {
              method: method as any,
              headers: {
                ...headersFromConfig,
                ...(args?.headers ?? {}),
              },
            };

            if (
              ["POST", "PUT", "PATCH"].includes((init.method || "GET").toUpperCase()) &&
              args?.body !== undefined
            ) {
              init.body = JSON.stringify(args.body);
            }

            try {
              await config.onRequest?.({ endpoint, url, options: init, payload: args });

              const res = await fetch(url, init);

              await config.onResponse?.({ endpoint, url, options: init, response: res });

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
                await config.onError?.(err, { endpoint, url, options: init });
                throw err;
              }

              return parse ? await parse(res) : await res.json();
            } catch (err) {
              await config.onError?.(err as Error, { endpoint, url, options: init });
              throw err;
            }
          };

          const buildGet = <P = any, R = any>(
            method: "GET" | "DELETE",
            path: string,
            parse?: ParseFn<R>
          ) => {
            return (args?: GetCall<P> & { headers?: Record<string, string> }) =>
              coreCall(method, path, args, parse) as Promise<R>;
          };

          const buildMut = <B = any, R = any>(
            method: "POST" | "PUT" | "PATCH",
            path: string,
            parse?: ParseFn<R>
          ) => {
            return (args?: MutCall<B> & { headers?: Record<string, string> }) =>
              coreCall(method, path, args, parse) as Promise<R>;
          };

          const builder: GroupBuilder = {
            get: (path: string, opts?: { parse?: ParseFn<any> }) =>
              buildGet("GET", path, opts?.parse),
            delete: (path: string, opts?: { parse?: ParseFn<any> }) =>
              buildGet("DELETE", path, opts?.parse),
            post: (path: string, opts?: { parse?: ParseFn<any> }) =>
              buildMut("POST", path, opts?.parse),
            put: (path: string, opts?: { parse?: ParseFn<any> }) =>
              buildMut("PUT", path, opts?.parse),
            patch: (path: string, opts?: { parse?: ParseFn<any> }) =>
              buildMut("PATCH", path, opts?.parse),
          };
          return builder;
        };
        return group;
      }
      throw new Error(`Unknown property: ${String(prop)}`);
    },
  });

  return client as FetchorClient;
}
