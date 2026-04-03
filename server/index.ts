// server/index.ts
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { clerkAuth, resolveBluxoUser } from "./middleware/clerk";
import { setupVite, serveStatic, log } from "./vite";

// Module routes
import webhookRoutes from "./modules/webhooks/routes";
import financeRoutes from "./modules/finance/routes";
import clientsRoutes from "./modules/clients/routes";
import settingsRoutes from "./modules/settings/routes";
import analyticsRoutes from "./modules/analytics/routes";

const app = express();

// CORS configuration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });

  next();
});

// Webhook routes MUST come before Clerk middleware (they verify their own signatures)
app.use(webhookRoutes);

// Clerk authentication middleware — applies to all routes after this
app.use(clerkAuth);

// Resolve Clerk user/org to our DB records for all /api routes
app.use("/api", resolveBluxoUser);

// Auth check endpoint
app.get("/api/auth/user", (req: any, res) => {
  if (!req.bluxoUser) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  res.json({
    user: req.bluxoUser,
    organization: req.bluxoOrg || null,
    membership: req.membership || null,
  });
});

// Register module routes
app.use(financeRoutes);
app.use(clientsRoutes);
app.use(settingsRoutes);
app.use(analyticsRoutes);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  throw err;
});

const server = createServer(app);

// Vite dev server or static serving
if (app.get("env") === "development") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

const port = parseInt(process.env.PORT || "5000", 10);
server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
  log(`serving on port ${port}`);
});
