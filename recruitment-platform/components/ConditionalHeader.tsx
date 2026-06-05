"use client";
import { usePathname } from "next/navigation";
import Header from "./header";

const HIDDEN_HEADER_PREFIXES = [
    "/admin",
    "/employer",
    "/candidate",
    "/register/employer",
    "/login",
    "/register",
];

export default function ConditionalHeader() {
    const pathname = usePathname();
    const shouldHide = HIDDEN_HEADER_PREFIXES.some(prefix => pathname.startsWith(prefix));
    if (shouldHide) return null;
    return <Header />;
}