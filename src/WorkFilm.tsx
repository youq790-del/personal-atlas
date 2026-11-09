import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ElasticFrame } from './ElasticFrame';
import { Icon } from './Icon';
import './work-film.css';

type DataConnection = EventTarget & { saveData?: boolean };
type Props = {
  src: string; poster: string; title: string; reduced: boolean; frameVariant: number;
  preview?: boolean; expanded?: boolean; rectangular?: boolean; suspended?: boolean; onOpen?: () => void; onExpand?: () => void;
};
const timeLabel = (value: number) => {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
};

/** Real rendered footage. A poster is the entire network cost until playback is allowed. */
export function WorkFilm({ src, poster, title, reduced, frameVariant, preview = false, expanded = false, rectangular = false, suspended = false, onOpen, onExpand }: Props) {
  const root = useRef<HTMLDivElement>(null), video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false), [pageVisible, setPageVisible] = useState(false);
  const [autoAllowed, setAutoAllowed] = useState(false);
  const [intent, setIntent] = useState<'auto' | 'play' | 'pause'>('auto');
  const [loaded, setLoaded] = useState(false), [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false), [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false), [blocked, setBlocked] = useState(false), [posterFailed, setPosterFailed] = useState(false);
  const [duration, setDuration] = useState(0), [time, setTime] = useState(0);
  const [scrubbing, setScrubbing] = useState(false), [attempt, setAttempt] = useState(0);
  const wantsPlayback = intent === 'play' || (intent === 'auto' && autoAllowed && !blocked);
  const shouldPlay = visible && pageVisible && wantsPlayback && !failed && !scrubbing && !suspended;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: DataConnection }).connection;
    const preference = () => setAutoAllowed(!reduced && !media.matches && !connection?.saveData);
    const visibility = () => setPageVisible(!document.hidden);
    preference(); visibility();
    media.addEventListener('change', preference);
    connection?.addEventListener('change', preference);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      media.removeEventListener('change', preference);
      connection?.removeEventListener('change', preference);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [reduced]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      const measureVisibility = () => {
        const bounds = element.getBoundingClientRect();
        const overlap = Math.max(0, Math.min(innerHeight, bounds.bottom) - Math.max(0, bounds.top));
        setVisible(bounds.width > 0 && bounds.height > 0 && overlap / bounds.height >= .25 && bounds.right > 0 && bounds.left < innerWidth);
      };
      measureVisibility();
      window.addEventListener('scroll', measureVisibility, { passive: true });
      window.addEventListener('resize', measureVisibility);
      return () => { window.removeEventListener('scroll', measureVisibility); window.removeEventListener('resize', measureVisibility); };
    }
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting && entry.intersectionRatio >= .25);
    }, { threshold: [0, .25, .6] });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let cancelled = false;
    if (!shouldPlay) { element.pause(); setBuffering(false); return; }
    if (!loaded) { setLoaded(true); return; }
    element.muted = true;
    setBuffering(element.readyState < 3);
    const play = element.play();
    play?.catch((error: unknown) => {
      if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return;
      setPlaying(false); setBuffering(false);
      if (error instanceof DOMException && error.name === 'NotAllowedError') { setBlocked(true); setIntent('pause'); }
      else setFailed(true);
    });
    return () => { cancelled = true; element.pause(); };
  }, [shouldPlay, loaded, attempt]);

  useEffect(() => {
    if (!scrubbing) return;
    const finish = () => setScrubbing(false);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('blur', finish);
    return () => {
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('blur', finish);
    };
  }, [scrubbing]);

  const retry = () => {
    setFailed(false); setBlocked(false); setReady(false); setTime(0); setDuration(0);
    setLoaded(true); setIntent('play'); setAttempt(value => value + 1);
  };
  const toggle = () => {
    if (failed) { retry(); return; }
    if (playing || (shouldPlay && buffering)) {
      setIntent('pause'); video.current?.pause(); setBuffering(false);
    } else {
      setBlocked(false); setLoaded(true); setIntent('play');
    }
  };
  const measure = () => {
    const value = video.current?.duration || 0;
    setDuration(Number.isFinite(value) ? value : 0);
  };
  const seek = (value: number) => {
    const element = video.current;
    if (!element || !duration) return;
    const next = Math.max(0, Math.min(duration, value));
    element.currentTime = next; setTime(next);
  };
  const isActive = playing || (shouldPlay && buffering);
  const controlLabel = failed ? '重试播放' : isActive ? '暂停' : '播放';
  const status = failed ? '短片未载入，先看这一帧。' : buffering && !ready ? '正在载入短片…' : '';
  const progress = duration ? Math.min(100, time / duration * 100) : 0;

  return <div ref={root} className={'work-film ' + (preview ? 'work-film-preview' : 'work-film-player') + (playing ? ' is-playing' : '') + (failed ? ' has-error' : '')} role="group" aria-label={title + '短片'}>
    <div className="work-film-image">
      <FilmFrame rectangular={rectangular} frameVariant={frameVariant} reduced={reduced} expanded={expanded} preview={preview}>
        <div className="work-film-screen">
          <video key={attempt} ref={video} src={loaded ? src : undefined} poster={poster} muted loop playsInline preload="none"
            className={ready && !failed ? 'has-frame' : ''} aria-label={title}
            onLoadedMetadata={measure} onDurationChange={measure} onLoadedData={() => setReady(true)}
            onPlaying={() => { setPlaying(true); setReady(true); setBuffering(false); }}
            onPause={() => setPlaying(false)} onWaiting={() => setBuffering(true)} onCanPlay={() => setBuffering(false)}
            onTimeUpdate={() => setTime(video.current?.currentTime || 0)}
            onError={() => { setFailed(true); setPlaying(false); setBuffering(false); }} />
          {(!ready || failed) && !posterFailed && <img className="work-film-poster" src={poster} alt="" loading="lazy" decoding="async" onError={() => setPosterFailed(true)} />}
          {(!ready || failed) && posterFailed && <span className="work-film-empty">{title}</span>}
          {preview && onOpen && <button type="button" className="work-film-open" onClick={onOpen} aria-label={'打开' + title + '短片'} />}
        </div>
      </FilmFrame>
    </div>
    {preview && onOpen && <button type="button" className="work-film-open-caption" onClick={onOpen} aria-label={'查看' + title + '短片'}>看短片<Icon name="arrow-right-up-linear" size={18} /></button>}
    {status && <p className="work-film-status" role="status">{status}</p>}
    <div className="work-film-controls" data-lenis-prevent>
      <button type="button" className="work-film-toggle" onClick={toggle} aria-label={controlLabel + (preview ? '预览' : '') + '：' + title} aria-pressed={isActive}>
        {isActive ? <span className="film-pause" aria-hidden="true"><i /><i /></span> : <span className="film-play" aria-hidden="true" />}
        <span>{controlLabel}</span>
      </button>
      {!preview && <>
        <input className="work-film-seek" type="range" min="0" max={duration || 1} step="0.05" value={Math.min(time, duration || 0)} disabled={!duration || failed}
          style={{ '--film-progress': progress + '%' } as CSSProperties} aria-label={title + '播放进度'} aria-valuetext={timeLabel(time) + '，共 ' + timeLabel(duration)}
          onChange={event => seek(Number(event.currentTarget.value))} onPointerDown={() => setScrubbing(true)} onPointerUp={() => setScrubbing(false)} onPointerCancel={() => setScrubbing(false)} onBlur={() => setScrubbing(false)}
          onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) { event.stopPropagation(); setScrubbing(true); } }}
          onKeyUp={() => setScrubbing(false)} />
        <span className="work-film-clock" aria-hidden="true">{timeLabel(time)}<span> / {timeLabel(duration)}</span></span>
        {onExpand && <button type="button" className="work-film-expand" onClick={onExpand} aria-pressed={expanded} aria-label={expanded ? '收起短片' : '放大短片'}><Icon name="magnifier-linear" size={17} /><span>{expanded ? '收起' : '放大'}</span></button>}
      </>}
    </div>
  </div>;
}

function FilmFrame({ rectangular, frameVariant, reduced, expanded, preview, children }: Pick<Props, 'rectangular' | 'frameVariant' | 'reduced' | 'expanded' | 'preview'> & {children: React.ReactNode}) {
  if (rectangular) return <div className="film-rectangle" style={{width:'100%',height:'100%'}}>{children}</div>;
  return <ElasticFrame variant={frameVariant} disabled={reduced || expanded} className={preview ? 'film-preview-frame' : 'work-art-frame'} preserveContent={!preview}>{children}</ElasticFrame>;
}
