import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { BrandMark } from './Brand';
import { Icon } from './Icon';

gsap.registerPlugin(useGSAP);

const SESSION_KEY = 'personal-atlas:opening-seen:v1';
// Storage can be disabled. A module fallback still avoids replaying on remount.
let seenInMemory = false;

function hasSeenOpening() {
  if (seenInMemory) return true;
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; }
  catch { return false; }
}

function rememberOpening() {
  seenInMemory = true;
  try { sessionStorage.setItem(SESSION_KEY, '1'); }
  catch { /* The opening remains optional when storage is unavailable. */ }
}

function prefersLessMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type OpeningSequenceProps = {
  reduced: boolean;
  /** Change this number to replay, even when this session has already seen the opening. */
  replayKey?: number;
};

export function OpeningSequence({ reduced, replayKey = 0 }: OpeningSequenceProps) {
  const root = useRef<HTMLDivElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const lastReplayKey = useRef(replayKey);
  const restoreFocus = useRef<(() => void) | null>(null);
  const [visible, setVisible] = useState(() => !reduced && !prefersLessMotion() && !hasSeenOpening());
  const dismiss = useCallback(() => {
    restoreFocus.current?.();
    setVisible(false);
  }, []);

  useEffect(() => {
    const replay = lastReplayKey.current !== replayKey;
    lastReplayKey.current = replayKey;
    if (reduced || prefersLessMotion()) {
      rememberOpening();
      dismiss();
    } else if (replay) {
      setVisible(true);
    }
  }, [reduced, replayKey, dismiss]);

  useGSAP(() => {
    if (!visible || reduced || prefersLessMotion() || !root.current) return;
    rememberOpening();
    const element = root.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const skipButton = skip.current;
    let ownsFocus = false;
    const trackFocus = (event: FocusEvent) => {
      // Body can become active when reduced-motion CSS hides the opening.
      // Moving to another real control is an intentional departure: preserve it.
      if (event.target !== document.body && event.target !== document.documentElement) {
        ownsFocus = event.target === skipButton;
      }
    };
    const returnFocus = () => {
      if (!ownsFocus || !document.hasFocus()) return;
      const active = document.activeElement;
      if (active !== skipButton && active !== document.body && active !== document.documentElement) return;
      ownsFocus = false;
      const previousIsUsable = previousFocus?.isConnected
        && previousFocus !== document.body
        && previousFocus !== document.documentElement;
      const target = previousIsUsable ? previousFocus : document.querySelector<HTMLElement>('.wordmark');
      target?.focus({ preventScroll: true });
    };
    restoreFocus.current = returnFocus;
    document.addEventListener('focusin', trackFocus);
    skipButton?.focus({ preventScroll: true });
    ownsFocus = document.activeElement === skipButton;

    const strokes = element.querySelectorAll<SVGPathElement>('[data-brand-stroke]');
    strokes.forEach(path => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });
    gsap.set('.brand-mark__point', { scale: 0, transformOrigin: '50% 50%', autoAlpha: 0 });
    gsap.set('.opening-sequence__label', { y: 7, autoAlpha: 0 });

    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: dismiss });
    timeline
      .to(strokes, { strokeDashoffset: 0, duration: 0.52, stagger: 0.06 }, 0)
      .to('.brand-mark__point', { scale: 1, autoAlpha: 1, duration: 0.28 }, 0.25)
      .to('.opening-sequence__label', { y: 0, autoAlpha: 1, duration: 0.28 }, 0.3)
      .to('.opening-sequence__identity', { scale: 1.08, autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 0.65)
      .to('.opening-sequence__curtain--top', { yPercent: -101, duration: 0.7, ease: 'power3.inOut' }, 0.7)
      .to('.opening-sequence__curtain--bottom', { yPercent: 101, duration: 0.7, ease: 'power3.inOut' }, 0.7);

    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && document.activeElement === skipButton) ownsFocus = false;
      if (event.key === 'Escape') dismiss();
    };
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionChanged = () => { if (media.matches) dismiss(); };
    window.addEventListener('keydown', keydown);
    media.addEventListener('change', motionChanged);
    // A suspended animation frame must never leave the page covered indefinitely.
    const failSafe = window.setTimeout(dismiss, 2400);

    return () => {
      window.clearTimeout(failSafe);
      window.removeEventListener('keydown', keydown);
      media.removeEventListener('change', motionChanged);
      returnFocus();
      document.removeEventListener('focusin', trackFocus);
      if (restoreFocus.current === returnFocus) restoreFocus.current = null;
    };
  }, { scope: root, dependencies: [visible, reduced, replayKey], revertOnUpdate: true });

  if (!visible || reduced || prefersLessMotion()) return null;

  return (
    <div className="opening-sequence" ref={root} data-opening-sequence>
      <div className="opening-sequence__curtain opening-sequence__curtain--top" aria-hidden="true" />
      <div className="opening-sequence__curtain opening-sequence__curtain--bottom" aria-hidden="true" />
      <div className="opening-sequence__identity" aria-hidden="true">
        <BrandMark className="opening-sequence__mark" />
        <span className="opening-sequence__label">OPEN SPACE</span>
      </div>
      <button className="opening-sequence__skip" type="button" onClick={dismiss} ref={skip}>
        跳过开场 <Icon name="arrow-right-up-linear" size={18} />
      </button>
    </div>
  );
}
