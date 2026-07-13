/// <reference path="./types/express.d.ts" />
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import { authRouter } from "./routes/auth";
import { aiRouter } from "./routes/ai";
import { adminRouter } from "./routes/admin";
import { healthRouter } from "./routes/health";
import { profileRouter } from "./routes/profile";
import { dataRouter } from "./routes/data";
import { notesRouter } from "./routes/notes";
import { dailyRouter } from "./routes/daily";

dotenv.config();

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increase limit for development/testing
  message: { error: "Too many requests from this IP, please try again later." }
});
app.use(limiter);

const frontendOrigin = process.env.FRONTEND_ORIGIN;
const allowedOrigins = frontendOrigin ? frontendOrigin.split(",").map((o) => o.trim()) : [];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("chrome-extension://")) {
        callback(null, true);
      } else {
        callback(null, allowedOrigins.length > 0 ? false : true);
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const authDuration = req.authDuration ? ` (auth: ${req.authDuration}ms)` : "";
    const logEntry = `[${new Date().toISOString().split("T")[1].split(".")[0]}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms${authDuration}\n`;
    console.log(logEntry.trim());
    try {
      fs.appendFileSync("/tmp/backend.log", logEntry);
    } catch (e) {
      // ignore
    }
  });
  next();
});
app.use("/api", healthRouter);
app.use("/api/ai", aiRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/profile", profileRouter);
app.use("/api/data", dataRouter);
app.use("/api/notes", notesRouter);
app.use("/api/daily", dailyRouter);

const port = Number(process.env.PORT ?? 4000);

// Only start the HTTP server when running locally (not on Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });
}

export default app;
