// One Node function serves every API route; Vercel serves the built UI separately.
export function createHandler(load = () => import("../server.js")) {
  let backend;
  return async function handler(req, res) {
    try {
      const url = new URL(req.url, "http://localhost");
      const route = url.searchParams.get("__route");
      if (route !== null) {
        if (!/^[a-zA-Z0-9/_-]*$/.test(route)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid API route." }));
          return;
        }
        url.pathname = "/api/" + route;
        url.searchParams.delete("__route");
        req.url = url.pathname + url.search;
      }
      // Failed initialization can retry; do not cache a rejected promise.
      backend ||= load().catch((error) => {
        backend = undefined;
        throw error;
      });
      const { requestHandler } = await backend;
      await requestHandler(req, res);
    } catch (error) {
      console.error("API initialization failed:", error.name);
      if (!res.writableEnded) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            error:
              "Service unavailable. Check the hosting database configuration.",
          }),
        );
      }
    }
  };
}
export default createHandler();
