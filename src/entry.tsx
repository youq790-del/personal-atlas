import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/noto-sans-sc';
import './typography.css';
import 'lenis/dist/lenis.css';
const keyboard=new URLSearchParams(location.search).get('view')==='keyboard';
document.documentElement.classList.toggle('studio-mode',!keyboard);
const Page=keyboard?lazy(()=>import('./LegacyApp')):lazy(()=>import('./studio/StudioApp'));
createRoot(document.getElementById('root')!).render(<Suspense fallback={<p style={{padding:'15vh 10vw',fontFamily:'sans-serif',color:'#646c7b'}}>正在打开我的一页…</p>}><Page/></Suspense>);
