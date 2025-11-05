export type WPPost = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: any;
};

export type WPPostsResponse = {
  items: WPPost[];
  totalPages: number;
  total: number;
};

export type WPSiteInfo = {
  name: string;
  description: string;
};

export type WPSettings = {
  title: string;
  description: string;
  head_html?: string;
  site_footer_text?: string;
  [key: string]: any;
};

export type WPUser = {
  id: number;
  name: string; // display name
  slug: string;
  avatar_urls?: Record<string, string>;
};

export type WPCategory = {
  id: number;
  name: string;
  slug: string;
  parent: number;
};

const wpUrl = import.meta.env.PUBLIC_WP_URL?.replace(/\/$/, '') || '';

export async function fetchPostsPage(page = 1, perPage = 10, extraParams?: Record<string, string | number>): Promise<WPPostsResponse> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const qp = new URLSearchParams({ per_page: String(perPage), page: String(page) });
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) qp.set(k, String(v));
  }
  qp.set('_embed', '');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?${qp.toString()}`);
  if (!res.ok) throw new Error(`WP posts fetch failed: ${res.status}`);
  const items: WPPost[] = await res.json();
  const totalPages = Number(res.headers.get('X-WP-TotalPages') || '1');
  const total = Number(res.headers.get('X-WP-Total') || String(items.length));
  return { items, totalPages, total };
}

export async function fetchPosts(): Promise<WPPost[]> {
  const { items } = await fetchPostsPage(1);
  return items;
}

export async function fetchAllPosts(maxPages = 50, perPage = 100): Promise<WPPost[]> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const collected: WPPost[] = [];
  // first request to get total pages
  const first = await fetch(`${wpUrl}/wp-json/wp/v2/posts?per_page=${perPage}&page=1`);
  if (!first.ok) throw new Error(`WP posts fetch failed: ${first.status}`);
  const firstItems: WPPost[] = await first.json();
  collected.push(...firstItems);
  const totalPages = Number(first.headers.get('X-WP-TotalPages') || '1');
  const pages = Math.min(totalPages, maxPages);
  for (let page = 2; page <= pages; page++) {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}`);
    if (!res.ok) break;
    const items: WPPost[] = await res.json();
    collected.push(...items);
  }
  return collected;
}

export async function fetchSiteInfo(): Promise<WPSiteInfo> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/`);
  if (!res.ok) throw new Error(`WP site info fetch failed: ${res.status}`);
  const root = await res.json();
  return { name: root.name, description: root.description };
}

export async function fetchSettings(): Promise<WPSettings> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/settings`);
    if (!res.ok) {
      console.warn(`WP settings fetch failed: ${res.status}, using defaults`);
      return { title: '', description: '' };
    }
    return res.json();
  } catch (error) {
    console.warn('WP settings fetch error:', error);
    return { title: '', description: '' };
  }
}

export async function fetchUserById(id: number): Promise<WPUser> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/users/${id}`);
  if (!res.ok) throw new Error(`WP user fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchCategories(): Promise<WPCategory[]> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/categories?per_page=100`);
  if (!res.ok) throw new Error(`WP categories fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchPostsByCategory(categoryId: number, page = 1, perPage = 10): Promise<WPPostsResponse> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?categories=${categoryId}&per_page=${perPage}&page=${page}&_embed`);
  if (!res.ok) throw new Error(`WP posts by category fetch failed: ${res.status}`);
  const items: WPPost[] = await res.json();
  const totalPages = Number(res.headers.get('X-WP-TotalPages') || '1');
  const total = Number(res.headers.get('X-WP-Total') || String(items.length));
  return { items, totalPages, total };
}

export type WPTag = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

export async function fetchTags(limit = 20): Promise<WPTag[]> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/tags?per_page=${limit}&orderby=count&order=desc`);
  if (!res.ok) throw new Error(`WP tags fetch failed: ${res.status}`);
  return res.json();
}

export type WPComment = {
  id: number;
  post: number;
  parent: number;
  author: number;
  date: string;
  author_name: string;
  author_url?: string;
  author_avatar_urls?: Record<string, string>;
  content: { rendered: string };
  link?: string;
  status?: string;
  _embedded?: any;
};

export async function fetchRecentComments(limit = 4): Promise<WPComment[]> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/comments?per_page=${limit}&orderby=date&order=desc&_embed`);
  if (!res.ok) throw new Error(`WP comments fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchCommentsByPost(postId: number): Promise<WPComment[]> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/comments?post=${postId}&per_page=100&orderby=date&order=asc`);
  if (!res.ok) throw new Error(`WP comments by post fetch failed: ${res.status}`);
  return res.json();
}

// Fetch total comment count for a given post via X-WP-Total header
export async function fetchCommentCount(postId: number): Promise<number> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/comments?post=${postId}&per_page=1`);
  if (!res.ok) return 0;
  const total = Number(res.headers.get('X-WP-Total') || '0');
  return Number.isFinite(total) ? total : 0;
}

// Batch fetch comment counts for multiple posts
export async function fetchCommentCounts(postIds: number[]): Promise<Map<number, number>> {
  if (!postIds || postIds.length === 0) return new Map();
  const pairs = await Promise.all(postIds.map(async (id) => {
    try { return [id, await fetchCommentCount(id)] as const; }
    catch { return [id, 0] as const; }
  }));
  return new Map<number, number>(pairs);
}

export async function fetchPostsByTag(tagId: number, page = 1, perPage = 10): Promise<WPPostsResponse> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?tags=${tagId}&per_page=${perPage}&page=${page}&_embed`);
  if (!res.ok) throw new Error(`WP posts by tag fetch failed: ${res.status}`);
  const items: WPPost[] = await res.json();
  const totalPages = Number(res.headers.get('X-WP-TotalPages') || '1');
  const total = Number(res.headers.get('X-WP-Total') || String(items.length));
  return { items, totalPages, total };
}

export type WPLink = {
  id: number;
  name: string;
  url: string;
  description?: string;
  avatar?: string;
  category?: { id: number; name: string; slug: string };
  target?: string;
  visible?: 'yes' | 'no';
  rating?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export async function fetchLinks(): Promise<WPLink[]> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/links`);
  if (!res.ok) throw new Error(`WP links fetch failed: ${res.status}`);
  const arr: WPLink[] = await res.json();
  return arr;
}

export type WPPage = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  link?: string;
  _embedded?: any;
  status?: string;
  parent?: number;
  menu_order?: number;
};

export async function fetchPages(limit = 100): Promise<WPPage[]> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  // include fields for sorting (menu_order) and status
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/pages?per_page=${limit}&_embed&orderby=menu_order&order=asc`);
  if (!res.ok) throw new Error(`WP pages fetch failed: ${res.status}`);
  const arr: WPPage[] = await res.json();
  // sort as a fallback by menu_order then date
  return arr.sort((a, b) => (a.menu_order ?? 0) - (b.menu_order ?? 0) || new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function fetchPageBySlug(slug: string): Promise<WPPage | null> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&_embed`);
  if (!res.ok) throw new Error(`WP page fetch failed: ${res.status}`);
  const arr: WPPage[] = await res.json();
  return arr[0] ?? null;
}

export async function fetchStickyPosts(limit = 5): Promise<WPPost[]> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?sticky=true&per_page=${limit}&_embed`);
  if (!res.ok) throw new Error(`WP sticky posts fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchPostsByIds(ids: number[]): Promise<WPPost[]> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  if (!ids.length) return [];
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?include=${ids.join(',')}&per_page=${ids.length}&_embed`);
  if (!res.ok) throw new Error(`WP posts by ids fetch failed: ${res.status}`);
  const arr: WPPost[] = await res.json();
  // reorder according to ids
  const map = new Map(arr.map(p => [p.id, p] as const));
  return ids.map(id => map.get(id)).filter(Boolean) as WPPost[];
}

export async function fetchPost(slug: string): Promise<WPPost | null> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL is not set');
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`);
  if (!res.ok) throw new Error(`WP post fetch failed: ${res.status}`);
  const arr = await res.json();
  return arr[0] ?? null;
}
