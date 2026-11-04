import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Chibi 0.5 uses a root-relative font URL through drei's fetch(), which bypasses
// THREE.DefaultLoadingManager. Rewrite only this dependency constant for Pages.
const chibiFontBase = {name:'chibi-pages-font',transform(code,id){
  if(id.includes('@chibi3d/runtime')&&code.includes('"/fonts/helvetiker_regular.typeface.json"'))
    return {code:code.replaceAll('"/fonts/helvetiker_regular.typeface.json"','new URL("./fonts/helvetiker_regular.typeface.json", document.baseURI).href'),map:null};
}};
export default defineConfig({ plugins:[react(),chibiFontBase], base: './', server: { host: '127.0.0.1', port: 4174, strictPort: true }, preview: { host: '127.0.0.1', port: 4174, strictPort: true }, build: { target: 'es2022', assetsInlineLimit: 4096, chunkSizeWarningLimit:1800 } });
