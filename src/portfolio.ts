/** User-supplied Blender studies; no commercial commissions or original character design claimed. */
export type WorkId = 'particles' | 'grass' | 'pop' | 'liquid' | 'cloud' | 'organic';
export type PortfolioWork = {
  id: WorkId; title: string; word: string; keyLabel: string; caption: string;
  color: string; sourceFile: string; tags: string[]; poster: string; video?: string;
};
export const works: PortfolioWork[] = [
  {id:'particles',title:'粒子Logo',word:'Gather.',keyLabel:'粒子',caption:'粒子 Logo 练习',color:'#e9a34b',sourceFile:'演示文件.blend',tags:['Blender','粒子练习'],poster:'assets/works/particles/poster.webp'},
  {id:'grass',title:'草地与风',word:'Breathe.',keyLabel:'草地',caption:'几何节点草地与风',color:'#8ba85c',sourceFile:'grass Do It With Me.blend',tags:['Blender','几何节点'],poster:'assets/works/grass/poster.webp'},
  {id:'pop',title:'波普练习',word:'Pop.',keyLabel:'波普',caption:'角色风格化动画练习',color:'#d77a92',sourceFile:'blend练习1.blend',tags:['Blender','风格化渲染'],poster:'assets/works/pop/poster.webp',video:'assets/works/pop/film.mp4'},
  {id:'liquid',title:'液态玻璃',word:'Liquid.',keyLabel:'玻璃',caption:'层叠玻璃圆盘的材质练习',color:'#78aabc',sourceFile:'液态玻璃.blend',tags:['Blender','材质练习'],poster:'assets/works/liquid/poster.webp'},
  {id:'cloud',title:'云体',word:'Drift.',keyLabel:'云',caption:'几何节点云体练习',color:'#a4a7c8',sourceFile:'yun.blend',tags:['Blender','几何节点'],poster:'assets/works/cloud/poster.webp'},
  {id:'organic',title:'有机方块',word:'Grow.',keyLabel:'有机',caption:'几何节点形变练习',color:'#b1ac79',sourceFile:'有机方块.blend',tags:['Blender','几何节点'],poster:'assets/works/organic/poster.webp'},
];
export const workById = (id: string | null) => works.find(work => work.id === id);
export const workAsset = (path: string) => import.meta.env.BASE_URL + path;
