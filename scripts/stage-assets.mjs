import {readFileSync,writeFileSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import path from 'node:path';
const root=process.cwd(),output=path.resolve(root,'.public');
if(path.dirname(output)!==root||path.basename(output)!=='.public')throw new Error('Invalid staging directory');
rmSync(output,{recursive:true,force:true});mkdirSync(path.join(output,'assets','audio'),{recursive:true});
const manifest=JSON.parse(readFileSync(path.join(root,'assets/audio/manifest.json'),'utf8'));
const files=['intro-reference.png','momonga.glb','anoko.glb','siren.glb','chiikawa.glb','hachiware.glb','resident_cream.glb','resident_peach.glb','yoroi.glb'];
for(const file of files)copyFileSync(path.join(root,'assets',file),path.join(output,'assets',file));
for(const file of new Set([...Object.values(manifest.files),...Object.values(manifest.voices)])){if(!/^[a-z0-9_-]+\.(mp3|wav)$/.test(file))throw new Error('Unexpected audio filename');copyFileSync(path.join(root,'assets/audio',file),path.join(output,'assets/audio',file));}
writeFileSync(path.join(output,'assets/audio/manifest.json'),JSON.stringify(manifest));
writeFileSync(path.join(output,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n');
console.log('Staged allowlisted game assets only.');
