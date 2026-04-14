import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth";
import { aiRouter } from "./routes/ai";
import { adminRouter } from "./routes/admin";
import { healthRouter } from "./routes/health";

dotenv.config();

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later." }
});
app.use(limiter);

const frontendOrigin = process.env.FRONTEND_ORIGIN;
app.use(
  cors({
    origin: frontendOrigin ? frontendOrigin.split(",").map((o) => o.trim()) : true,
    credentials: true,
  }),
);

app.use(express.json());
app.use("/api", healthRouter);
app.use("/api", aiRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
