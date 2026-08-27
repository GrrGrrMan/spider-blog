import { getCollection, render } from 'astro:content';

export const prerender = true;

export interface SearchEntry {
  id: string;
  type: 'page' | 'heading' | 'content';
  docTitle: string;
  section: string;
  slug: string;
  subheading: string;
  url: string;
  content: string;
  keywords: string[];
}

function sanitizeMarkdownText(raw: string): string {
  return raw
    .replace(/\$\$[\s\S]*?\$\$/g, ' ') // Remove display math
    .replace(/\$[^\$\n]+\$/g, ' ')    // Remove inline math
    .replace(/```[\s\S]*?```/g, ' ')  // Remove code blocks
    .replace(/\|[^\n]+\|/g, ' ')      // Remove markdown table rows
    .replace(/!\[.*?\]\(.*?\)/g, ' ') // Remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Extract link labels
    .replace(/<[^>]+>/g, ' ')         // Remove HTML tags
    .replace(/[#*_~`>]/g, ' ')        // Remove markdown formatting
    .replace(/\s+/g, ' ')             // Collapse whitespace
    .trim();
}

export async function GET() {
  const docs = await getCollection('docs');
  const indexNodes: SearchEntry[] = [];
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  for (const doc of docs) {
    const rawFileId = (doc.slug || doc.id).replace(/\.(md|mdx)$/, '');
    const cleanSlug = rawFileId.replace(/^\d{2}-/, '');
    const { headings } = await render(doc);

    const rawBody = doc.body || '';
    const cleanOverview = sanitizeMarkdownText(rawBody).slice(0, 300);

    // 1. Root Chapter Document Node
    indexNodes.push({
      id: cleanSlug,
      type: 'page',
      docTitle: doc.data.title,
      section: doc.data.section,
      slug: cleanSlug,
      subheading: doc.data.title,
      url: `${baseUrl}docs/${cleanSlug}`,
      content: cleanOverview,
      keywords: [doc.data.title, doc.data.section, doc.data.badge || ''].filter(Boolean),
    });

    // 2. Subheading & Deep Section Nodes
    const sectionChunks = rawBody.split(/(?=^#{2,3}\s+)/m);

    for (const chunk of sectionChunks) {
      const headingMatch = chunk.match(/^#{2,3}\s+(.+)$/m);
      if (!headingMatch) continue;

      const headingText = headingMatch[1].replace(/[#*`]/g, '').trim();
      const matchedHeading = headings.find(
        (h) => h.text.trim().toLowerCase() === headingText.toLowerCase()
      );

      const anchorSlug = matchedHeading ? matchedHeading.slug : '';
      const anchorUrl = anchorSlug ? `${baseUrl}docs/${cleanSlug}#${anchorSlug}` : `${baseUrl}docs/${cleanSlug}`;
      const cleanContent = sanitizeMarkdownText(chunk);

      indexNodes.push({
        id: `${cleanSlug}#${anchorSlug || headingText}`,
        type: 'heading',
        docTitle: doc.data.title,
        section: doc.data.section,
        slug: cleanSlug,
        subheading: headingText,
        url: anchorUrl,
        content: cleanContent,
        keywords: [headingText, doc.data.title, doc.data.section],
      });
    }
  }

  return new Response(JSON.stringify(indexNodes), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}