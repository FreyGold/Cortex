declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        accessToken: string;
      };
    }
  }
}

export {};
