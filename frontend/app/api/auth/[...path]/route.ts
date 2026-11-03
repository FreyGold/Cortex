import { auth } from "@/lib/neon/server";

export const { GET, POST, PUT, PATCH, DELETE } = auth.handler();
