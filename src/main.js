import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { icons } from './icons.js';
import { defaultProfile } from './default-profile.js';
import { createKeyboardScene } from './keyboard.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const storageKey = 'personal-atlas-profile-v1';
const themeKey = 'personal-atlas-theme-v1';
const categories = {
  project: { name: '项目作品', code: 'P' },
  achievement: { name: '成就荣誉', code: 'A' },
  experience: { name: '成长经历', code: 'E' },
  note: { name: '随想记录', code: 'N' }
};
const keyboardGroups = new Set(['skill', 'project', 'achievement', 'experience', 'note', 'custom']);
const clone = (value) => JSON.parse(JSON.stringify(value));
let profile = clone(defaultProfile);
let activeFilter = 'all';
let activeFacet = 'traits';
let activeKeyIndex = 0;
let lastRandom = -1;
let toastTimer;
let editorOpener;
let lenis;
let ticker;
let keyboardScene;
let motionListeners;
let profileKeys = [];
const lifecycle = new AbortController();
const listen = (element, event, handler, options = {}) => element.addEventListener(event, handler, { ...options, signal: lifecycle.signal });

function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach(element => {
    const source = icons[element.dataset.icon];
    if (source) element.innerHTML = `<svg viewBox="0 0 ${source.width || 24} ${source.height || 24}" aria-hidden="true" focusable="false">${source.body}</svg>`;
  });
}

function node(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function icon(name, className = '') {
  const element = node('span', className);
  element.dataset.icon = name;
  element.setAttribute('aria-hidden', 'true');
  return element;
}

function safeURL(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function textField(value, name, max, optional = false) {
  if (optional && (value === undefined || value === null || value === '')) return '';
  if (typeof value !== 'string' || !value.trim()) throw new Error(`“${name}”需要填写文字。`);
  if (value.length > max) throw new Error(`“${name}”不能超过 ${max} 字。`);
  return value.trim();
}

function tagsField(value, name) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) throw new Error(`“${name}”应是最多 20 项的文字数组。`);
  return value.map(item => textField(item, name, 60));
}

function validateProfile(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('文件内容应是一个档案对象，请使用下载的模板。');
  if (raw.version !== 1) throw new Error('档案格式版本不匹配，请使用 version 为 1 的本站模板。');
  const clean = {
    version: 1,
    isDemo: raw.isDemo === true,
    name: textField(raw.name, '名字', 40),
    role: textField(raw.role, '身份', 80),
    intro: textField(raw.intro, '首页欢迎语', 240),
    bio: textField(raw.bio, '关于我', 1000),
    email: textField(raw.email, '邮箱', 150, true)
  };
  if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw new Error('邮箱格式不正确，请检查后重新导入。');
  if (!Array.isArray(raw.entries) || raw.entries.length > 200) throw new Error('entries 应是最多 200 项的档案数组。');
  clean.entries = raw.entries.map((item, index) => {
    if (!item || typeof item !== 'object' || !Object.hasOwn(categories, item.category)) throw new Error(`第 ${index + 1} 条档案的类别应为 project、achievement、experience 或 note。`);
    const url = textField(item.url, '作品链接', 2000, true);
    if (url && !safeURL(url)) throw new Error(`第 ${index + 1} 条档案请使用完整的 http 或 https 链接。`);
    return {
      id: `entry-${index + 1}`,
      category: item.category,
      title: textField(item.title, `第 ${index + 1} 条标题`, 120),
      description: textField(item.description, '简介', 300, true),
      detail: textField(item.detail, '详细内容', 5000, true),
      label: textField(item.label, '时间或简短标签', 80, true),
      tags: tagsField(item.tags, '档案标签'),
      url: safeURL(url)
    };
  });
  clean.facets = {};
  for (const key of ['skills', 'traits', 'interests']) {
    const item = raw.facets?.[key];
    if (!item || typeof item !== 'object') throw new Error(`请补充 facets.${key}，可参照完整模板。`);
    clean.facets[key] = {
      caption: textField(item.caption, '切面说明', 80),
      title: textField(item.title, '切面标题', 120),
      description: textField(item.description, '切面介绍', 1000),
      tags: tagsField(item.tags, '切面标签')
    };
  }
  if (raw.keyboard !== undefined && (!Array.isArray(raw.keyboard) || raw.keyboard.length > 32)) throw new Error('keyboard 应是最多 32 项的键帽档案数组。');
  clean.keyboard = (raw.keyboard || []).map((item, index) => {
    if (!item || typeof item !== 'object' || !keyboardGroups.has(item.group)) throw new Error(`第 ${index + 1} 颗自定义键帽的 group 应为 skill、project、achievement、experience、note 或 custom。`);
    const color = item.color || '';
    if (color && !/^#[\da-f]{6}$/i.test(color)) throw new Error(`第 ${index + 1} 颗键帽的 color 应是 #RRGGBB 格式。`);
    return {
      id: `custom-key-${index + 1}`,
      type: item.group,
      label: textField(item.label, `第 ${index + 1} 颗键帽名称`, 14),
      shortLabel: textField(item.shortLabel || item.label, `第 ${index + 1} 颗键帽标记`, 8),
      title: textField(item.title || item.label, `第 ${index + 1} 颗键帽标题`, 120),
      description: textField(item.description, `第 ${index + 1} 颗键帽说明`, 1000),
      hotkey: textField(item.hotkey || '', '热键', 1, true),
      color
    };
  });
  return clean;
}

function announce(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3200);
}

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(profile)); return true; }
  catch { $('#editor-status').textContent = '预览已更新，但浏览器无法保存。请导出档案备份。'; return false; }
}

function refreshLayout() {
  requestAnimationFrame(() => { lenis?.resize(); ScrollTrigger.refresh(); });
}

function deriveKeyboard(profileData) {
  if (profileData.keyboard?.length) return profileData.keyboard;
  const keys = [];
  profileData.facets.skills.tags.forEach((label, index) => keys.push({
    id: `skill-${index}`, type: 'skill', label, shortLabel: label.slice(0, 8), title: label,
    description: profileData.facets.skills.description, hotkey: String(index + 1)
  }));
  profileData.entries.slice(0, 14).forEach((entry, index) => keys.push({
    id: entry.id, type: entry.category, entryId: entry.id, label: entry.title,
    shortLabel: categories[entry.category].code, title: entry.title,
    description: entry.description || entry.detail || categories[entry.category].name,
    hotkey: index < 8 ? String(index + 1) : ''
  }));
  for (const facetKey of ['traits', 'interests']) {
    const item = profileData.facets[facetKey];
    keys.push({ id: `facet-${facetKey}`, type: 'facet', facetKey, label: item.caption, shortLabel: facetKey === 'traits' ? '底色' : '热爱', title: item.title, description: item.description });
  }
  keys.push(
    { id: 'about', type: 'action', action: 'about', label: '关于', shortLabel: '关于', title: '关于我', description: profileData.bio },
    { id: 'theme', type: 'action', action: 'theme', label: '主题', shortLabel: '主题', title: '换个主题', description: '切换明暗外观。' },
    { id: 'random', type: 'action', action: 'random', label: '随机', shortLabel: '随机', title: '随机线索', description: '抽取一条档案线索。' },
    { id: 'chat', type: 'action', action: 'chat', label: '留言', shortLabel: '留言', title: '访客留言', description: '和正在浏览的人聊几句。' },
    { id: 'edit', type: 'action', action: 'edit', label: '编辑', shortLabel: '编辑', title: '编辑档案', description: '补充基本资料或导入完整档案。' },
    { id: 'contact', type: 'action', action: 'contact', label: '联系', shortLabel: '联系', title: '联系我', description: profileData.email || '联系方式会在你补充资料后显示。' }
  );
  return keys.slice(0, 32);
}

function groupName(key) {
  if (key.type === 'skill') return '技能';
  if (categories[key.type]) return categories[key.type].name;
  if (key.type === 'facet') return key.facetKey === 'traits' ? '个人特点' : '兴趣热爱';
  return '快速操作';
}

function renderKeyDetails(key, index, activate = false) {
  if (!key) return;
  activeKeyIndex = index;
  $('#inspector-group').textContent = groupName(key);
  $('#inspector-number').textContent = `${String(index + 1).padStart(2, '0')} / ${String(profileKeys.length).padStart(2, '0')}`;
  $('#inspector-title').textContent = key.title;
  let description = key.description || '';
  if (key.type === 'skill' && profile.isDemo) description = '这是键位示意。导入真实技能后，每颗键帽都会展开对应说明。';
  $('#inspector-description').textContent = description;
  $('#selected-key-label').textContent = `当前键位 / ${key.label}`;
  $('#activate-key').textContent = `按下「${key.shortLabel}」`;
  const actions = $('#inspector-actions');
  actions.replaceChildren();
  if (categories[key.type]) {
    const link = node('a', 'inspector-link', '在档案中查看');
    link.href = '#archive';
    listen(link, 'click', () => openArchiveEntry(key.entryId));
    actions.append(link);
  } else if (key.type === 'facet') {
    const link = node('a', 'inspector-link', '展开这一面');
    link.href = '#facets';
    listen(link, 'click', () => renderFacet(key.facetKey));
    actions.append(link);
  } else if (key.type === 'action' && !activate) {
    const label = key.action === 'edit' ? '打开编辑面板' : key.action === 'chat' ? '打开留言' : key.action === 'contact' ? '联系我' : key.action === 'theme' ? '切换主题' : key.action === 'random' ? '抽一条线索' : '查看关于我';
    const button = node('button', 'inspector-link', label);
    listen(button, 'click', () => runKeyAction(key.action));
    actions.append(button);
  }
}

function renderEntries() {
  const list = $('#archive-list');
  const fragment = document.createDocumentFragment();
  const counters = {};
  profile.entries.forEach((item, index) => {
    counters[item.category] = (counters[item.category] || 0) + 1;
    const category = categories[item.category];
    const details = node('details', 'archive-item');
    details.dataset.category = item.category;
    details.dataset.search = [item.title, item.description, item.detail, ...item.tags].join(' ').toLocaleLowerCase();
    details.id = `archive-entry-${index}`;
    const summary = node('summary');
    summary.append(node('span', 'archive-code', `${category.code} ${String(counters[item.category]).padStart(2, '0')}`));
    const title = node('div', 'archive-title');
    title.append(node('span', 'category-label', `${category.name}${profile.isDemo ? ' / 示意' : ''}`));
    title.append(node('h3', '', item.title), node('p', '', item.description));
    summary.append(title, node('span', 'archive-type', item.label), icon('add-linear', 'item-icon'));
    const body = node('div', 'archive-detail');
    body.append(node('p', '', item.detail || '这段故事还在整理中。'));
    if (item.tags.length) {
      const tagRow = node('div', 'detail-tags');
      item.tags.forEach(tag => tagRow.append(node('span', 'detail-tag', tag)));
      body.append(tagRow);
    }
    if (item.url) {
      const link = node('a', 'detail-link', '打开相关链接');
      link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.append(icon('arrow-right-up-linear'));
      body.append(link);
    }
    details.append(summary, body);
    fragment.append(details);
  });
  list.replaceChildren(fragment);
  hydrateIcons(list);
  $('[data-count="all"]').textContent = String(profile.entries.length).padStart(2, '0');
  applyFilter();
}

function applyFilter() {
  const query = $('#archive-search').value.trim().toLocaleLowerCase();
  let count = 0;
  $$('.archive-item').forEach(item => {
    const visible = (activeFilter === 'all' || item.dataset.category === activeFilter) && (!query || item.dataset.search.includes(query));
    item.hidden = !visible;
    if (visible) count++;
  });
  $('#empty-results').hidden = count > 0;
  $('#reset-search').hidden = profile.entries.length === 0 && !query;
  $('#filter-status').textContent = `找到 ${count} 条档案`;
  $('#archive-total').textContent = `${count} 条${profile.isDemo ? '内容示意' : '档案'}`;
  refreshLayout();
}

function renderFacet(key) {
  const item = profile.facets[key];
  if (!item) return;
  activeFacet = key;
  $$('.facet-tabs button').forEach(button => {
    const selected = button.dataset.facet === key;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  $('#facet-panel').setAttribute('aria-labelledby', `tab-${key}`);
  $('#facet-caption').textContent = item.caption;
  $('#facet-title').textContent = item.title;
  $('#facet-description').textContent = item.description;
  $('#facet-tags').replaceChildren(...item.tags.map(tag => node('span', '', tag)));
  $('#facet-note').textContent = profile.isDemo ? '内容示意，真实资料待补充' : '';
  refreshLayout();
}

function renderProfile() {
  $('#hero-name').textContent = profile.name;
  $('#brand-name').textContent = profile.name;
  $('#footer-name').textContent = profile.name;
  $('#profile-role').textContent = profile.role;
  $('#hero-intro').textContent = profile.intro;
  $('#profile-state').textContent = profile.isDemo ? '正在等待你的故事' : '档案已更新';
  $('#contact-info').textContent = profile.email || '联系方式会在你补充资料后显示。';
  document.title = profile.isDemo ? '个人档案 · 键位已就绪' : `${profile.name} · 个人档案`;
  const contact = $('#contact-link');
  contact.href = profile.email ? `mailto:${encodeURIComponent(profile.email).replace('%40', '@')}` : '#contact-info';
  profileKeys = deriveKeyboard(profile);
  $('#keyboard-count').textContent = `${String(profileKeys.length).padStart(2, '0')} KEYS`;
  keyboardScene?.setKeys(profileKeys);
  if (activeKeyIndex >= profileKeys.length) activeKeyIndex = 0;
  renderKeyDetails(profileKeys[activeKeyIndex], activeKeyIndex);
  renderEntries();
  renderFacet(activeFacet);
  refreshLayout();
}

function openArchiveEntry(entryId) {
  const entry = profile.entries.findIndex(item => item.id === entryId);
  if (entry < 0) return;
  activeFilter = 'all';
  $('#archive-search').value = '';
  $$('.filter-button').forEach(button => {
    const selected = button.dataset.filter === 'all';
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  applyFilter();
  const detail = $(`#archive-entry-${entry}`);
  if (!detail) return;
  detail.open = true;
  requestAnimationFrame(() => {
    lenis ? lenis.scrollTo(detail, { offset: -90 }) : detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('summary', detail).focus({ preventScroll: true });
  });
}

function setTheme(theme, notify = false) {
  document.documentElement.dataset.theme = theme;
  const light = theme === 'light';
  $('#theme-toggle').setAttribute('aria-pressed', String(light));
  $('#theme-toggle').setAttribute('aria-label', `切换${light ? '深色' : '浅色'}主题`);
  $('#theme-toggle').textContent = light ? '深色' : '浅色';
  document.querySelector('meta[name="theme-color"]').content = light ? '#eeece2' : '#111512';
  try { localStorage.setItem(themeKey, theme); } catch {}
  keyboardScene?.setTheme(theme);
  if (notify) announce(`${light ? '浅色' : '深色'}主题已启用`);
}

function selectRandom() {
  if (!profile.entries.length) { announce('导入档案后，这里会出现随机线索。'); return; }
  let index = Math.floor(Math.random() * profile.entries.length);
  if (profile.entries.length > 1 && index === lastRandom) index = (index + 1) % profile.entries.length;
  lastRandom = index;
  const item = profile.entries[index];
  const keyIndex = profileKeys.findIndex(key => key.entryId === item.id);
  if (keyIndex >= 0) keyboardScene?.select(keyIndex, true);
  else {
    $('#inspector-title').textContent = item.title;
    $('#inspector-description').textContent = item.description;
  }
  announce(`随机线索：${item.title}`);
}

function runKeyAction(action) {
  switch (action) {
    case 'about': lenis ? lenis.scrollTo('#facets') : $('#facets').scrollIntoView({ behavior: 'smooth' }); break;
    case 'theme': setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light', true); break;
    case 'random': selectRandom(); break;
    case 'chat': toggleChat(true); break;
    case 'edit': openEditor({ currentTarget: $('.editor-trigger') }); break;
    case 'contact': lenis ? lenis.scrollTo('#contact') : $('#contact').scrollIntoView({ behavior: 'smooth' }); break;
    default: announce('这个键位还没有配置动作。');
  }
}

hydrateIcons();
try {
  const saved = localStorage.getItem(storageKey);
  if (saved) profile = validateProfile(JSON.parse(saved));
  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;
} catch { announce('本地档案未能读取，已显示示意内容。'); }

keyboardScene = createKeyboardScene($('#keyboard-canvas'), deriveKeyboard(profile), {
  onSelect: (key, index, activate) => {
    renderKeyDetails(key, index, activate);
    if (activate && key?.type === 'action') runKeyAction(key.action);
    if (activate && categories[key?.type]) openArchiveEntry(key.entryId);
    if (activate && key?.type === 'facet') renderFacet(key.facetKey);
  },
  onStatus: message => {
    const fallback = $('#keyboard-fallback');
    const unavailable = message.includes('不可用');
    fallback.hidden = !unavailable;
    if (!unavailable) return;
    fallback.replaceChildren(node('p', '', '3D 预览不可用，请选择键位继续浏览。'));
    const fallbackKeys = node('div', 'keyboard-fallback-keys');
    deriveKeyboard(profile).forEach((key, index) => {
      const button = node('button', 'fallback-key', key.shortLabel || key.label);
      button.type = 'button';
      button.setAttribute('aria-label', `打开：${key.title || key.label}`);
      button.addEventListener('click', () => keyboardScene?.select(index, true), { signal: lifecycle.signal });
      fallbackKeys.append(button);
    });
    fallback.append(fallbackKeys);
  }
});
renderProfile();
setTheme(document.documentElement.dataset.theme);
$('#footer-year').textContent = String(new Date().getFullYear());

$$('.filter-button').forEach(button => listen(button, 'click', () => {
  activeFilter = button.dataset.filter;
  $$('.filter-button').forEach(item => {
    const selected = item === button;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  applyFilter();
}));
listen($('#archive-search'), 'input', applyFilter);
listen($('#reset-search'), 'click', () => {
  activeFilter = 'all';
  $('#archive-search').value = '';
  $$('.filter-button').forEach(button => {
    const selected = button.dataset.filter === 'all';
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  applyFilter();
});

const facetButtons = $$('.facet-tabs button');
facetButtons.forEach((button, index) => {
  listen(button, 'click', () => renderFacet(button.dataset.facet));
  listen(button, 'keydown', event => {
    let target;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = (index + 1) % facetButtons.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = (index + facetButtons.length - 1) % facetButtons.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = facetButtons.length - 1;
    if (target !== undefined) { event.preventDefault(); renderFacet(facetButtons[target].dataset.facet); facetButtons[target].focus(); }
  });
});

listen($('#theme-toggle'), 'click', () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light', true));
listen($('#previous-key'), 'click', () => keyboardScene?.select(activeKeyIndex - 1));
listen($('#next-key'), 'click', () => keyboardScene?.select(activeKeyIndex + 1));
listen($('#activate-key'), 'click', () => keyboardScene?.select(activeKeyIndex, true));

const editor = $('#editor');
const backdrop = $('#editor-backdrop');
function openEditor(event) {
  editorOpener = event.currentTarget;
  $('#editor-status').textContent = '';
  $('#reset-confirm').hidden = true;
  for (const field of ['name', 'role', 'intro', 'bio', 'email']) $('#profile-form').elements[field].value = profile[field];
  editor.hidden = false;
  backdrop.hidden = false;
  editor.setAttribute('role', 'dialog');
  editor.setAttribute('aria-modal', 'true');
  editor.setAttribute('data-lenis-prevent', '');
  document.body.classList.add('editor-open');
  lenis?.stop();
  $('#close-editor').focus();
}
function closeEditor() {
  editor.hidden = true;
  backdrop.hidden = true;
  document.body.classList.remove('editor-open');
  lenis?.start();
  editorOpener?.focus();
}
$$('.editor-trigger').forEach(button => listen(button, 'click', openEditor));
listen($('#close-editor'), 'click', closeEditor);
listen(backdrop, 'click', closeEditor);
listen(editor, 'keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeEditor(); return; }
  if (event.key === 'Tab') {
    const focusable = $$('a,button,input,textarea,[tabindex="0"]', editor).filter(item => !item.disabled && item.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
listen($('#profile-form'), 'submit', event => {
  event.preventDefault();
  try {
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    profile = validateProfile({ ...profile, ...fields });
    const saved = persist();
    renderProfile();
    $('#editor-status').textContent = saved ? '资料已保存到当前浏览器。' : '预览已更新，但无法写入浏览器，请导出备份。';
    announce('档案已更新');
  } catch (error) { $('#editor-status').textContent = error.message; }
});
listen($('#import-file'), 'change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const input = event.target;
  input.disabled = true;
  $('#editor-status').textContent = '正在读取档案…';
  try {
    if (file.size > 1024 * 1024) throw new Error('文件超过 1 MB，请缩减文字内容后重试。');
    let raw;
    try { raw = JSON.parse((await file.text()).replace(/^\uFEFF/, '')); }
    catch { throw new Error('文件不是有效的 JSON，请检查格式或使用本站模板。'); }
    profile = validateProfile(raw);
    const saved = persist();
    activeFilter = 'all';
    $('#archive-search').value = '';
    $$('.filter-button').forEach(button => {
      const selected = button.dataset.filter === 'all';
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    renderProfile();
    for (const field of ['name', 'role', 'intro', 'bio', 'email']) $('#profile-form').elements[field].value = profile[field];
    $('#editor-status').textContent = `已导入 ${profile.entries.length} 条档案与 ${profileKeys.length} 颗键帽。${saved ? '资料已保存在当前浏览器。' : '请立即导出备份。'}`;
    announce('档案已导入');
  } catch (error) { $('#editor-status').textContent = error.message; }
  finally { input.value = ''; input.disabled = false; }
});
listen($('#export-profile'), 'click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json;charset=utf-8' }));
  const anchor = node('a');
  anchor.href = url; anchor.download = 'my-personal-profile.json'; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('#editor-status').textContent = '档案已导出，请保留文件作为备份。';
});
listen($('#reset-profile'), 'click', () => { $('#reset-confirm').hidden = false; $('#confirm-reset').focus(); });
listen($('#cancel-reset'), 'click', () => { $('#reset-confirm').hidden = true; $('#reset-profile').focus(); });
listen($('#confirm-reset'), 'click', () => {
  try { localStorage.removeItem(storageKey); } catch {}
  profile = clone(defaultProfile); activeFilter = 'all';
  renderProfile(); closeEditor(); announce('已恢复内容示意');
});

const mobileNav = $('#mobile-nav');
const menuButton = $('#menu-toggle');
function closeMenu() { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); }
listen(menuButton, 'click', () => {
  const opening = mobileNav.hidden;
  mobileNav.hidden = !opening;
  menuButton.setAttribute('aria-expanded', String(opening));
});
$$('a', mobileNav).forEach(link => listen(link, 'click', closeMenu));
listen(document, 'keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); } });

const chatPanel = $('#chat-panel');
const chatButton = $('#chat-toggle');
let unreadCount = 0;
function toggleChat(open = chatPanel.hidden) {
  chatPanel.hidden = !open;
  chatButton.setAttribute('aria-expanded', String(open));
  if (open) {
    unreadCount = 0; $('#unread-count').hidden = true;
    requestAnimationFrame(() => $('#chat-input').focus());
  }
}
listen(chatButton, 'click', () => toggleChat());
listen($('#close-chat'), 'click', () => { toggleChat(false); chatButton.focus(); });

const clientId = (() => {
  try {
    const key = 'personal-atlas-tab-id';
    let id = sessionStorage.getItem(key);
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(key, id); }
    return id;
  } catch { return `tab-${Math.random().toString(36).slice(2)}`; }
})();
const peerColor = ['#dafa68', '#63c4b2', '#7897de', '#f07862', '#9f94cf'][Math.floor(Math.random() * 5)];
const peers = new Map();
const peerElements = new Map();
let localChannel;
let socket;
let socketRetry;
let lastCursorTime = 0;
const room = `${location.origin}${location.pathname}`;

function updatePresence() {
  $('#online-count').textContent = String(peers.size + 1);
  const label = socket?.readyState === WebSocket.OPEN ? '实时在线' : '本地房间';
  $('#presence-label').textContent = label;
  $('#chat-state').textContent = socket?.readyState === WebSocket.OPEN ? '实时连接中' : '本地标签页实时互通';
}

function removePeer(id) {
  peers.delete(id);
  peerElements.get(id)?.remove();
  peerElements.delete(id);
  updatePresence();
}

function receivePeer(data) {
  if (!data || data.id === clientId || data.room !== room) return;
  if (data.type === 'leave') { removePeer(data.id); return; }
  const record = { ...peers.get(data.id), ...data, lastSeen: Date.now() };
  peers.set(data.id, record);
  if (data.type === 'cursor' && Number.isFinite(data.x) && Number.isFinite(data.y)) {
    let element = peerElements.get(data.id);
    if (!element) {
      element = node('div', 'remote-cursor');
      element.style.setProperty('--cursor-color', data.color || peerColor);
      const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      cursor.setAttribute('viewBox', '0 0 18 22');
      cursor.innerHTML = '<path d="M2 1.5 16.2 14l-6 .8-3.5 5.5L2 1.5Z" fill="currentColor" stroke="#101512" stroke-width="1.4" stroke-linejoin="round"/>';
      element.append(cursor, node('span', '', data.name || '访客'));
      $('#live-cursors').append(element);
      peerElements.set(data.id, element);
    }
    element.style.transform = `translate3d(${Math.max(0, Math.min(1, data.x)) * innerWidth}px, ${Math.max(0, Math.min(1, data.y)) * innerHeight}px, 0)`;
  }
  updatePresence();
}

function sendRealtime(data) {
  const packet = { ...data, id: clientId, name: profile.name, room, color: peerColor, ts: Date.now() };
  try { localChannel?.postMessage(packet); } catch {}
  if (socket?.readyState === WebSocket.OPEN) {
    try { socket.send(JSON.stringify(packet)); } catch {}
  }
}

try {
  if ('BroadcastChannel' in window) {
    localChannel = new BroadcastChannel('personal-atlas-live-v1');
    localChannel.addEventListener('message', event => {
      const data = event.data;
      receivePeer(data);
      if (data?.type === 'chat' && data.id !== clientId && data.room === room) appendChatMessage(data, false);
    });
  }
} catch {}

const realtimeUrl = import.meta.env.VITE_REALTIME_URL || '';
function connectRealtime() {
  if (!realtimeUrl || !/^wss?:\/\//i.test(realtimeUrl) || socketRetry) return;
  try {
    socket = new WebSocket(realtimeUrl);
    socket.addEventListener('open', () => {
      socketRetry = undefined;
      sendRealtime({ type: 'join' });
      updatePresence();
    });
    socket.addEventListener('message', event => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === 'chat') appendChatMessage(data, data.id === clientId);
      else receivePeer({ ...data, room: data.room || room });
    });
    socket.addEventListener('close', () => {
      updatePresence();
      socketRetry = setTimeout(() => { socketRetry = undefined; connectRealtime(); }, 5000);
    });
    socket.addEventListener('error', () => socket.close());
  } catch { socket = undefined; }
}
connectRealtime();

const cleanupPeers = setInterval(() => {
  const now = Date.now();
  for (const [id, peer] of peers) if (now - peer.lastSeen > 8000) removePeer(id);
  sendRealtime({ type: 'presence' });
}, 2500);

listen(window, 'pointermove', event => {
  if (event.pointerType === 'touch' || matchMedia('(pointer: coarse)').matches) return;
  const now = performance.now();
  if (now - lastCursorTime < 45) return;
  lastCursorTime = now;
  sendRealtime({ type: 'cursor', x: event.clientX / innerWidth, y: event.clientY / innerHeight });
});

function appendChatMessage(message, own) {
  const list = $('#chat-messages');
  if ($('.chat-system', list)) $('.chat-system', list).remove();
  const row = node('li', 'chat-message', message.text || '');
  row.dataset.own = String(own);
  const label = node('small', '', own ? '你' : (message.name || '访客'));
  row.prepend(label);
  list.append(row);
  while (list.children.length > 80) list.firstElementChild.remove();
  list.scrollTop = list.scrollHeight;
  if (!own && chatPanel.hidden) {
    unreadCount++;
    $('#unread-count').textContent = String(Math.min(unreadCount, 9));
    $('#unread-count').hidden = false;
  }
}

let lastMessageAt = 0;
listen($('#chat-form'), 'submit', event => {
  event.preventDefault();
  const input = $('#chat-input');
  const text = input.value.trim();
  if (!text) return;
  if (Date.now() - lastMessageAt < 1200) { announce('请稍等片刻再发送。'); return; }
  lastMessageAt = Date.now();
  const message = { type: 'chat', text: text.slice(0, 240) };
  appendChatMessage({ ...message, name: profile.name }, true);
  sendRealtime(message);
  input.value = '';
});

const secretSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let secretIndex = 0;
listen(document, 'keydown', event => {
  if (event.key === secretSequence[secretIndex]) secretIndex++;
  else secretIndex = event.key === secretSequence[0] ? 1 : 0;
  if (secretIndex === secretSequence.length) {
    secretIndex = 0;
    document.body.classList.toggle('secret-mode');
    announce(document.body.classList.contains('secret-mode') ? '隐藏层已开启' : '隐藏层已关闭');
  }
});

// Lenis is the only smooth-scroll engine; native scrolling stays active for reduced motion.
const motion = gsap.matchMedia();
motion.add('(prefers-reduced-motion: no-preference)', () => {
  lenis = new Lenis({ duration: 0.95, smoothWheel: true, syncTouch: false, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  ticker = time => { if (!document.hidden) lenis?.raf(time * 1000); };
  gsap.ticker.add(ticker);
  gsap.ticker.lagSmoothing(0);
  gsap.from('.hero-copy > *', { y: 18, opacity: 0, stagger: 0.07, duration: 0.85, ease: 'expo.out', delay: 0.12 });
  gsap.from('.keyboard-area', { y: 24, rotation: 1.2, opacity: 0, duration: 1.05, ease: 'expo.out', delay: 0.22 });
  gsap.from('#archive .section-heading', { y: 20, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: '#archive', start: 'top 76%', once: true } });
  gsap.from('#facets .section-heading', { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '#facets', start: 'top 78%', once: true } });
  const visibility = () => { if (document.hidden) lenis?.stop(); else if (editor.hidden) { lenis?.start(); ScrollTrigger.refresh(); } };
  document.addEventListener('visibilitychange', visibility);
  const blur = () => lenis?.stop();
  const focus = () => { if (editor.hidden) lenis?.start(); };
  window.addEventListener('blur', blur);
  window.addEventListener('focus', focus);
  motionListeners = new AbortController();
  const pressable = 'button:not(:disabled), .filter-button, summary, .contact-link';
  let pressed;
  const release = () => {
    if (!pressed) return;
    gsap.to(pressed, { scale: 1, duration: 0.42, ease: 'elastic.out(1,.42)', overwrite: true });
    pressed = undefined;
  };
  document.addEventListener('pointerdown', event => {
    pressed = event.target.closest(pressable);
    if (pressed) gsap.to(pressed, { scale: 0.975, duration: 0.1, ease: 'power2.out', overwrite: true });
  }, { signal: motionListeners.signal });
  document.addEventListener('pointerup', release, { signal: motionListeners.signal });
  document.addEventListener('pointercancel', release, { signal: motionListeners.signal });
  return () => {
    motionListeners?.abort();
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('blur', blur);
    window.removeEventListener('focus', focus);
    gsap.ticker.remove(ticker);
    lenis?.off('scroll', ScrollTrigger.update);
    lenis?.destroy();
    lenis = undefined;
  };
});

const progressBar = $('#scroll-progress');
const progressTrigger = ScrollTrigger.create({ trigger: document.documentElement, start: 0, end: 'max', onUpdate: self => gsap.set(progressBar, { scaleX: self.progress }) });
const sectionTriggers = ['archive', 'facets', 'contact'].map(section => ScrollTrigger.create({ trigger: `#${section}`, start: 'top 48%', end: 'bottom 48%' }));
document.fonts.ready.then(refreshLayout);
listen(window, 'load', refreshLayout);
listen(window, 'pagehide', () => {
  sendRealtime({ type: 'leave' });
  clearInterval(cleanupPeers);
  clearTimeout(socketRetry);
  localChannel?.close();
  socket?.close();
  keyboardScene?.destroy();
  motion.revert();
  progressTrigger.kill();
  sectionTriggers.forEach(trigger => trigger.kill());
  lifecycle.abort();
  clearTimeout(toastTimer);
  gsap.killTweensOf('.keyboard-area');
});
listen(window, 'pageshow', event => { if (event.persisted) location.reload(); });
