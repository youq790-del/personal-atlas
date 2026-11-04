import solar from '../solar-icons.json';
export function Icon({name,size=20}:{name:string;size?:number}) {
  const glyph = (solar.icons as Record<string,{body:string}>)[name] ?? solar.icons['star-linear'];
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" dangerouslySetInnerHTML={{__html:glyph.body}} />;
}
