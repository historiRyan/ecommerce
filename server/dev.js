import http from "http";
import dotenv from "dotenv";
import { handleRequest } from "./index.js";

try {
  dotenv.config();
} catch {
  // ignore: .env not found
}

const PORT = process.env.PORT || 4000;

http
  .createServer(async (req, res) => {
    const origin = `http://localhost:${PORT}`;
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) {
        headers[k] = Array.isArray(v) ? v.join(", ") : v;
      }
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
    const init = { method: req.method || "GET", headers };
    if (body && body.length > 0) init.body = body;
    const workerReq = new Request(origin + (req.url || "/"), init);

    const workerRes = await handleRequest(workerReq, process.env);

    const resHeaders = {};
    for (const [k, v] of workerRes.headers.entries()) {
      resHeaders[k] = v;
    }
    res.writeHead(workerRes.status, resHeaders);
    const buf = Buffer.from(await workerRes.arrayBuffer());
    res.end(buf);
  })
  .listen(PORT, () => {
    console.log(`Server JWT auth berjalan di http://localhost:${PORT}`);
  });
