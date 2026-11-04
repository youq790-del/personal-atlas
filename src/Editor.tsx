import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { baseProfile, validateProfile, asset, type Profile } from './data';
import { WeChatEditor } from './WeChatShelf';
export function Editor({profile,onSave,onClose}:{profile:Profile;onSave:(p:Profile)=>void;onClose:()=>void}) {
  const [draft,setDraft]=useState(profile);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const download=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='my-profile.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  };
  const save=(event:FormEvent)=>{event.preventDefault();try{onSave(validateProfile(draft));onClose();}catch(e){setError((e as Error).message);}};
  return <Modal title="编辑个人资料" onClose={onClose} wide><p className="muted">编辑仅保存在当前浏览器。导出 JSON 后，可更新网站公开内容。</p><form onSubmit={save}>
    <div className="form-pair"><label>姓名<input required maxLength={60} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>身份 / 一句话介绍<input required maxLength={100} value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value})}/></label></div>
    <label>关于我<textarea rows={3} maxLength={3000} value={draft.bio} onChange={e=>setDraft({...draft,bio:e.target.value})}/></label>
    <label>联系邮箱<input type="email" value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})}/></label>
    <label className="check-label"><input type="checkbox" checked={!draft.isDemo} onChange={e=>setDraft({...draft,isDemo:!e.target.checked})}/>内容已替换为我的真实资料</label>
    <WeChatEditor value={draft.wechat} onChange={wechat=>setDraft(current=>({...current,wechat}))}/>
    <div className="file-tools"><label className="button secondary file-label">导入资料 JSON<input type="file" accept=".json,application/json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>1024*1024)throw new Error('文件不能超过 1 MB。');setDraft(validateProfile(JSON.parse(await file.text())));setNotice('已导入预览，点击保存后生效。');setError('');}catch(error){setError((error as Error).message);}e.target.value='';}}/></label><button type="button" className="button secondary" onClick={download}>导出 JSON</button><a className="text-link" href={asset('profile-template.json')} download>下载模板</a></div>
    <p className="muted small">技能、作品和成就通过 JSON 分类填写。可为每颗键设置标题、介绍、颜色与快捷键。</p>
    {error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status">{notice}</p>}
    <div className="form-actions"><button type="button" className="text-link" onClick={()=>{setDraft(baseProfile);setNotice('已载入网站默认资料，保存后生效。');}}>载入网站默认资料</button><button className="button primary" type="submit">保存到本机</button></div>
  </form></Modal>;
}
