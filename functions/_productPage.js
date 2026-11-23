export async function onRequest(context) {
  // Pages redirects /index.html back to /, so read the lab from / and
  // return it here without that redirect. The browser stays on /nimlo.
  const url = new URL(context.request.url);
  url.pathname = "/";
  const asset = await context.env.ASSETS.fetch(new Request(url, { method: "GET" }));
  const headers = new Headers(asset.headers);
  headers.delete("location");
  return new Response(asset.body, { status: 200, headers });
}
