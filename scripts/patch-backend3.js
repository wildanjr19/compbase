const fs = require('fs');
const content = fs.readFileSync('backend/src/server.ts','utf8');
if (content.includes('const clientIp = getRateLimitKey')) {
  console.log('Body already patched');
  process.exit(0);
}
const marker = '  if (req.method === "OPTIONS") {\n    res.writeHead(204);\n    res.end();\n    return;\n  }';
const inject = '\n  // Rate limiting\n  const clientIp = getRateLimitKey(req, "global");\n  if (req.method === "POST" && pathname === "/submissions") {\n    const limit = checkRateLimit(clientIp + ":submissions", 10, 60_000);\n    if (!limit.allowed) {\n      sendJson(res, 429, { ok: false, error: "Terlalu banyak permintaan. Coba lagi nanti." });\n      return;\n    }\n  }\n\n  if (isWriteMethod(req.method) && !isPublicSubmissionCreate(pathname, req.method)) {\n    const limit = checkRateLimit(clientIp + ":admin", 100, 60_000);\n    if (!limit.allowed) {\n      sendJson(res, 429, { ok: false, error: "Terlalu banyak permintaan. Coba lagi nanti." });\n      return;\n    }\n  }';

if (!content.includes(marker)) {
  console.log('Marker not found');
  process.exit(1);
}

const updated = content.replace(marker, marker + inject);
fs.writeFileSync('backend/src/server.ts', updated, 'utf8');
console.log('Patched successfully');
