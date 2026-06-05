// lib/template-engine.ts
// Render engine: nhận htmlContent + cssContent + resumeData → trả về HTML string hoàn chỉnh

export interface ResumeData {
    // User info
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;

    // Resume fields
    title?: string;       // vị trí ứng tuyển (có thể lấy từ experience gần nhất)
    address?: string;
    summary?: string;
    degree?: string;
    languages?: string;

    // Social links: [{platform, url}]
    socialLinks?: { platform: string; url: string }[];

    // JSON arrays
    education?: {
        school: string;
        degree?: string;
        field?: string;
        startYear?: string;
        endYear?: string;
        description?: string;
        GPA?: string;
    }[];

    experience?: {
        company: string;
        position: string;
        startYear?: string;
        endYear?: string;
        description?: string;
    }[];

    projects?: {
        name: string;
        position?: string;
        link?: string;
        description?: string;
    }[];
}

/**
 * Render template HTML với data của resume.
 *
 * Hỗ trợ:
 *   {{field}}                         — simple replace
 *   {{#each arrayField}} ... {{/each}} — loop (có thể nest {{field}} bên trong)
 *   {{social_url_platform}}            — shortcut lấy url từ socialLinks theo platform
 *
 * Trong block each, dùng {{field}} để truy cập property của item hiện tại.
 */
export function renderTemplate(
    htmlContent: string,
    cssContent: string,
    data: ResumeData
): string {
    let html = htmlContent;

    // 1. Process {{#each arrayField}} ... {{/each}} blocks
    html = processEachBlocks(html, data);

    // 2. Process social link shortcuts: {{social_url_facebook}}, {{social_url_linkedin}}...
    html = processSocialLinks(html, data.socialLinks || []);

    // 3. Simple replace {{field}}
    html = processSimpleFields(html, data);

    // 4. Remove any remaining unresolved placeholders
    html = html.replace(/\{\{[^}]+\}\}/g, "");

    // 5. Wrap with full HTML document + CSS
    return buildDocument(html, cssContent);
}

// ─── Each block processor ─────────────────────────────────────────────────────

function processEachBlocks(html: string, data: ResumeData): string {
    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return html.replace(eachRegex, (_match, arrayName, blockTemplate) => {
        const arr = (data as Record<string, unknown>)[arrayName];
        if (!Array.isArray(arr) || arr.length === 0) return "";

        return arr
            .map((item: Record<string, unknown>, index: number) =>
                renderBlock(blockTemplate, item, index)
            )
            .join("\n");
    });
}

function renderBlock(
    template: string,
    item: Record<string, unknown>,
    index: number
): string {
    // Replace {{@index}} (0-based) and {{@number}} (1-based)
    let out = template
        .replace(/\{\{@index\}\}/g, String(index))
        .replace(/\{\{@number\}\}/g, String(index + 1));

    // Replace {{field}} with item[field]
    out = out.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
        const val = item[key];
        return val !== undefined && val !== null ? String(val) : "";
    });

    return out;
}

// ─── Social links ─────────────────────────────────────────────────────────────

function processSocialLinks(
    html: string,
    socialLinks: { platform: string; url: string }[]
): string {
    // {{social_url_linkedin}}, {{social_url_facebook}}, etc.
    return html.replace(/\{\{social_url_(\w+)\}\}/g, (_m, platform) => {
        const found = socialLinks.find(
            (s) => s.platform.toLowerCase() === platform.toLowerCase()
        );
        return found?.url || "";
    });
}

// ─── Simple field replace ─────────────────────────────────────────────────────

function processSimpleFields(html: string, data: ResumeData): string {
    const flatData: Record<string, string> = {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        avatar: data.avatar || "",
        title: data.title || "",
        address: data.address || "",
        summary: data.summary || "",
        degree: data.degree || "",
        languages: data.languages || "",
    };

    return html.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
        return flatData[key] !== undefined ? flatData[key] : "";
    });
}

// ─── Build full HTML document ─────────────────────────────────────────────────

function buildDocument(bodyHtml: string, cssContent: string): string {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CV</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fff; }
    ${cssContent}
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}