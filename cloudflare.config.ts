import { bindings, defineConfig, exports } from 'cf/config';
export default defineConfig({worker:{name:'momonga1',entrypoint:'./worker/index.js',compatibilityDate:'2026-11-18',workersDev:true,assets:{runWorkerFirst:['/api/*'],notFoundHandling:'none'},env:{ASSETS:bindings.assets()},exports:{GameRoom:exports.durableObject({storage:'sqlite'})},observability:{enabled:false}}});
