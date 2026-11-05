import { useCallback, useId, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { SurfaceCanvas } from './sculpture/SurfaceCanvas';
import { buildSurfacePoster, SURFACE_MAX_CURVATURE } from './sculpture/surface';
import { Icon } from './Icon';
import './surface-hero.css';

type Props = {
  reduced: boolean;
  onDiscover: () => void;
  onRead: () => void;
};

export function SurfaceHero({ reduced, onDiscover, onRead }: Props) {
  const root = useRef<HTMLElement>(null);
  const [curvature, setCurvature] = useState(0.9);
  const [flattened, setFlattened] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [webglReady, setWebglReady] = useState(false);
  const [explored, setExplored] = useState(false);
  const id = useId().replace(/:/g, '');
  const posterCurvature = webglReady && !reduced ? 0.9 : curvature;
  const posterFlat = webglReady && !reduced ? false : flattened;
  const poster = useMemo(() => buildSurfacePoster(posterCurvature, posterFlat), [posterCurvature, posterFlat]);
  const revealClue = useCallback(() => setExplored(true), []);
  const updateReady = useCallback((ready: boolean) => setWebglReady(ready), []);

  useGSAP(() => {
    if (reduced) return;
    const heading = root.current?.querySelector('.surface-title');
    const subline = root.current?.querySelector('.surface-prompt');
    if (!heading || !subline) return;
    gsap.fromTo([heading, subline], { y: 16 }, {
      y: 0,
      duration: 1,
      stagger: 0.12,
      ease: 'power3.out',
      clearProps: 'transform',
    });
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  const toggleFlat = () => {
    setFlattened(value => !value);
    revealClue();
  };

  return <section id="hero" className={'surface-hero' + (explored ? ' is-explored' : '') + (webglReady && !reduced ? ' has-webgl' : ' is-diagram')} ref={root} aria-labelledby="surface-heading">
    <div className="surface-atmosphere" aria-hidden="true" />
    <div className="surface-heading-wrap">
      <h1 id="surface-heading" className="surface-title">弯一点。</h1>
      <p className="surface-prompt"><span className="surface-prompt-desktop">{webglReady && !reduced ? '拖动它，松开手。' : '调节下方的弯曲程度。'}</span><span className="surface-prompt-touch">{webglReady && !reduced ? '推一推，或调一调。' : '调节下方的弯曲程度。'}</span></p>
    </div>

    <div className="surface-art" aria-describedby={id + '-model-note'}>
      <svg className="surface-poster" viewBox="0 0 980 660" role="img" aria-label={flattened || curvature === 0 ? '已展平的薄片示意图' : '双曲抛物面示意图：两个方向向相反方向弯曲的薄片'}>
        <defs>
          <linearGradient id={id + '-satin'} x1="12%" y1="12%" x2="82%" y2="92%">
            <stop offset="0" stopColor="#ffd8b9" />
            <stop offset=".46" stopColor="#f29277" />
            <stop offset="1" stopColor="#d95a60" />
          </linearGradient>
          <clipPath id={id + '-clip'}><path d={poster.outline} /></clipPath>
        </defs>
        <path d={poster.outline} className="surface-poster-under" />
        <path d={poster.outline} fill={'url(#' + id + '-satin)'} className="surface-poster-face" />
        {wireframe && <g clipPath={'url(#' + id + '-clip)'} fill="none">
          <path className="surface-poster-parameters" d={poster.parameterLines.join(' ')} />
          <path className="surface-poster-contours" d={poster.contourLines.join(' ')} />
        </g>}
      </svg>
      <SurfaceCanvas curvature={curvature} flattened={flattened} wireframe={wireframe} reduced={reduced} onReady={updateReady} onInteract={revealClue} />
      <p className="surface-touch-hint" aria-hidden="true">按住圆点拖动</p>
    </div>

    <div className="surface-foot">
      <div className="surface-clue">
        <span className="surface-small-note">从一张滤纸开始</span>
        <p>{wireframe ? '一边向上，一边向下。' : explored ? '为什么偏偏弯成了马鞍面？' : '有些问题，是做实验时碰到的。'}</p>
        <div className="surface-links">
          <button type="button" onClick={onDiscover}>看看缘由<Icon name="arrow-right-up-linear" size={19} /></button>
          <button type="button" onClick={onRead} className="surface-note-link">原来的笔记</button>
        </div>
      </div>

      <div className="surface-controls" aria-label="曲面形状" data-lenis-prevent>
        <div className="surface-slider-label"><label htmlFor={id + '-curvature'}>弯曲程度</label><output htmlFor={id + '-curvature'}>{flattened ? '平' : Math.round(curvature / SURFACE_MAX_CURVATURE * 100) + '%'}</output></div>
        <input id={id + '-curvature'} type="range" min="0" max={SURFACE_MAX_CURVATURE} step="0.01" value={flattened ? 0 : curvature}
          aria-valuetext={flattened ? '展平' : '弯曲程度 ' + Math.round(curvature / SURFACE_MAX_CURVATURE * 100) + '%'}
          onChange={event => { setCurvature(Number(event.currentTarget.value)); setFlattened(false); revealClue(); }} />
        <div className="surface-control-actions">
          <button type="button" onClick={toggleFlat} aria-pressed={flattened}><span aria-hidden="true" className={'surface-flatten-icon' + (flattened ? ' flat' : '')} />{flattened ? '恢复弯曲' : '展平'}</button>
          <button type="button" onClick={() => { setWireframe(value => !value); revealClue(); }} aria-pressed={wireframe}><Icon name="widget-2-linear" size={15} />{wireframe ? '收起线条' : '看结构'}</button>
        </div>
      </div>
    </div>
    <p className="surface-model-note" id={id + '-model-note'}>曲面示意 · 非材料仿真</p>
  </section>;
}
