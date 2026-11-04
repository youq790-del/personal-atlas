import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
export function Modal({title,children,onClose,wide=false,className=''}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean;className?:string}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const dismiss=useRef(onClose);dismiss.current=onClose;
  useEffect(()=>{
    const el=dialog.current!,previous=document.activeElement as HTMLElement|null;
    el.showModal(); const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const close=()=>dismiss.current();el.addEventListener('close',close);
    return ()=>{el.removeEventListener('close',close);el.close();document.body.style.overflow=overflow;previous?.focus({preventScroll:true});};
  },[]);
  return <dialog ref={dialog} className={`modal ${wide?'modal-wide':''} ${className}`} onClick={event=>{if(event.target===dialog.current)onClose();}} aria-label={title} data-lenis-prevent>
    <div className="modal-content"><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭"><Icon name="close-circle-linear"/></button></div>{children}</div>
  </dialog>;
}
