const fs = require('fs');
let c = fs.readFileSync('backend/src/server.ts','utf8');

const oldBlock = '  // Rate limiting\n  const clientIp = getRateLimitKey(req, "global");\n  if (req.method === "POST" && pathname === "/submissions") {\n    const limit = checkRateLimit(clientIp + ":submissions", 10, 60_000);\n    if (!limit.allowed) {\n      sendJson(res, 429, { ok: false, error: "Terlalu banyak permintaan. Coba lagi nanti." });\n      return;\n    }\n  }\n\n  if (isWriteMethod(req.method) && !isPublicSubmissionCreate(pathname, req.method)) {\n    const limit = checkRateLimit(clientIp + ":admin", 100, 60_000);\n    if (!limit.allowed) {\n      sendJson(res, 429, { ok: false, error: "Terlalu banyak permintaan. Coba lagi nanti." });\n      return;\n    }\n  }\n\n  const requestUrl = new URL(req.url ?? "/", "http://localhost");\n  const pathname = requestUrl.pathname;';

const newBlock = '  const requestUrl = new URL(req.url ?? "/", "http://localhost");\n  const pathname = requestUrl.pathname;\n\n  // Rate limiting\n  const clientIp = getRateLimitKey(req, "global");\n  if (req.method === "POST" && pathname === "/submissions") {\n    const limit = checkRateLimit(clientIp + ":submissions", 10, 60_000);\n    if (!limit.allowed) {\n      sendJson(res, 429, { ok: false, error: "Terlalu banyak permintaan. Coba lagi nanti." });\n      return;\n    }\n  }\n\n  if (isWriteMethod(req.method) && !isPublicSubmissionCreate(pathname, req.method)) {\n    const limit = checkRateLimit(clientIp + ":admin", 100, 60_000);\n    if (!limit.allowed) {\n      sendJson(res, 429, { ok: false, error: "Terlalu banyak permintaan. Coba lagi nanti." });\n      return;\n    }\n  }';

if (c.includes(oldBlock)) {
  c = c.replace(oldBlock, newBlock);
  fs.writeFileSync('backend/src/server.ts', c, 'utf8');
  console.log('Reordered successfully');
} else {
  console.log('Old block not found');
}
