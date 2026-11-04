import type { WeChatCollection, WeChatArticle } from './wechat';

const matches = (article: WeChatArticle, other: WeChatArticle) => article.id === other.id || Boolean(article.url && article.url === other.url);
const equal = (left: WeChatArticle, right: WeChatArticle) => {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]) as Set<keyof WeChatArticle>;
  return [...keys].every(key => left[key] === right[key]);
};

export const PUBLISHED_CACHE_LIMIT = 4 * 1024 * 1024;

const timestamp = (collection: WeChatCollection) => {
  const value = collection.updatedAt ? Date.parse(collection.updatedAt) : NaN;
  return Number.isFinite(value) ? value : null;
};

/** A broken/empty/older upload must not erase a working public archive. */
export function choosePublishedSnapshot(current: WeChatCollection, next: WeChatCollection): WeChatCollection {
  if (!next.articles.length && current.articles.length) return current;
  if (current.accountId && next.accountId !== current.accountId) return current;
  if (!current.accountId && current.name && next.name !== current.name) return current;
  const currentTime = timestamp(current), nextTime = timestamp(next);
  if (currentTime !== null && nextTime !== null && nextTime < currentTime) return current;
  return next;
}

/** The caller supplies the same validator used by the editor and network loader. */
export function readPublishedCache(raw: string | null, bundled: WeChatCollection, validate: (input: unknown) => WeChatCollection): WeChatCollection {
  if (!raw || raw.length > PUBLISHED_CACHE_LIMIT) return bundled;
  try {
    const cached = validate(JSON.parse(raw));
    // An undated old cache must not replace a newer, complete bundled index.
    if (timestamp(cached) === null && timestamp(bundled) !== null) return bundled;
    return choosePublishedSnapshot(bundled, cached);
  } catch { return bundled; }
}

type MergeOptions = {
  /** true is an explicit subscription. undefined migrates old, unmarked profiles. */
  followPublished?: boolean;
  /** Last known full snapshots distinguish exported articles from edits. */
  baselines?: WeChatArticle[];
};

/** Keep recognized local exports as baselines across multiple public revisions. */
export function rememberPublishedBaselines(local: WeChatCollection | undefined, previous: WeChatArticle[], latest: WeChatArticle[]): WeChatArticle[] {
  const retained = previous.filter(article => local?.articles.some(candidate => equal(candidate, article)));
  return [...retained.filter(article => !latest.some(candidate => equal(candidate, article))), ...latest];
}

/** Public updates never remove independent local articles or mutate the saved profile. */
export function mergePublishedWriting(local: WeChatCollection | undefined, published: WeChatCollection, defaults: WeChatArticle[], options: MergeOptions = {}): WeChatCollection {
  if (!local) return published;
  if (local.accountId && local.accountId !== published.accountId) return local;
  if (!local.accountId && local.name && local.name !== published.name) return local;
  if (!published.articles.length && local.articles.length) return local;
  const known = [...defaults, ...(options.baselines || []), ...published.articles];
  const edited = local.articles.filter(article => {
    // Explicitly following the public feed updates its articles even if a saved
    // export carries an old full body. Unrelated local additions still survive.
    if (options.followPublished) return !known.some(original => matches(article, original));
    return !known.some(original => equal(article, original));
  });
  const articles = published.articles.map(article => edited.find(candidate => matches(candidate, article)) || article);
  edited.forEach(article => { if (!articles.some(candidate => matches(candidate, article))) articles.push(article); });
  articles.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  return {...published, name: local.name || published.name, ...(local.homeUrl !== undefined ? {homeUrl:local.homeUrl} : {}), articles};
}
