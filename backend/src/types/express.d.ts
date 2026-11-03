import "express";

// Module augmentation — augments express-serve-static-core where Request is defined
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

// Global namespace augmentation — fallback for environments that use global Express namespace
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        accessToken: string;
      };
      authDuration?: number;
    }
  }
}

export {};
