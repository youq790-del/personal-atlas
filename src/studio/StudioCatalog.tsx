import { useId, useMemo, useState, type CSSProperties } from 'react';
import { Icon } from '../Icon';
import { Modal } from '../Modal';
import { WorkFilm } from '../WorkFilm';
import { works, workAsset, type PortfolioWork, type WorkId } from '../portfolio';
import type { WeChatArticle } from '../wechat';
import { BuildCursors } from './BuildPrimitives';
import './catalog.css';

type Props = { reduced: boolean; suspended?: boolean; onRead: (id: string) => void; articles: WeChatArticle[] };
type Filter = 'all' | 'animation' | 'presentation';
type Layer = 'film' | 'process' | 'source';

// These describe the supplied studies, not a claim of commercial or original character work.
const studyNotes: Record<WorkId, { focus: string; note: string; elements: string[] }> = {
  particles: { focus: '从散开，到聚合。', note: '粒子 Logo 动画练习。这里截取了工程中的一段动画。', elements: ['粒子', '运动', '标志'] },
  grass: { focus: '让草地动起来。', note: '用几何节点搭出草地，再观察风经过时的变化。', elements: ['几何节点', '草地', '风'] },
  pop: { focus: '把三维画面压成漫画。', note: '角色风格化动画练习，关注色块和轮廓。', elements: ['风格化渲染', '角色练习', '动画'] },
  liquid: { focus: '看光穿过玻璃。', note: '层叠玻璃圆盘的材质练习。短片用运镜展示形体和反射。', elements: ['玻璃材质', '反射', '展示运镜'] },
  cloud: { focus: '用节点捏一朵云。', note: '几何节点云体练习。短片用运镜展示云体的层次。', elements: ['几何节点', '云体', '展示运镜'] },
  organic: { focus: '方块也可以生长。', note: '几何节点形变练习，观看一个形体如何随时间变化。', elements: ['几何节点', '形变', '动画'] },
};
const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: '全部' }, { id: 'animation', label: '动态练习' }, { id: 'presentation', label: '材质与空间' },
];
const matchesFilter = (work: PortfolioWork, filter: Filter) => filter === 'all' || (filter === 'presentation' ? work.motion === 'presentation' : work.motion !== 'presentation');

export function StudioCatalog({ reduced, suspended = false, onRead, articles }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<PortfolioWork | null>(null);
  const shown = useMemo(() => works.filter(work => matchesFilter(work, filter)), [filter]);
  const gridId = useId();

  return <div className="studio-catalog">
    <div className="studio-catalog-toolbar">
      <div className="studio-catalog-filters" role="group" aria-label="筛选 Blender 作品">
        {filters.map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} aria-controls={gridId} onClick={() => setFilter(item.id)}>
          {item.label}<span>{works.filter(work => matchesFilter(work, item.id)).length}</span>
        </button>)}
      </div>
      <span className="studio-catalog-count" aria-live="polite">{shown.length} 件练习</span>
    </div>
    <div id={gridId} className="studio-project-grid">
      {works.map(work => <div key={work.id} className={'studio-project-slot' + (shown.indexOf(work) % 2 === 1 ? ' is-offset' : '')} data-build-section hidden={!matchesFilter(work, filter)}><article className={'studio-project studio-project-' + work.id} data-build="place" style={{ '--studio-work-color': work.color } as CSSProperties}>
        <div className="studio-project-media">
          <span className="studio-project-measure" data-measure aria-hidden="true" />
          <span className="studio-project-format">{work.motion === 'presentation' ? '展示运镜' : '动画片段'}</span>
          {work.video ? <WorkFilm src={workAsset(work.video)} poster={workAsset(work.poster)} title={work.title} reduced={reduced} suspended={suspended || selected !== null} frameVariant={works.indexOf(work)} preview rectangular onOpen={() => setSelected(work)} />
            : <button type="button" className="studio-project-poster" aria-label={'查看' + work.title} onClick={() => setSelected(work)}><img src={workAsset(work.poster)} alt={work.caption} loading="lazy" /></button>}
        </div>
        <div className="studio-project-caption">
          <div><h3><button type="button" className="studio-project-title" onClick={() => setSelected(work)} aria-label={'查看' + work.title + '的影像与做法'}>{work.title}<Icon name="arrow-right-up-linear" size={22} /></button></h3><p>{work.caption}</p></div>
          <ul className="studio-project-tags" aria-label="作品标签">{work.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
        </div>
      </article><BuildCursors /></div>)}
    </div>
    {selected && <StudioWorkDetail key={selected.id} work={selected} articles={articles} reduced={reduced} onClose={() => setSelected(null)} onRead={id => { setSelected(null); onRead(id); }} />}
  </div>;
}

function StudioWorkDetail({ work, articles, reduced, onClose, onRead }: { work: PortfolioWork; articles: WeChatArticle[]; reduced: boolean; onClose: () => void; onRead: (id: string) => void }) {
  const [layer, setLayer] = useState<Layer>('film');
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const notes = studyNotes[work.id];
  const linked = articles.filter(article => article.workId === work.id);
  const layers: { id: Layer; label: string }[] = [{ id: 'film', label: '影像' }, { id: 'process', label: '做法' }, { id: 'source', label: '源文件' }];

  return <Modal title={work.title} onClose={onClose} wide className={'studio-work-dialog' + (expanded ? ' studio-work-expanded' : '')}>
    <div className="studio-layer-toolbar">
      <div className="studio-layer-switch" role="group" aria-label="切换作品层次">{layers.map(item => <button type="button" key={item.id} aria-pressed={layer === item.id} aria-controls={panelId} onClick={() => setLayer(item.id)}>{item.label}</button>)}</div>
      <span>{work.motion === 'presentation' ? '展示运镜' : '动画片段'}</span>
    </div>
    <div id={panelId} className="studio-work-panel" role="region" aria-label={layers.find(item => item.id === layer)?.label}>
      {layer === 'film' && <>
        <div className="studio-detail-film">{work.video ? <WorkFilm src={workAsset(work.video)} poster={workAsset(work.poster)} title={work.title} reduced={reduced} frameVariant={works.indexOf(work)} rectangular expanded={expanded} onExpand={() => setExpanded(value => !value)} /> : <img src={workAsset(work.poster)} alt={work.caption} />}</div>
        <p className="studio-detail-caption">{work.caption}</p>
      </>}
      {layer === 'process' && <div className="studio-process-layer"><span className="studio-layer-label">Blender 练习</span><h3>{notes.focus}</h3><p>{notes.note}</p><ul aria-label="练习内容">{notes.elements.map(item => <li key={item}>{item}</li>)}</ul>{linked.length > 0 && <div className="studio-related-writing"><h4>相关笔记</h4>{linked.map(article => <button type="button" onClick={() => onRead(article.id)} key={article.id}>{article.title}<Icon name="arrow-right-up-linear" size={18} /></button>)}</div>}</div>}
      {layer === 'source' && <div className="studio-source-layer"><Icon name="document-text-linear" size={36} /><span>Blender 工程</span><h3>{work.sourceFile}</h3><p>原始工程保存在本地。网页展示的是渲染后的短片。</p><dl><div><dt>内容</dt><dd>{work.caption}</dd></div><div><dt>展示方式</dt><dd>{work.motion === 'presentation' ? '围绕作品的展示运镜' : '工程中的动画片段'}</dd></div></dl></div>}
    </div>
  </Modal>;
}
