// app/blogs/[slug]/_components/HtmlViewer.tsx
'use client'

export default function HtmlViewer({ content }: { content: string }) {
    return (
        <div className="fixed inset-0 w-full h-full my-15">
            <iframe
                srcDoc={content}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                title="Landing Page"
            />
        </div>
    );
}