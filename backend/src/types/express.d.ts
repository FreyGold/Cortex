import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string | null;
      accessToken: string;
    };
    authDuration?: number;
  }
}
