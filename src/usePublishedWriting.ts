import { useEffect, useMemo, useRef, useState } from 'react';
import { validateWeChat, type WeChatCollection } from './wechat';
import { defaultWeChatCollection } from './archived-writing';
import { defaultWeChatCollection as legacyWriting } from './legacy-writing';
import { choosePublishedSnapshot, mergePublishedWriting, PUBLISHED_CACHE_LIMIT, readPublishedCache, rememberPublishedBaselines } from './published-writing';

const CACHE_KEY = 'yo7-published-writing-v1';
const defaults = [...defaultWeChatCollection.articles, ...legacyWriting.articles];
const initialSnapshot = () => {
  try { return readPublishedCache(localStorage.getItem(CACHE_KEY), defaultWeChatCollection, validateWeChat); }
  catch { return defaultWeChatCollection; }
};

export function usePublishedWriting(local?: WeChatCollection, enabled?: boolean) {
  const localRef = useRef(local);
  localRef.current = local;
  const [state, setState] = useState(() => {
    const published = initialSnapshot();
    return {published, baselines: published.articles};
  });
  useEffect(() => {
    if (enabled === false) return;
    let disposed = false, pending = false;
    const controller = new AbortController();
    const update = async () => {
      if (pending || document.hidden || disposed) return;
      pending = true;
      try {
        const response = await fetch(import.meta.env.BASE_URL + 'content/wechat.json', {cache:'no-cache', signal:controller.signal});
        if (!response.ok) return;
        if (Number(response.headers.get('content-length')) > PUBLISHED_CACHE_LIMIT) return;
        const reader = response.body?.getReader();
        if (!reader) return;
        let raw = '', length = 0;
        const decoder = new TextDecoder();
        for (;;) {
          const {done, value} = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > PUBLISHED_CACHE_LIMIT) { await reader.cancel(); return; }
          raw += decoder.decode(value, {stream:true});
        }
        raw += decoder.decode();
        const next = validateWeChat(JSON.parse(raw));
        if (!disposed) setState(previous => {
          const accepted = choosePublishedSnapshot(previous.published, next);
          if (accepted === previous.published || JSON.stringify(previous.published) === JSON.stringify(accepted)) return previous;
          return {published:accepted, baselines:rememberPublishedBaselines(localRef.current, previous.baselines, previous.published.articles)};
        });
      } catch { /* The bundled archive remains available while offline. */ }
      finally { pending = false; }
    };
    void update();
    const interval = window.setInterval(update, 60_000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => { disposed = true; controller.abort(); clearInterval(interval); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, [enabled]);
  useEffect(() => {
    if (enabled === false) return;
    try {
      const raw = JSON.stringify(state.published);
      if (raw.length <= PUBLISHED_CACHE_LIMIT) localStorage.setItem(CACHE_KEY, raw);
    } catch { /* Cached public data is optional; never change the saved profile. */ }
  }, [state.published, enabled]);
  return useMemo(() => enabled === false ? local : mergePublishedWriting(local, state.published, defaults, {followPublished:enabled === true, baselines:state.baselines}), [local, state, enabled]);
}
