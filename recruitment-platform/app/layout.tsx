// app/layout.tsx
import ConditionalHeader from "@/components/ConditionalHeader";
import "./globals.css";
import "../styles/home.css";
import ConditionalFooter from "@/components/ConditionalFooter";
import { Metadata } from "next";
import ChatbotWidget from "@/components/ChatbotWidget";

export const metadata: Metadata = {
  title: "Phú Quốc Jobs - Tìm việc làm tại Phú Quốc",
  description: "Phú Quốc Jobs - Tìm việc làm tại Phú Quốc",
  icons: {
    icon: 'https://static.thenounproject.com/png/2714603-200.png',
  },
  openGraph: {
    title: 'Phú Quốc Jobs - Tìm việc làm tại Phú Quốc',
    description: 'Dịch vụ thiết kế web chuẩn SEO giúp doanh nghiệp đột phá doanh thu.',
    url: 'https://phuquocjobs.vn',
    siteName: 'Phú Quốc Jobs',
    images: [
      {
        url: 'https://webagency.com/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ảnh đại diện WebAgency',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Phú Quốc Jobs',
  url: 'https://phuquocjobs.vn',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://phuquocjobs.vn/tim-viec?query={search_term_string}',
    'query-input': 'required name=search_term_string',
  },

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </head>
      <body suppressHydrationWarning>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
        <ConditionalHeader />
        <main>{children}</main>
        <ConditionalFooter />
        <ChatbotWidget />
      </body>
    </html>
  );
}