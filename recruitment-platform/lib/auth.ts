import { jwtVerify } from "jose";
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is missing!");
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export interface JWTPayload {
    id: string;
    name: string;
    role: string;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}