import { useId, useState } from 'react';
import { Icon } from './Icon';
import './discovery-bridge.css';

type Props = { reduced: boolean; onRead: () => void; onExplore: () => void };

// The photograph and quoted question are from the author's public 2026-10-19
// article, “breaking bad”. The formula describes a saddle, not its material cause.
const experimentPhoto = 'content/articles/writing-a04/images/image-001-d72362ebc0.jpg';

export function DiscoveryBridge({ reduced, onRead, onExplore }: Props) {
  const headingId = useId();
  const [photoFailed, setPhotoFailed] = useState(false);
  return <section id="discovery" className={'discovery-bridge' + (reduced ? ' discovery-is-still' : '')} aria-labelledby={headingId}>
    <div className="discovery-layout">
      <div className="discovery-copy">
        <h2 id={headingId}>从一张滤纸开始。</h2>
        <p className="discovery-observation">抽滤后，滤纸和产物一起弯曲，像个马鞍面。</p>
        <blockquote>
          <p>但又为什么非得是类似于马鞍面的弯曲呢，而不是什么其他的几何结构</p>
          <cite>《breaking bad》<time dateTime="2026-10-19">2026.10.19</time></cite>
        </blockquote>
        <div className="discovery-actions">
          <button type="button" className="discovery-read" onClick={onRead}>读当时的记录<Icon name="arrow-right-up-linear" size={19}/></button>
          <button type="button" className="discovery-explore" onClick={onExplore}>去看看别的练习<Icon name="arrow-down-linear" size={17}/></button>
        </div>
      </div>
      <figure className="discovery-specimen">
        <button type="button" className="discovery-photo-link" onClick={onRead} aria-label="打开实验照片所在的原文：breaking bad">
          {photoFailed ? <span className="discovery-photo-fallback">实验照片暂未载入<br/>打开原文查看</span> : <img src={import.meta.env.BASE_URL + experimentPhoto} alt="培养皿中，滤纸与深色产物一起翘曲的实验样品" width={1080} height={1134} loading="lazy" decoding="async" onError={() => setPhotoFailed(true)}/>}
        </button>
        <figcaption>当时的样品<small>照片来自《breaking bad》</small></figcaption>
      </figure>
      <div className="discovery-equation">
        <p aria-label="z 等于 a 乘以 x 平方减 y 平方"><i>z</i> = <i>a</i> (<i>x</i><sup>2</sup> − <i>y</i><sup>2</sup>)</p>
        <span>形状示意，不是实验拟合。</span>
      </div>
    </div>
  </section>;
}
