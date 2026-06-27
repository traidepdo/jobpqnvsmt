import { jwtVerify } from "jose";
import { prisma } from "./prisma";

export interface JWTPayload {
    id: string;
    name: string;
    role: string;
    tokenVersion?: number;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET environment variable is missing!");
        }
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secret);
        const jwtPayload = payload as unknown as JWTPayload;
        if (jwtPayload && jwtPayload.id) {
            const user = await prisma.user.findUnique({
                where: { id: jwtPayload.id },
                select: { tokenVersion: true, isActive: true, isLocked: true }
            });
            if (!user || !user.isActive || user.isLocked) {
                return null;
            }
            if (jwtPayload.tokenVersion !== undefined && user.tokenVersion !== jwtPayload.tokenVersion) {
                return null;
            }
        }
        return jwtPayload;
    } catch {
        return null;
    }
}