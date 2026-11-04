import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Bundle the actual browser module so extensionless TS/JSON imports are resolved
// exactly as in production, without a browser or a replacement implementation.
const result = await build({entryPoints:[fileURLToPath(new URL('../src/data.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {baseProfile, profileIdentity} = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));

const previous = () => ({
  ...structuredClone(baseProfile), name:'yo7', isDemo:true,
  role:'理工科写作者，也做视觉实验。',
  intro:'把没想明白的事写下来，把想象做成看得见的东西。',
  bio:'我在「yo7的堂吉诃德」记录理工科学习、实验观察和日常里冒出来的问题，也用 Blender 做材质、几何节点与风格化练习。',
  facets:{
    skills:{caption:'正在学',title:'把问题一点点想明白。',description:'记录 C++、物理、概率论、材料与工程力学的学习，也记下暂时没有答案的问题。',tags:['C++ 学习','物理','概率论','材料与工程力学']},
    interests:{caption:'正在做',title:'让想象有一个形状。',description:'用 Blender 做材质、几何节点与风格化练习，试着让草地起风，让玻璃接住光。',tags:['Blender 练习','几何节点','材质','风格化渲染']},
    traits:{caption:'写下来的',title:'从一件小事继续追问。',description:'一张弯曲的滤纸、一阵风、早上七点的羽毛球：学习和日常的片段，都写进「yo7的堂吉诃德」。',tags:['学习记录','实验观察','日常碎念']},
  },
});

test('previous yo7 defaults receive current display copy without mutating stored input', () => {
  const profile=previous(), before=structuredClone(profile);
  const shown=profileIdentity(profile);
  for(const field of ['role','intro','bio','facets']) assert.deepEqual(shown[field],baseProfile[field]);
  assert.deepEqual(profile,before);
  assert.notStrictEqual(shown.facets,profile.facets);
});

test('an edited role, facet title or tag prevents replacement of that exact field', () => {
  const profile=previous();
  profile.role='我自己写的介绍';
  profile.facets.skills.title='最近在读的东西';
  profile.facets.interests.tags.push('我新加的练习');
  const shown=profileIdentity(profile);
  assert.equal(shown.role,profile.role);
  assert.deepEqual(shown.facets.skills,profile.facets.skills);
  assert.deepEqual(shown.facets.interests,profile.facets.interests);
  assert.deepEqual(shown.facets.traits,baseProfile.facets.traits);
  assert.equal(shown.intro,baseProfile.intro);
});

test('migration is limited to demo yo7 profiles and preserves edited text exactly', () => {
  for(const changes of [{isDemo:false},{name:'另一个名字'},{name:'yo7 '}]) {
    const profile={...previous(),...changes};
    const shown=profileIdentity(profile);
    for(const field of ['name','role','intro','bio','facets']) assert.deepEqual(shown[field],profile[field]);
  }
  const profile=previous();
  profile.intro+=' ';
  profile.bio='';
  const shown=profileIdentity(profile);
  assert.equal(shown.intro,profile.intro);
  assert.equal(shown.bio,'');
});

test('facet content comparison tolerates key order but never discards extra user data', () => {
  const profile=previous(), original=profile.facets.skills;
  profile.facets.skills={tags:original.tags,description:original.description,title:original.title,caption:original.caption};
  profile.facets.traits.note='用户额外保存的字段';
  const shown=profileIdentity(profile);
  assert.deepEqual(shown.facets.skills,baseProfile.facets.skills);
  assert.deepEqual(shown.facets.traits,profile.facets.traits);
});


test('the latest published copy migrates while its independently edited fields survive', () => {
  const profile = {
    ...structuredClone(baseProfile), name:'yo7', isDemo:true,
    role:'写理工科笔记，也做 Blender。',
    intro:'物理、代码，偶尔跑题。',
    bio:'公众号里写学习笔记和日常。Blender 里试试材质、节点和动画。',
    facets:{
      skills:{caption:'在学',title:'学习笔记',description:'物理、C++，还有材料与力学。',tags:['C++ 学习','物理','概率论','材料与工程力学']},
      interests:{caption:'Blender',title:'做过的练习',description:'材质、几何节点和风格化渲染。',tags:['Blender 练习','几何节点','材质','风格化渲染']},
      traits:{caption:'公众号',title:'学习日记',description:'会写实验，也写打球和追剧。',tags:['学习记录','实验观察','日常碎念']},
    },
  };
  const before=structuredClone(profile);
  const shown=profileIdentity(profile);
  for(const field of ['role','intro','bio','facets']) assert.deepEqual(shown[field],baseProfile[field]);
  assert.deepEqual(profile,before);
  profile.intro='我补充的一句话';
  profile.facets.interests.description='新的渲染练习已经做好了';
  const edited=profileIdentity(profile);
  assert.equal(edited.intro,profile.intro);
  assert.deepEqual(edited.facets.interests,profile.facets.interests);
  assert.equal(edited.role,baseProfile.role);
  assert.deepEqual(edited.facets.skills,baseProfile.facets.skills);
});
