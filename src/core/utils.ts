// Replace :param in the path with values.
export function withParams(
  url: string,
  params?: Record<string, string | number>
) {
  if (!params) return url;
  let u = url;
  for (const [k, v] of Object.entries(params)) {
    u = u.replace(`:${k}`, encodeURIComponent(String(v)));
  }
  return u;
}

// Add ?key=value to the URL, skip undefined.
export function withQuery(
  url: string,
  query?: Record<string, string | number | boolean | undefined>
) {
  if (!query) return url;
  const q = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");
  return q ? `${url}${url.includes("?") ? "&" : "?"}${q}` : url;
}
