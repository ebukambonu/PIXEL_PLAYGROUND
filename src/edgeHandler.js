const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-client-info",
  "Cache-Control": "no-store",
};

function verificationPage(token) {
  return String.raw`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verify Pixel Playground</title></head>
  <body style="background:#101015;color:#f2f1f6;font:16px system-ui;padding:30px;max-width:500px;margin:auto">
  <h1>Verify your account</h1><p>Sign in to the account that requested this verification email.</p>
  <form id="form"><label>Email <input id="email" type="email" autocomplete="username" required></label><br><br>
  <label>Password <input id="password" type="password" autocomplete="current-password" required></label><br><br>
  <button>Sign in and verify</button></form><p id="message" role="status"></p>
  <script>const token=${JSON.stringify(token)};
  document.getElementById('form').onsubmit=async(e)=>{e.preventDefault();const message=document.getElementById('message');message.textContent='Verifying…';
  try{const base=location.pathname.replace(/\/api\/verify$/, '');
  const login=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('email').value,password:document.getElementById('password').value})});
  const data=await login.json();if(!login.ok)throw new Error(data.error);
  const verify=await fetch(base+'/api/verify?token='+token,{headers:{Authorization:'Bearer '+data.sessionToken}});const result=await verify.json();if(!verify.ok)throw new Error(result.error);
  message.textContent='Email verified! Return to Google Sites and sign in to use your account.';document.getElementById('form').hidden=true;
  }catch(error){message.textContent=error.message||'Please try again.';}};</script></body></html>`;
}

export function createEdgeHandler(load) {
  let backend;
  return async function edgeHandler(request) {
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    const apiIndex = url.pathname.indexOf("/api/");
    if (apiIndex < 0)
      return Response.json(
        { error: "Use an /api/ endpoint." },
        { status: 404, headers: CORS },
      );
    const pathname = url.pathname.slice(apiIndex);
    const auth = request.headers.get("authorization") || "";
    const token = auth.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (pathname === "/api/verify" && request.method === "GET" && !token) {
      const verification = url.searchParams.get("token");
      if (!/^[a-f0-9]{64}$/.test(verification || ""))
        return Response.json(
          { error: "Invalid verification link." },
          { status: 400, headers: CORS },
        );
      return new Response(verificationPage(verification), {
        headers: {
          ...CORS,
          "Content-Type": "text/html; charset=utf-8",
          "Referrer-Policy": "no-referrer",
        },
      });
    }
    try {
      const raw = ["GET", "HEAD"].includes(request.method)
        ? ""
        : await request.text();
      if (new TextEncoder().encode(raw).length > 128000)
        return Response.json(
          { error: "Request too large." },
          { status: 413, headers: CORS },
        );
      const headers = Object.fromEntries(request.headers.entries());
      // This API uses explicit bearer tokens, never ambient cross-site cookies.
      delete headers.cookie;
      delete headers.origin;
      headers.host = url.host;
      if (token) headers.cookie = `pixel_session=${token}`;
      const req = {
        method: request.method,
        url: pathname + url.search,
        headers,
        socket: {
          remoteAddress:
            headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown",
        },
        async *[Symbol.asyncIterator]() {
          if (raw) yield raw;
        },
      };
      let status = 200,
        output = "",
        responseHeaders = { ...CORS };
      const res = {
        writableEnded: false,
        setHeader(key, value) {
          responseHeaders[key.toLowerCase()] = value;
        },
        writeHead(code, extra = {}) {
          status = code;
          for (const [key, value] of Object.entries(extra))
            this.setHeader(key, value);
        },
        end(value = "") {
          output = value;
          this.writableEnded = true;
        },
      };
      backend ||= load().catch((error) => {
        backend = undefined;
        throw error;
      });
      await (await backend).requestHandler(req, res);
      const cookie = responseHeaders["set-cookie"];
      if (cookie) {
        const session = cookie.match(/pixel_session=([a-f0-9]*)/)[1];
        const data = JSON.parse(output);
        data.sessionToken = session || null;
        output = JSON.stringify(data);
        delete responseHeaders["set-cookie"];
      }
      if (status === 302 && pathname === "/api/verify") {
        status = 200;
        delete responseHeaders.location;
        output = JSON.stringify({ verified: true });
      }
      return new Response(output, { status, headers: responseHeaders });
    } catch (error) {
      console.error(
        "Edge API initialization failed:",
        error.code || error.name,
      );
      return Response.json(
        { error: "Service unavailable. Check Supabase database settings." },
        { status: 503, headers: CORS },
      );
    }
  };
}
