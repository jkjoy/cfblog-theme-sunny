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
  if (!wpUrl) {
    console.warn('fetchPostsPage: PUBLIC_WP_URL is not set; returning empty list');
    return { items: [], totalPages: 1, total: 0 };
  }
  const qp = new URLSearchParams({ per_page: String(perPage), page: String(page) });
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) qp.set(k, String(v));
  }
  qp.set('_embed', '');
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?${qp.toString()}`);
    if (!res.ok) {
      console.warn(`fetchPostsPage: request failed ${res.status}; returning empty list`);
      return { items: [], totalPages: 1, total: 0 };
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      console.warn(`fetchPostsPage: unexpected content-type ${ct}; returning empty list`);
      return { items: [], totalPages: 1, total: 0 };
    }
    const items: WPPost[] = await res.json();
    const totalPages = Number(res.headers.get('X-WP-TotalPages') || '1');
    const total = Number(res.headers.get('X-WP-Total') || String(items.length));
    return { items, totalPages, total };
  } catch (err) {
    console.warn('fetchPostsPage: error fetching posts; returning empty list', err);
    return { items: [], totalPages: 1, total: 0 };
  }
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
  // Be resilient during build: fall back to defaults instead of throwing
  if (!wpUrl) {
    console.warn('fetchSiteInfo: PUBLIC_WP_URL is not set; using defaults');
    return { name: 'Sunny Astro', description: 'Astro + WordPress' };
  }
  try {
    const res = await fetch(`${wpUrl}/wp-json/`);
    if (!res.ok) {
      console.warn(`fetchSiteInfo: request failed ${res.status}; using defaults`);
      return { name: 'Sunny Astro', description: 'Astro + WordPress' };
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      console.warn(`fetchSiteInfo: unexpected content-type ${ct}; using defaults`);
      return { name: 'Sunny Astro', description: 'Astro + WordPress' };
    }
    const root = await res.json();
    return { name: root.name, description: root.description };
  } catch (err) {
    console.warn('fetchSiteInfo: error fetching site info; using defaults', err);
    return { name: 'Sunny Astro', description: 'Astro + WordPress' };
  }
}

export async function fetchSettings(): Promise<WPSettings> {
  if (!wpUrl) {
    console.warn('fetchSettings: PUBLIC_WP_URL is not set; using defaults');
    return { title: '', description: '' };
  }
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/settings`);
    if (!res.ok) {
      console.warn(`fetchSettings: request failed ${res.status}; using defaults`);
      return { title: '', description: '' };
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      console.warn(`fetchSettings: unexpected content-type ${ct}; using defaults`);
      return { title: '', description: '' };
    }
    return res.json();
  } catch (error) {
    console.warn('fetchSettings: error', error);
    return { title: '', description: '' };
  }
}

export async function fetchUserById(id: number): Promise<WPUser> {
  const fallback: WPUser = { id, name: 'Admin', slug: 'admin', avatar_urls: {} };
  if (!wpUrl) {
    console.warn('fetchUserById: PUBLIC_WP_URL is not set; using fallback user');
    return fallback;
  }
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/users/${id}`);
    if (!res.ok) {
      console.warn(`fetchUserById: request failed ${res.status}; using fallback user`);
      return fallback;
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      console.warn(`fetchUserById: unexpected content-type ${ct}; using fallback user`);
      return fallback;
    }
    return await res.json();
  } catch (err) {
    console.warn('fetchUserById: error', err);
    return fallback;
  }
}

export async function fetchCategories(): Promise<WPCategory[]> {
  if (!wpUrl) {
    console.warn('fetchCategories: PUBLIC_WP_URL is not set; returning empty list');
    return [];
  }
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/categories?per_page=100`);
    if (!res.ok) {
      console.warn(`fetchCategories: request failed ${res.status}; returning empty list`);
      return [];
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      console.warn(`fetchCategories: unexpected content-type ${ct}; returning empty list`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn('fetchCategories: error', err);
    return [];
  }
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
  if (!wpUrl) {
    console.warn('WP tags fetch skipped: PUBLIC_WP_URL is not set');
    return [];
  }
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/tags?per_page=${limit}&orderby=count&order=desc`);
    if (!res.ok) {
      console.warn(`WP tags fetch failed: ${res.status}`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn('WP tags fetch error:', err);
    return [];
  }
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
  if (!wpUrl) {
    console.warn('fetchCommentCount: PUBLIC_WP_URL is not set; returning 0');
    return 0;
  }
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/comments?post=${postId}&per_page=1`);
    if (!res.ok) return 0;
    const total = Number(res.headers.get('X-WP-Total') || '0');
    return Number.isFinite(total) ? total : 0;
  } catch {
    return 0;
  }
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
  if (!wpUrl) {
    console.warn('fetchPages: PUBLIC_WP_URL is not set; returning empty list');
    return [];
  }
  try {
    // include fields for sorting (menu_order) and status
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/pages?per_page=${limit}&_embed&orderby=menu_order&order=asc`);
    if (!res.ok) {
      console.warn(`fetchPages: request failed ${res.status}; returning empty list`);
      return [];
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      console.warn(`fetchPages: unexpected content-type ${ct}; returning empty list`);
      return [];
    }
    const arr: WPPage[] = await res.json();
    // sort as a fallback by menu_order then date
    return arr.sort((a, b) => (a.menu_order ?? 0) - (b.menu_order ?? 0) || new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (err) {
    console.warn('fetchPages: error fetching pages; returning empty list', err);
    return [];
  }
}

export async function fetchPageBySlug(slug: string): Promise<WPPage | null> {
  if (!wpUrl) {
    console.warn('fetchPageBySlug: PUBLIC_WP_URL is not set; returning null');
    return null;
  }
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&_embed`);
    if (!res.ok) {
      console.warn(`fetchPageBySlug: request failed ${res.status}; returning null`);
      return null;
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      console.warn(`fetchPageBySlug: unexpected content-type ${ct}; returning null`);
      return null;
    }
    const arr: WPPage[] = await res.json();
    return arr[0] ?? null;
  } catch (err) {
    console.warn('fetchPageBySlug: error', err);
    return null;
  }
}

export async function fetchStickyPosts(limit = 5): Promise<WPPost[]> {
  if (!wpUrl) {
    console.warn('fetchStickyPosts: PUBLIC_WP_URL is not set; returning empty list');
    return [];
  }
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?sticky=true&per_page=${limit}&_embed`);
    if (!res.ok) {
      console.warn(`fetchStickyPosts: request failed ${res.status}; returning empty list`);
      return [];
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      console.warn(`fetchStickyPosts: unexpected content-type ${ct}; returning empty list`);
      return [];
    }
    return res.json();
  } catch (err) {
    console.warn('fetchStickyPosts: error', err);
    return [];
  }
}

export async function fetchPostsByIds(ids: number[]): Promise<WPPost[]> {
  if (!wpUrl) {
    console.warn('fetchPostsByIds: PUBLIC_WP_URL is not set; returning empty list');
    return [];
  }
  if (!ids.length) return [];
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?include=${ids.join(',')}&per_page=${ids.length}&_embed`);
    if (!res.ok) {
      console.warn(`fetchPostsByIds: request failed ${res.status}; returning empty list`);
      return [];
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      console.warn(`fetchPostsByIds: unexpected content-type ${ct}; returning empty list`);
      return [];
    }
    const arr: WPPost[] = await res.json();
  // reorder according to ids
  const map = new Map(arr.map(p => [p.id, p] as const));
  return ids.map(id => map.get(id)).filter(Boolean) as WPPost[];
  } catch (err) {
    console.warn('fetchPostsByIds: error', err);
    return [];
  }
}

export async function fetchPost(slug: string): Promise<WPPost | null> {
  if (!wpUrl) {
    console.warn('fetchPost: PUBLIC_WP_URL is not set; returning null');
    return null;
  }
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`);
    if (!res.ok) {
      console.warn(`fetchPost: request failed ${res.status}; returning null`);
      return null;
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      console.warn(`fetchPost: unexpected content-type ${ct}; returning null`);
      return null;
    }
    const arr = await res.json();
    return arr[0] ?? null;
  } catch (err) {
    console.warn('fetchPost: error', err);
    return null;
  }
}
