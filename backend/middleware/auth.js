import jwt from "jsonwebtoken";

/** Requires a valid bearer token. Sets req.userId. */
export function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Sets req.userId if present, never rejects. */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;

  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
      req.userId = payload.userId;
    } catch {
      // A bad token just means anonymous here.
    }
  }

  next();
}
