"use client";
import { usePathname } from "next/navigation";
import Footer from "./footer";

const HIDDEN_FOOTER_PREFIXES = [
    "/admin",
    "/employer",
    "/candidate",
    "/register/employer",
    "/blogs",
    "/login",
    "/register",
    "/cv",
    "/sua-cv",
    "/tao-cv/",
];

export default function ConditionalFooter() {
    const pathname = usePathname();
    const shouldHide = HIDDEN_FOOTER_PREFIXES.some(prefix => pathname.startsWith(prefix));
    if (shouldHide) return null;
    return <Footer />;
}