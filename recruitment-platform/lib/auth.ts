import { jwtVerify } from "jose";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-123');

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