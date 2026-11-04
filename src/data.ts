import { defaultProfile } from './default-profile.js';
import { defaultWeChatCollection } from './archived-writing';
import { works } from './portfolio';
import { validateWeChat, type WeChatCollection } from './wechat';
import type { KeyboardSkill } from './scene/scene';
export type Entry = { id: string; category: string; title: string; description: string; detail: string; label: string; tags: string[]; url: string; image?: string };
export type Profile = {
  version: number; isDemo: boolean; name: string; role: string; intro: string; bio: string; email: string;
  entries: Entry[]; facets: Record<string, {caption: string; title: string; description: string; tags: string[]}>; wechat?: WeChatCollection; wechatAutoUpdate?: boolean;
  keyboard?: {group?: string; label: string; title?: string; description: string; shortLabel?: string; hotkey?: string; color?: string; icon?: string}[];
};
export const PROFILE_KEY = 'personal-atlas-profile-v1';
export const baseProfile: Profile = {
  ...defaultProfile,
  wechat: defaultWeChatCollection,
  name: 'yo7',
  role: '理工科在读。',
  intro: '这里放我的学习笔记和 Blender 练习。',
  bio: '我叫 yo7，读理工科。学习笔记主要写物理、C++ 和材料力学。也做一些 Blender 练习，偶尔在公众号里聊打球和看过的剧。',
  facets: {
    skills: {caption:'在学',title:'学习笔记',description:'最近在学物理、C++、概率论和材料力学。',tags:['C++ 学习','物理','概率论','材料与工程力学']},
    interests: {caption:'Blender',title:'做过的练习',description:'做了些草地、玻璃、云和动画练习。',tags:['Blender 练习','几何节点','材质','风格化渲染']},
    traits: {caption:'公众号',title:'学习日记',description:'公众号里也有打球、看剧和日常的事。',tags:['学习记录','实验观察','日常碎念']},
  },
};

// Compare the entire content so a familiar template ID never hides an edited entry.
function sameContent(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Object.keys(left), rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && leftKeys.every(key =>
    Object.prototype.hasOwnProperty.call(right, key) && sameContent((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]));
}
export function isTemplateEntry(entry: Entry): boolean {
  return defaultProfile.entries.some(template => sameContent(entry, template));
}

export type ProfileIdentity = Pick<Profile, 'name' | 'role' | 'intro' | 'bio' | 'facets'>;
// Exact defaults from previous public releases. Only unchanged fields receive
// the current display copy; saved profiles and independently edited facets stay intact.
const previousYo7Identities = [{
  role: '理工科写作者，也做视觉实验。',
  intro: '把没想明白的事写下来，把想象做成看得见的东西。',
  bio: '我在「yo7的堂吉诃德」记录理工科学习、实验观察和日常里冒出来的问题，也用 Blender 做材质、几何节点与风格化练习。',
  facets: {
    skills: {caption:'正在学',title:'把问题一点点想明白。',description:'记录 C++、物理、概率论、材料与工程力学的学习，也记下暂时没有答案的问题。',tags:['C++ 学习','物理','概率论','材料与工程力学']},
    interests: {caption:'正在做',title:'让想象有一个形状。',description:'用 Blender 做材质、几何节点与风格化练习，试着让草地起风，让玻璃接住光。',tags:['Blender 练习','几何节点','材质','风格化渲染']},
    traits: {caption:'写下来的',title:'从一件小事继续追问。',description:'一张弯曲的滤纸、一阵风、早上七点的羽毛球：学习和日常的片段，都写进「yo7的堂吉诃德」。',tags:['学习记录','实验观察','日常碎念']},
  },
}, {
  role: '写理工科笔记，也做 Blender。',
  intro: '物理、代码，偶尔跑题。',
  bio: '公众号里写学习笔记和日常。Blender 里试试材质、节点和动画。',
  facets: {
    skills: {caption:'在学',title:'学习笔记',description:'物理、C++，还有材料与力学。',tags:['C++ 学习','物理','概率论','材料与工程力学']},
    interests: {caption:'Blender',title:'做过的练习',description:'材质、几何节点和风格化渲染。',tags:['Blender 练习','几何节点','材质','风格化渲染']},
    traits: {caption:'公众号',title:'学习日记',description:'会写实验，也写打球和追剧。',tags:['学习记录','实验观察','日常碎念']},
  },
}];
export function profileIdentity(profile: Profile): ProfileIdentity {
  const identity: ProfileIdentity = {name:profile.name,role:profile.role,intro:profile.intro,bio:profile.bio,facets:profile.facets};
  if (!profile.isDemo) return identity;
  if (profile.name === 'yo7') {
    for (const field of ['role', 'intro', 'bio'] as const) {
      if (previousYo7Identities.some(previous => profile[field] === previous[field])) identity[field] = baseProfile[field];
    }
    identity.facets = {...profile.facets};
    for (const field of ['skills', 'traits', 'interests'] as const) {
      if (previousYo7Identities.some(previous => sameContent(profile.facets[field], previous.facets[field]))) identity.facets[field] = baseProfile.facets[field];
    }
    return identity;
  }
  if (!['Your Name', '等你写下名字'].includes(profile.name)) return identity;
  const previousDefaults = {
    role: [defaultProfile.role],
    intro: [defaultProfile.intro, '把好奇心，变成可以触碰的东西。'],
    bio: [defaultProfile.bio, '这里留给真实的我：正在做的事、走过的路，以及让我眼睛发亮的热爱。个人资料整理好后，会在这里更新。'],
  };
  identity.name = baseProfile.name;
  for (const field of ['role', 'intro', 'bio'] as const) {
    if (previousDefaults[field].includes(profile[field])) identity[field] = baseProfile[field];
  }
  identity.facets = {...profile.facets};
  for (const field of ['skills', 'traits', 'interests'] as const) {
    if (sameContent(profile.facets[field], defaultProfile.facets[field])) identity.facets[field] = baseProfile.facets[field];
  }
  return identity;
}
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
export const shortcutCode = (value?: string) => {
  if (!value) return undefined;
  if (/^[a-z]$/i.test(value)) return `Key${value.toUpperCase()}`;
  if (/^\d$/.test(value)) return `Digit${value}`;
  if (/^key[a-z]$/i.test(value)) return `Key${value.slice(-1).toUpperCase()}`;
  if (/^digit\d$/i.test(value)) return `Digit${value.slice(-1)}`;
  return undefined;
};
export function safeUrl(value: string, image = false) {
  try { const url = new URL(value, location.href); return ['https:', 'http:'].includes(url.protocol) && (!image || url.origin === location.origin || url.protocol === 'https:') ? url.href : ''; } catch { return ''; }
}
export function validateProfile(value: unknown): Profile {
  if (!value || typeof value !== 'object') throw new Error('文件需要是个人资料 JSON 对象。');
  const p = value as Profile;
  if (!p.wechat) p.wechat = defaultWeChatCollection;
  if (p.version !== 1 || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 60) throw new Error('请填写姓名，并保留 version: 1。');
  for (const key of ['role','intro','bio','email'] as const) if (typeof p[key] !== 'string' || p[key].length > 5000) throw new Error(`请检查 ${key} 字段。`);
  if (!Array.isArray(p.entries) || p.entries.length > 80) throw new Error('档案需要是数组，最多 80 条。');
  p.entries.forEach(e => {
    if (!e || ['id','category','title','description','detail','label','url'].some(k => typeof e[k as keyof Entry] !== 'string') || !Array.isArray(e.tags) || e.tags.some(t => typeof t !== 'string')) throw new Error('有一条档案缺少标题、分类或内容，请参照模板。');
  });
  if (new Set(p.entries.map(e => e.id)).size !== p.entries.length) throw new Error('每条档案的 id 必须不同。');
  if (p.wechat) p.wechat = validateWeChat(p.wechat);
  for (const key of ['skills','traits','interests']) {
    const f = p.facets?.[key];
    if (!f || typeof f.title !== 'string' || typeof f.description !== 'string' || !Array.isArray(f.tags) || f.tags.some(t => typeof t !== 'string')) throw new Error('请保留 facets 中的技能、特点和兴趣。');
  }
  if (p.keyboard && (!Array.isArray(p.keyboard) || p.keyboard.length > 48 || p.keyboard.some(k => !k || typeof k.label !== 'string' || typeof k.description !== 'string'))) throw new Error('键位需要包含 label 和 description，最多 48 个。');
  if(p.keyboard){
    if(p.keyboard.some(k=>['title','color','icon','hotkey'].some(field=>k[field as keyof typeof k]!==undefined&&typeof k[field as keyof typeof k]!=='string')))throw new Error('键位标题、颜色、图标和快捷键需要填写文字。');
    if(p.keyboard.some(k=>k.hotkey&&!shortcutCode(k.hotkey)))throw new Error('快捷键请使用单个字母或数字，例如 Q、1。');
    const shortcuts=p.keyboard.map(k=>shortcutCode(k.hotkey)).filter(Boolean);if(new Set(shortcuts).size!==shortcuts.length)throw new Error('每颗键的快捷键必须不同。');
  }
  return { ...p, isDemo: p.isDemo !== false };
}
export function loadProfile(): Profile {
  try { const stored = localStorage.getItem(PROFILE_KEY); if (stored) return validateProfile(JSON.parse(stored)); } catch { /* Keep invalid saved data recoverable. */ }
  return baseProfile;
}
const demos = [
  ['JavaScript','js','#ff9408'],['TypeScript','ts','#3178c6'],['React','react','#51c7df'],['Next.js','nextjs','#292d31'],['Vue','vue','#42b883'],['Expo','expo','#171b2c'],
  ['Tailwind','tailwind','#31b4c3'],['Node.js','nodejs','#65a53d'],['Express','express','#282828'],['Bun','bun','#df7fab'],['PostgreSQL','postgres','#3675a1'],['MongoDB','mongodb','#57b22e'],
  ['Linux','linux','#282b31'],['Git','git','#ec503a'],['Vim','vim','#56a347'],['Docker','docker','#1c9de3'],['Nginx','nginx','#59b932'],['Claude','claude','#cf795c'],
  ['Cloudflare','cloudflare','#f39138'],['Google Cloud','gcp','#3b91d3'],['AWS','aws','#e99834'],['Home Assistant','homeassistant','#36aee9'],['Proxmox','proxmox','#e68c27'],['Steam','steam','#182139'],
];
export type Skill = KeyboardSkill & { detail: string; demo: boolean; entryId?: string };
const utilityKeys = [
  {name:'action-writing',label:'文章',shortDescription:'读公众号文章',color:'#93b5a5'},
  {name:'action-about',label:'关于',shortDescription:'认识我',color:'#9ba9c4'},
  {name:'action-skills',label:'在学',shortDescription:'学习与练习',color:'#c3977f'},
  {name:'action-experience',label:'近况',shortDescription:'在学、Blender、日常',color:'#b3a06d'},
  {name:'action-achievements',label:'阅读',shortDescription:'直接翻阅文章',color:'#e4a048'},
  {name:'action-projects',label:'作品',shortDescription:'跳至作品集',color:'#85abb9'},
  {name:'action-contact',label:'联系',shortDescription:'联系方式',color:'#ba8ca0'},
  {name:'action-theme',label:'明暗',shortDescription:'切换明暗主题',color:'#97ac81'},
  {name:'action-sound',label:'音效',shortDescription:'开关机械键声音',color:'#7894aa'},
  {name:'action-rotate',label:'旋转',shortDescription:'旋转键盘',color:'#b98a65'},
  {name:'action-cat',label:'摸猫',shortDescription:'和小猫互动',color:'#a889b3'},
  {name:'action-home',label:'首页',shortDescription:'回到首页',color:'#829da0'},
] as const;
export function skillsFor(profile: Profile): Skill[] {
  const portfolio = works.map(work => ({
    name:`work-${work.id}`, label:work.keyLabel, shortDescription:work.caption, detail:`${work.caption}。源文件：${work.sourceFile}`,
    color:work.color, icon:'', demo:false, workId:work.id,
  }));
  const actions = utilityKeys.map(key => ({
    ...key, label:key.label, name:key.name, icon:'', demo:false,
    detail:key.shortDescription + '。点击或 Tab + Enter。',
  }));
  const custom = (profile.keyboard ?? []).map((key,i) => ({
    name:`key-${i}`, label:key.title || key.label, shortDescription:key.description.slice(0,160), detail:key.description,
    color:key.color && /^#[\da-f]{6}$/i.test(key.color) ? key.color : demos[i%demos.length][2], icon:key.icon ? safeUrl(key.icon,true) : '', demo:profile.isDemo, shortcut:shortcutCode(key.hotkey),
  }));
  return [...portfolio,...actions,...custom].slice(0,48);
}
export const categories: Record<string,string> = {project:'作品',achievement:'成就',experience:'经历',note:'记录'};
