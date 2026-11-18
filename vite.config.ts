import {defineConfig} from 'vite';
import {cloudflare} from '@cloudflare/vite-plugin';
export default defineConfig({plugins:[cloudflare()],publicDir:'.public',server:{host:'127.0.0.1',port:8787},build:{assetsInlineLimit:0}});
