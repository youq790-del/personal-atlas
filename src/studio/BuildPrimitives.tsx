import type { ElementType } from 'react';

/** Accessible content stays complete while its visible glyphs are reconstructed. */
export function BuildType({as:Tag='span',text,className=''}:{as?:ElementType;text:string;className?:string}) {
  return <Tag className={className} data-build="type" data-build-text={text}><span className="studio-sr-only">{text}</span>{Array.from(text).map((glyph,index)=><span data-build-glyph aria-hidden="true" key={index}>{glyph}</span>)}</Tag>;
}

export function BuildCursors() {
  return <div className="studio-cursor-layer" aria-hidden="true">{['排字','影像','排版'].map((name,index)=><div className={'studio-cursor studio-cursor-'+index} data-build-cursor={index} key={name}>
    <svg width="22" height="26" viewBox="0 0 22 26" fill="none"><path d="M2 2L19 15L11 16L7 23L2 2Z" fill="currentColor" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/></svg><span>{name}</span>
  </div>)}</div>;
}

export function SelectionHandles() {
  return <span className="studio-handles" aria-hidden="true"><i/><i/><i/><i/></span>;
}
