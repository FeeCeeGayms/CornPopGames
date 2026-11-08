"use strict";
// =====================================================================
//  MATTRESS MADNESS — web edition (next-gen renderer + animated BCM)
// =====================================================================
// linear colour workflow: treat every hex colour as sRGB (like modern three.js)
{const sh=THREE.Color.prototype.setHex;THREE.Color.prototype.setHex=function(h){sh.call(this,h);return this.convertSRGBToLinear()}}
const $=s=>document.querySelector(s),TAU=Math.PI*2,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t),rand=(a,b)=>a+Math.random()*(b-a);
const rngf=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
// zone look: sky top / horizon, sun colour + strength, hemi ground
const ZN={suburb:{n:'Suburban Streets',top:0x2f7fd8,hor:0xcfe9ff,sun:0xfff0d6,si:1.75,gr:0x6b6a58,pl:0xb9814f},
 down:{n:'Downtown Broadway',top:0x3a3683,hor:0xffae78,sun:0xffb070,si:1.55,gr:0x6a4a52,pl:0x6c7a89},
 park:{n:'Tautphaug Park',top:0x2a8bd0,hor:0xd9f7de,sun:0xfff4d8,si:1.75,gr:0x4f6a3a,pl:0x8b5a2b},
 falls:{n:'Snake River Falls',top:0x2873c0,hor:0xd3edfb,sun:0xf4f8ff,si:1.7,gr:0x5a6470,pl:0x7a7f87},
 temple:{n:'Idaho Falls Temple',top:0x6656c4,hor:0xffd4e2,sun:0xffd9a0,si:1.65,gr:0x6a5a5a,pl:0xe8e1d0}};
const LV=[{name:'Suburban Streets to Broadway',len:240,zones:[[-99,'suburb'],[120,'down']]},
 {name:'Downtown to the Snake River',len:270,zones:[[-99,'down'],[100,'park'],[190,'falls']]},
 {name:'Tautphaug Park to the Temple',len:290,zones:[[-99,'park'],[110,'down'],[200,'temple']]}];
const zoneAt=x=>{let z;for(const q of LV[cur].zones)if(x>=q[0])z=q[1];return z};
// ---------- input: keyboard (WASD / arrows), touch buttons, mouse and gamepads
const K={l:0,r:0,j:0,p:0,pp:0},KB={l:0,r:0,j:0,p:0},TB={l:0,r:0,j:0,p:0},GP={l:0,r:0,j:0,p:0};
const kmap={KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r',Space:'j',KeyW:'j',ArrowUp:'j',KeyZ:'j',KeyJ:'p',KeyK:'p',KeyF:'p',KeyE:'p',KeyX:'p',Enter:'p'};
// on-screen menus (title card, level card, pause): navigable by keyboard and controller
function menuEl(){const p=$('#pause');if(p.style.display==='flex')return p;const c=$('#card');if(c.style.display!=='none'&&c.querySelector('button'))return c;return null}
function menuBtns(m){return[...m.querySelectorAll('button')].filter(b=>!b.disabled&&b.offsetParent!==null)}
function menuMove(d){const m=menuEl();if(!m)return;const b=menuBtns(m);if(!b.length)return;let i=b.indexOf(document.activeElement);if(i<0){const df=b.findIndex(x=>x.dataset.def);i=df>=0?df:0}else i=(i+d+b.length)%b.length;b.forEach(x=>x.classList.remove('foc'));b[i].classList.add('foc');b[i].focus({preventScroll:true})}
function menuPress(){const m=menuEl();if(!m)return false;const b=menuBtns(m);if(!b.length)return false;const f=b.includes(document.activeElement)?document.activeElement:b.find(x=>x.classList.contains('foc'))||b.find(x=>x.dataset.def)||b[0];f.click();return true}
function clearKeys(){for(const o of[KB,TB,GP])o.l=o.r=o.j=o.p=0;K.l=K.r=K.j=K.p=K.pp=0}
addEventListener('keydown',e=>{
 if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(!e.repeat)setPause(!paused);return}
 if(e.code==='KeyM'&&!e.repeat){$('#mute').click();return}
 const m=menuEl();
 if(m){if(e.target&&e.target.tagName==='INPUT'&&/Arrow/.test(e.code))return;
  if(e.code==='Enter'||e.code==='Space'||e.code==='NumpadEnter'){e.preventDefault();if(!e.repeat)menuPress();return}
  const d={ArrowLeft:-1,ArrowUp:-1,KeyA:-1,KeyW:-1,ArrowRight:1,ArrowDown:1,KeyD:1,KeyS:1,Tab:e.shiftKey?-1:1}[e.code];if(d){e.preventDefault();menuMove(d)}return}
 const k=kmap[e.code];if(k){KB[k]=1;if(k==='p'&&!e.repeat)K.pp=1;e.preventDefault()}
 else if(e.code==='ArrowDown'||e.code==='KeyS'||e.code==='Tab')e.preventDefault()});
addEventListener('keyup',e=>{const k=kmap[e.code];if(k){KB[k]=0;e.preventDefault()}});
addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearKeys()});
// keep keyboard focus on the game (matters when it runs inside a frame) and stop clicked buttons from eating Space
addEventListener('pointerdown',()=>{try{window.focus()}catch(e){}},true);
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(b&&e.detail>0)setTimeout(()=>b.blur(),0)},true);
document.querySelectorAll('#ctl button').forEach(b=>{const k=b.dataset.k;
 b.addEventListener('pointerdown',e=>{e.preventDefault();TB[k]=1;if(k==='p')K.pp=1});
 ['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>TB[k]=0))});
// mouse: left-click on the scene punches
$('#c').addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0&&st==='play'&&!paused)K.pp=1});
// gamepad (standard mapping: Xbox / PlayStation / Switch Pro / 8BitDo…)
let padPrev={},padBlock=0,padName='';
addEventListener('gamepadconnected',e=>{padName=e.gamepad.id;toast('🎮 Controller connected')});
addEventListener('gamepaddisconnected',()=>{padName='';GP.l=GP.r=GP.j=GP.p=0;toast('Controller disconnected')});
function pollPad(){GP.l=GP.r=GP.j=GP.p=0;let ps=[];try{ps=navigator.getGamepads?navigator.getGamepads():[]}catch(e){}let gp=null;for(const p of ps)if(p&&p.connected){gp=p;break}
 if(!gp){padPrev={};padName='';return}if(!padName)padName=gp.id||'pad';
 const b=i=>{const x=gp.buttons[i];return!!(x&&(x.pressed||x.value>.5))},ax=gp.axes[0]||0,ay=gp.axes[1]||0;
 const c={l:b(14)||ax<-.4,r:b(15)||ax>.4,u:b(12)||ay<-.6,d:b(13)||ay>.6,a:b(0),b:b(1),x:b(2),y:b(3),lb:b(4),rb:b(5),lt:b(6),rt:b(7),sel:b(8),st:b(9)};
 const pr=k=>c[k]&&!padPrev[k];
 if(pr('st'))setPause(!paused);if(pr('sel'))$('#mute').click();
 const m=menuEl();
 if(m){if(pr('a')){padBlock=1;menuPress()}else if(pr('l')||pr('u'))menuMove(-1);else if(pr('r')||pr('d'))menuMove(1);else if(pr('b')&&paused)setPause(false)}
 else{if(!c.a)padBlock=0;GP.l=c.l;GP.r=c.r;GP.j=(c.a&&!padBlock)||c.y;GP.p=c.x||c.b||c.rb||c.rt;if(pr('x')||pr('b')||pr('rb')||pr('rt'))K.pp=1}
 padPrev=c}
function pollInput(){pollPad();for(const k of['l','r','j','p'])K[k]=KB[k]||TB[k]||GP[k]}
const TOUCH=matchMedia('(pointer:coarse)').matches||'ontouchstart' in window;
function setUI(on){$('#hud').style.display=on?'flex':'none';$('#ctl').style.display=on&&TOUCH?'flex':'none'}setUI(false);
// ---------- audio
let AC,mute=false,NB=null;
function ac(){AC=AC||new(window.AudioContext||window.webkitAudioContext)();return AC}
function snd(f,d=.1,t='square',v=.05,s=0){if(mute)return;try{ac();const n=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=t;o.frequency.setValueAtTime(f,n);if(s)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+s),n+d);g.gain.setValueAtTime(v*2,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g).connect(AC.destination);o.start();o.stop(n+d)}catch(e){}}
function nz(d=.2,f=3000,q=.8,v=.2,type='bandpass',delay=0){if(mute)return;try{ac();if(!NB){NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const a=NB.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}
 const n=AC.currentTime+delay,s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NB;fl.type=type;fl.frequency.value=f;fl.Q.value=q;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);s.connect(fl).connect(g).connect(AC.destination);s.start(n,Math.random()*.5);s.stop(n+d)}catch(e){}}
function smashSnd(){nz(.35,4200,.6,.32,'highpass');nz(.12,900,1,.25);for(let i=0;i<4;i++)setTimeout(()=>snd(2400+Math.random()*2600,.18,'sine',.025),40+i*45);snd(95,.18,'sine',.14,-40)}
function splatSnd(){nz(.3,500,.7,.4,'lowpass');snd(140,.25,'sine',.14,-90)}
$('#mute').onclick=()=>{mute=!mute;BGM.muted=mute;if(!mute&&bgmOn)BGM.play().catch(()=>{});$('#mute').style.opacity=mute?.5:1};
// ---------- renderer & post
const R=new THREE.WebGLRenderer({canvas:$('#c'),antialias:true,powerPreference:'high-performance'});
R.outputEncoding=THREE.sRGBEncoding;R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const GL2=R.capabilities.isWebGL2,HDR_OK=GL2&&!!R.getContext().getExtension('EXT_color_buffer_float');
let QUAL=(()=>{try{return localStorage.getItem('mm_q')}catch(e){return null}})()||(HDR_OK?'high':'low');if(!HDR_OK)QUAL='low';
const EXPO=1.25;
const S=new THREE.Scene();S.fog=new THREE.Fog(0xcfe9ff,40,380);
const cam=new THREE.PerspectiveCamera(40,1,1.5,900);let dist=21;
let composer=null,bloom=null,FINAL=null;
const FinalShader={uniforms:{tDiffuse:{value:null},expo:{value:EXPO},vig:{value:.32},sat:{value:1.12},time:{value:0},grain:{value:.022},ca:{value:.0028},tint:{value:new THREE.Color(1,1,1)},tintA:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float expo,vig,sat,time,grain,ca,tintA;uniform vec3 tint;varying vec2 vUv;
 vec3 RRT(vec3 v){vec3 a=v*(v+.0245786)-.000090537;vec3 b=v*(.983729*v+.4329510)+.238081;return a/b;}
 vec3 aces(vec3 c){const mat3 I=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));const mat3 O=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));c*=expo/.6;c=I*c;c=RRT(c);c=O*c;return clamp(c,0.,1.);}
 vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){vec2 d=vUv-.5;float r2=dot(d,d);vec3 c;c.r=texture2D(tDiffuse,vUv-d*ca*r2*4.).r;c.g=texture2D(tDiffuse,vUv).g;c.b=texture2D(tDiffuse,vUv+d*ca*r2*4.).b;
  c=aces(c);float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,sat);c=mix(c,c*tint,tintA);
  c*=1.-vig*smoothstep(.12,.75,r2*1.6);c=srgb(c);c+=(h(vUv*vec2(1733.,977.)+time)-.5)*grain;gl_FragColor=vec4(c,1.);}`};
function setupPost(){
 if(composer){composer.renderTarget1.dispose();composer.renderTarget2.dispose();composer=null}
 if(QUAL==='high'){R.toneMapping=THREE.NoToneMapping;
  const rt=new THREE.WebGLMultisampleRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,format:THREE.RGBAFormat,encoding:THREE.LinearEncoding});rt.samples=4;
  composer=new THREE.EffectComposer(R,rt);composer.addPass(new THREE.RenderPass(S,cam));
  bloom=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.55,.5,1.15);composer.addPass(bloom);
  FINAL=new THREE.ShaderPass(FinalShader);composer.addPass(FINAL);
 }else{R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=EXPO}
 R.shadowMap.needsUpdate=true;sun&&(sun.shadow.mapSize.set(QUAL==='high'?2048:1024,QUAL==='high'?2048:1024),sun.shadow.map&&(sun.shadow.map.dispose(),sun.shadow.map=null));
 MT_all.forEach(m=>m.needsUpdate=true);resize()}
const MT_all=new Set();
function setQual(q,keep=1){QUAL=HDR_OK?q:'low';if(keep)try{localStorage.setItem('mm_q',QUAL)}catch(e){}setupPost()}
// ---------- sky dome (shared shader, also used for environment reflections)
const SKYU={top:{value:new THREE.Color(0x2f7fd8)},hor:{value:new THREE.Color(0xcfe9ff)},bot:{value:new THREE.Color(0x6a7a6a)},sunDir:{value:new THREE.Vector3(-.45,.32,-1).normalize()},sunC:{value:new THREE.Color(0xfff0d6)},sunI:{value:1},mul:{value:1}};
const SKYM=new THREE.ShaderMaterial({uniforms:SKYU,side:THREE.BackSide,depthWrite:false,fog:false,
 vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:`uniform vec3 top,hor,bot,sunDir,sunC;uniform float sunI,mul;varying vec3 vD;
 void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=h>0.?mix(hor,top,pow(clamp(h*2.,0.,1.),.55)):mix(hor,bot,clamp(-h*4.,0.,1.));
  float s=max(dot(d,sunDir),0.);c+=sunC*sunI*(pow(s,6.)*.18+pow(s,90.)*.7+smoothstep(.9992,.99955,s)*9.);
  c+=hor*.18*exp(-abs(h)*14.);gl_FragColor=vec4(c*mul,1.);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
 }`});
const SKY=new THREE.Mesh(new THREE.SphereGeometry(420,32,16),SKYM);SKY.frustumCulled=false;SKY.renderOrder=-10;S.add(SKY);
const ENVS=new THREE.Scene();ENVS.add(new THREE.Mesh(new THREE.SphereGeometry(40,32,16),SKYM));
const PMREM=new THREE.PMREMGenerator(R);let envRT=null,envT=0;
function regenEnv(){const si=SKYU.sunI.value;SKYU.mul.value=.42;SKYU.sunI.value=si*.25;const rt=PMREM.fromScene(ENVS,.02,.1,100);SKYU.mul.value=1;SKYU.sunI.value=si;if(envRT)envRT.dispose();envRT=rt;S.environment=rt.texture}
// ---------- lights
const HEMI=new THREE.HemisphereLight(0xcfe9ff,0x6b6a58,.32);S.add(HEMI);
const sun=new THREE.DirectionalLight(0xfff0d6,1.75);sun.position.set(-12,22,16);sun.castShadow=true;
{const c=sun.shadow.camera;c.left=-34;c.right=34;c.top=26;c.bottom=-14;c.near=1;c.far=110;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;sun.shadow.radius=3}
S.add(sun);S.add(sun.target);
const fill=new THREE.DirectionalLight(0x9fc4ff,.25);fill.position.set(10,6,12);S.add(fill);
function resize(){const pr=Math.min(devicePixelRatio,QUAL==='high'?(TOUCH?1.5:2):1.25);R.setPixelRatio(pr);R.setSize(innerWidth,innerHeight,false);
 if(composer){composer.setPixelRatio(pr);composer.setSize(innerWidth,innerHeight)}
 const a=innerWidth/innerHeight;cam.aspect=a;dist=Math.max(21,Math.min(24,14+10*a)/(a*.7279));cam.updateProjectionMatrix()}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,250));
// ---------- canvas textures & helpers
const MT={},mat=c=>MT[c]||(MT[c]=new THREE.MeshStandardMaterial({color:c,roughness:.85}));
let LG=new THREE.Group();S.add(LG);
function bx(w,h,d,c,x,y,z,p){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c==='number'?mat(c):c);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(p||LG).add(m);return m}
function cv(w,h,f,lin){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),c);const t=new THREE.CanvasTexture(c);if(!lin)t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function noise(x,X,Y,W,H,n,cols,s){for(let i=0;i<n;i++){x.fillStyle=cols[i%cols.length];x.globalAlpha=.3+Math.random()*.6;x.fillRect(X+Math.random()*W,Y+Math.random()*H,1+Math.random()*s,1+Math.random()*s)}x.globalAlpha=1}
// soft round sprite texture (particles, glows)
const DOT=cv(64,64,x=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.75)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64)});
const GLOW=cv(128,128,x=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.25,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128)});
const RING=cv(128,128,x=>{x.strokeStyle='#fff';x.lineWidth=10;x.shadowColor='#fff';x.shadowBlur=12;x.beginPath();x.arc(64,64,48,0,TAU);x.stroke()});
// quilted mattress: colour + generated normal map
const QT=cv(256,256,x=>{x.fillStyle='#fff';x.fillRect(0,0,256,256);x.strokeStyle='#d4d4e2';x.lineWidth=3;for(let i=0;i<=256;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.moveTo(0,i);x.lineTo(256,i);x.stroke()}
 x.strokeStyle='#e6e6f0';x.lineWidth=2;for(let i=-256;i<512;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i+256,256);x.stroke()}x.fillStyle='#b8b8c8';for(let i=32;i<256;i+=64)for(let j=32;j<256;j+=64){x.beginPath();x.arc(i,j,5,0,TAU);x.fill()}});
const QN=(()=>{const N=128,h=new Float32Array(N*N);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=(x%32)/32,v=(y%32)/32,cu=Math.sin(u*Math.PI),cv_=Math.sin(v*Math.PI);let z=Math.pow(cu*cv_,.6);const du=Math.hypot(u-.5,v-.5);z-=.5*Math.exp(-du*du*90);h[y*N+x]=z}
 const c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),id=x.createImageData(N,N);
 for(let y=0;y<N;y++)for(let X=0;X<N;X++){const L=h[y*N+(X+N-1)%N],Rr=h[y*N+(X+1)%N],U=h[((y+N-1)%N)*N+X],D=h[((y+1)%N)*N+X];let nx=(L-Rr)*2.2,ny=(D-U)*2.2,nz=1;const l=Math.hypot(nx,ny,nz);const i=(y*N+X)*4;id.data[i]=(nx/l*.5+.5)*255;id.data[i+1]=(ny/l*.5+.5)*255;id.data[i+2]=(nz/l*.5+.5)*255;id.data[i+3]=255}
 x.putImageData(id,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
QT.repeat.set(2,2);QN.repeat.set(4,4);
// downtown windows: colour + matching emissive glow
function winTex(){const lit=[];const a=cv(64,64,x=>{x.fillStyle='#35446a';x.fillRect(0,0,64,64);x.fillStyle='#2a3654';x.fillRect(0,0,64,4);x.fillRect(0,32,64,4);for(let i=0;i<2;i++)for(let j=0;j<2;j++){const L=Math.random()<.5;lit.push(L);x.fillStyle=L?'#ffe08a':'#8fb4e8';x.fillRect(6+i*32,8+j*32,20,20);x.fillStyle='rgba(255,255,255,.35)';x.fillRect(6+i*32,8+j*32,20,3)}});
 const e=cv(64,64,x=>{x.fillStyle='#000';x.fillRect(0,0,64,64);let k=0;for(let i=0;i<2;i++)for(let j=0;j<2;j++){x.fillStyle=lit[k++]?'#ffcf70':'#0a1020';x.fillRect(6+i*32,8+j*32,20,20)}});return[a,e]}
const WTS=[winTex(),winTex(),winTex()];
const FT=cv(64,128,x=>{x.fillStyle='#cfefff';x.fillRect(0,0,64,128);x.fillStyle='#fff';for(let i=0;i<12;i++)x.fillRect(Math.random()*56,Math.random()*128,4+Math.random()*6,30+Math.random()*50)});
const GT={},GTY={suburb:'road',down:'road',park:'dirt',falls:'gravel',temple:'pave'};
GT.road=cv(512,512,x=>{x.fillStyle='#575a65';x.fillRect(0,0,512,512);x.strokeStyle='#3a3c45';x.lineWidth=3;for(let i=0;i<=512;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,150);x.stroke()}for(let j=50;j<150;j+=50){x.beginPath();x.moveTo(0,j);x.lineTo(512,j);x.stroke()}noise(x,0,0,512,150,700,['#666974','#3d3f48'],3);
 x.fillStyle='#8a8d98';x.fillRect(0,150,512,14);x.fillStyle='#22242b';x.fillRect(0,164,512,348);noise(x,0,164,512,348,5000,['#2c2e37','#16171c','#3a3c45','#25272f','#45474f'],3);
 x.fillStyle='#e0b83a';x.fillRect(40,428,200,9);x.fillStyle='#17181d';x.fillRect(0,300,512,4);x.globalAlpha=.5;x.fillRect(0,330,512,22);x.globalAlpha=1});
GT.dirt=cv(512,512,x=>{x.fillStyle='#2c5122';x.fillRect(0,0,512,512);noise(x,0,0,512,150,1200,['#3b6a2e','#1f3d18','#47783a'],4);x.fillStyle='#3a2c21';x.fillRect(0,150,512,362);noise(x,0,150,512,362,5000,['#46362a','#271c14','#5c4a3e','#2f2219'],4);
 x.fillStyle='#241a12';x.fillRect(0,290,512,16);x.fillRect(0,400,512,14);noise(x,0,150,512,362,260,['#8a7a6c'],5)});
GT.gravel=cv(512,512,x=>{x.fillStyle='#373a42';x.fillRect(0,0,512,512);noise(x,0,0,512,512,7000,['#474a52','#24262c','#60636b','#2e3138'],5);x.fillStyle='#202228';x.fillRect(0,150,512,10)});
GT.pave=cv(512,512,x=>{x.fillStyle='#46413d';x.fillRect(0,0,512,512);x.strokeStyle='#27221f';x.lineWidth=4;for(let j=0;j<=512;j+=64){x.beginPath();x.moveTo(0,j);x.lineTo(512,j);x.stroke();for(let i=(j/64%2)*32;i<=512;i+=64){x.beginPath();x.moveTo(i,j);x.lineTo(i,j+64);x.stroke()}}noise(x,0,0,512,512,4000,['#554f4a','#2d2926'],3)});
GT.curbF=cv(512,512,x=>{x.fillStyle='#261e1a';x.fillRect(0,0,512,512);noise(x,0,60,512,452,4000,['#352a21','#17110d','#4c3d32'],4);x.fillStyle='#8a8d98';x.fillRect(0,0,512,60);x.fillStyle='#5f626d';x.fillRect(0,52,512,8);x.strokeStyle='#5f626d';x.lineWidth=3;for(let i=0;i<512;i+=128){x.beginPath();x.moveTo(i,0);x.lineTo(i,52);x.stroke()}});
GT.dirtF=cv(512,512,x=>{x.fillStyle='#2c221b';x.fillRect(0,0,512,512);for(let j=60;j<512;j+=70){x.fillStyle=j%140?'#362a20':'#221811';x.fillRect(0,j,512,28)}noise(x,0,40,512,472,4000,['#423327','#17110d','#5d4c3f'],5);x.fillStyle='#2c5122';x.fillRect(0,0,512,40);noise(x,0,0,512,40,400,['#47783a','#1f3d18'],4)});
Object.values(GT).forEach(t=>t.anisotropy=Math.min(8,R.capabilities.getMaxAnisotropy()));
function gmat(type,t0,len){const mk=(k,r)=>{const tx=GT[k].clone();tx.needsUpdate=true;tx.repeat.set(len/10,1);tx.offset.set(t0/10,0);return new THREE.MeshStandardMaterial({map:tx,bumpMap:tx,bumpScale:.035,roughness:r,metalness:0})},sd=mat(0x241c16);return[sd,sd,mk(type,type==='road'?.82:.95),sd,mk(type==='road'||type==='pave'?'curbF':'dirtF',.95),sd]}
// rounded box geometry (soft mattress shape)
function rbox(w,h,d,r,s=4){const g=new THREE.BoxGeometry(w,h,d,s,s,s),p=g.attributes.position,v=new THREE.Vector3(),c=new THREE.Vector3();const hw=w/2-r,hh=h/2-r,hd=d/2-r;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(cl(v.x,-hw,hw),cl(v.y,-hh,hh),cl(v.z,-hd,hd));v.sub(c);if(v.lengthSq()>0)v.setLength(r);v.add(c);p.setXYZ(i,v.x,v.y,v.z)}g.computeVertexNormals();return g}
const MC=[0xff8fb1,0x7fd6ff,0x9df0b4,0xc7a6ff,0xffd23f],MGEO=rbox(1.7,.42,1.05,.16);
const MMAT=MC.map(c=>new THREE.MeshStandardMaterial({map:QT,normalMap:QN,normalScale:new THREE.Vector2(.9,.9),color:c,roughness:.62,envMapIntensity:.8}));
const mattress=ci=>{const m=new THREE.Mesh(MGEO,MMAT[ci%5]);m.castShadow=m.receiveShadow=true;return m};
// ---------- backdrop: layered mountains, clouds, floating motes
const MG=new THREE.Group();S.add(MG);
function range(z,hb,hv,col,snow,seed,snowAt){const r=rngf(seed),W=1100,NX=150,NY=8,pos=[],cols=[],idx=[],ph=[r()*9,r()*9,r()*9,r()*9];
 const ridge=x=>hb+hv*(.5*Math.abs(Math.sin(x*.0105+ph[0]))+.3*Math.abs(Math.sin(x*.026+ph[1]))+.14*Math.sin(x*.071+ph[2])+.06*Math.sin(x*.19+ph[3]));
 const c=new THREE.Color(),cr=new THREE.Color(col),cs=new THREE.Color(snow);
 for(let i=0;i<=NX;i++){const x=-W/2+W*i/NX,h=ridge(x);for(let j=0;j<=NY;j++){const t=j/NY,y=-12+(h+12)*Math.pow(t,.9),jit=(j>0&&j<NY)?(r()-.5):0;
  pos.push(x+jit*4,y+jit*2,z+(r()-.5)*24*t*(1-t)*3.2);const sn=t>snowAt+(r()-.5)*.14&&h>hb+hv*.35;c.copy(sn?cs:cr);c.offsetHSL(0,0,(r()-.5)*.05-(1-t)*.06);cols.push(c.r,c.g,c.b)}}
 for(let i=0;i<NX;i++)for(let j=0;j<NY;j++){const a=i*(NY+1)+j,b=a+NY+1;idx.push(a,b,a+1,b,b+1,a+1)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.setIndex(idx);g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}));m.receiveShadow=false;MG.add(m)}
range(-300,18,52,0x8195c2,0xf6f9ff,9,.62);range(-235,6,34,0x6a82ad,0xeef4ff,21,.72);range(-160,-4,14,0x4f7f55,0x4f7f55,33,2);
const CLOUDT=cv(256,128,x=>{for(let i=0;i<14;i++){const cx=40+Math.random()*176,cy=70+Math.random()*24-(Math.abs(cx-128)<60?18:0),r=20+Math.random()*28;const g=x.createRadialGradient(cx,cy-r*.3,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.6,'rgba(250,250,255,.85)');g.addColorStop(1,'rgba(230,236,250,0)');x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,TAU);x.fill()}});
const CLOUDS=[];{const r=rngf(4);for(let i=0;i<9;i++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:CLOUDT,fog:false,transparent:true,depthWrite:false,opacity:.85}));const s=26+r()*30;m.scale.set(s,s*.45,1);m.position.set(i*76-300+r()*30,46+r()*30,-190-r()*70);m.userData.v=.4+r()*.8;MG.add(m);CLOUDS.push(m)}}
const MOTE_N=260,moteG=new THREE.BufferGeometry(),moteP=new Float32Array(MOTE_N*3),moteV=[];
for(let i=0;i<MOTE_N;i++){moteP[i*3]=rand(-30,30);moteP[i*3+1]=rand(0,16);moteP[i*3+2]=rand(-12,10);moteV.push(rand(-.3,.3),rand(-.15,.25),rand(0,TAU))}
moteG.setAttribute('position',new THREE.BufferAttribute(moteP,3));
const MOTES=new THREE.Points(moteG,new THREE.PointsMaterial({map:DOT,size:.16,color:0xfff2c8,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));MOTES.frustumCulled=false;S.add(MOTES);
// ---------- grass (instanced, wind-swayed in shader)
const GU={time:{value:0}};
const BLADE=(()=>{const g=new THREE.PlaneGeometry(.09,.55,1,3);g.translate(0,.275,0);const p=g.attributes.position,col=[],nrm=[];for(let i=0;i<p.count;i++){const y=p.getY(i),t=y/.55;p.setX(i,p.getX(i)*(1-t*.85));col.push(.35+.65*t,.45+.55*t,.3+.5*t);nrm.push(0,1,0)}
 g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3));return g})();
const GRASSM=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.9});
GRASSM.onBeforeCompile=sh=>{sh.uniforms.gt=GU.time;sh.vertexShader='uniform float gt;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vec4 ip=instanceMatrix*vec4(0.,0.,0.,1.);float k=position.y*position.y*3.2;transformed.x+=(sin(gt*1.9+ip.x*.33+ip.z*.21)*.1+sin(gt*3.3+ip.x*1.7)*.035)*k;transformed.z+=sin(gt*1.3+ip.x*.2)*.05*k;`)};
function grass(segs){let n=0;for(const s of segs)n+=s.n;if(!n)return;const im=new THREE.InstancedMesh(BLADE,GRASSM,n),m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),c=new THREE.Color();let k=0;
 for(const s of segs)for(let i=0;i<s.n;i++){const x=rand(s.x0,s.x1),z=rand(s.z0,s.z1),sc=rand(.6,1.35);e.set(rand(-.15,.15),rand(0,TAU),rand(-.2,.2));q.setFromEuler(e);m.compose(new THREE.Vector3(x,s.y,z),q,new THREE.Vector3(sc,sc*rand(.7,1.3),sc));im.setMatrixAt(k,m);c.setHSL(rand(.22,.3),rand(.45,.65),rand(.28,.42));im.setColorAt(k++,c)}
 im.frustumCulled=false;im.receiveShadow=true;LG.add(im)}
// ---------- rim-light patch for characters (makes them pop off the background)
function rim(m,col=0xfff1d8,str=.5){m.userData.rim={value:new THREE.Color(col).multiplyScalar(str)};
 m.onBeforeCompile=sh=>{sh.uniforms.rimC=m.userData.rim;sh.fragmentShader='uniform vec3 rimC;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=rimC*pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.6);')};
 m.customProgramCacheKey=()=>'rim';m.needsUpdate=true;return m}
// ---------- asset loading (works hosted, or fully offline when EMBED is present)
function b64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer}
let LOADP=0;const LOADN=5;function bump(){LOADP++;const b=$('#bar i');if(b)b.style.width=(LOADP/LOADN*100)+'%';const g=$('#go');if(g&&g.disabled)g.textContent='Loading '+Math.round(LOADP/LOADN*100)+'%'}
async function getBuf(k){if(window.EMBED)return b64(EMBED[k]);const r=await fetch('assets/'+k);if(!r.ok)throw Error('load '+k);return r.arrayBuffer()}
let TITLE_URL=window.EMBED?'data:image/jpeg;base64,'+EMBED['title.jpg']:'';
const blobURL=async(k,t)=>URL.createObjectURL(new Blob([await getBuf(k)],{type:t}));
const TITLE_P=window.EMBED?Promise.resolve(TITLE_URL):blobURL('title.jpg','image/jpeg').then(u=>{TITLE_URL=u;const c=$('#card');if(c.classList.contains('t'))c.style.backgroundImage='url('+u+')';return u}).catch(()=>'');
let MUSIC_URL=null;
const LOADER=new THREE.GLTFLoader();
const BGM=new Audio();BGM.loop=true;BGM.volume=.25;let bgmOn=0;
function bgm(){if(!BGM.src&&MUSIC_URL)BGM.src=MUSIC_URL;bgmOn=1;if(!mute&&BGM.src)BGM.play().catch(()=>{})}
document.addEventListener('visibilitychange',()=>{if(document.hidden)BGM.pause();else if(bgmOn&&!mute)BGM.play().catch(()=>{})});
async function loadM(k,sc){const buf=await getBuf(k+'.glb');return new Promise(res=>LOADER.parse(buf,'',g=>{const o=new THREE.Group(),mx=new THREE.AnimationMixer(g.scene),a={},ms=[];
 g.scene.traverse(n=>{if(n.isMesh){n.frustumCulled=false;n.castShadow=true;n.receiveShadow=true;n.material.envMapIntensity=.7;n.material.roughness=.78;rim(n.material);ms.push(n.material)}});g.animations.forEach(c=>a[c.name]=mx.clipAction(c));
 g.scene.scale.setScalar(sc);o.add(g.scene);S.add(o);bump();res({g:o,m:mx,a,cur:null,ms})}))}
function play(o,n,ts=1,once){const a=o.a[n];if(!a)return;if(o.cur===n){a.timeScale=ts;return}const p=o.a[o.cur];a.reset();a.timeScale=ts;a.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat);a.clampWhenFinished=!!once;a.play();if(p)p.crossFadeTo(a,.15,false);o.cur=n}
let CP,BC,BJ,BL;
// ---------- particles: glowing sprites, puffs, confetti, mesh debris
const PT=[];
function spr(c,op=1,add){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:DOT,color:c,transparent:true,depthWrite:false,opacity:op,blending:add?THREE.AdditiveBlending:THREE.NormalBlending}));return m}
function burst(x,y,c,n,sp=5,g=14,z=.5,sz=.42){for(let i=0;i<n&&PT.length<700;i++){const col=new THREE.Color(Array.isArray(c)?c[i%c.length]:c).multiplyScalar(1.5);const m=spr(col);m.position.set(x,y,z);const s=sz*(.6+Math.random()*.8);m.scale.setScalar(s);S.add(m);
 PT.push({m,vx:(Math.random()-.5)*sp*2,vy:Math.random()*sp,vz:(Math.random()-.5)*sp*.6,g,l:.7+Math.random()*.6,l0:1.3,s0:s,s1:0,dr:0})}}
function puff(x,y,z,c,s0,s1,l,vx=0,vy=1.5,op=.7){if(PT.length>=700)return;const m=spr(c,op);m.position.set(x,y,z);m.scale.setScalar(s0);m.material.rotation=Math.random()*TAU;S.add(m);PT.push({m,vx,vy,vz:0,g:0,l,l0:l,s0,s1,dr:1.5,fade:op})}
function sparkle(x,y,z,c,n){for(let i=0;i<n;i++){const m=spr(new THREE.Color(c).multiplyScalar(3),1,true);m.position.set(x,y,z);const s=rand(.15,.35);m.scale.setScalar(s);S.add(m);const a=Math.random()*TAU,v=rand(3,8);PT.push({m,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:rand(-1,1),g:4,l:rand(.4,.8),l0:.8,s0:s,s1:0,dr:2})}}
function ring(x,y,z,c,s1=4,l=.45){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:RING,color:new THREE.Color(c).multiplyScalar(2.5),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));m.position.set(x,y,z);m.scale.setScalar(.3);S.add(m);PT.push({m,vx:0,vy:0,vz:0,g:0,l,l0:l,s0:.3,s1,dr:0,fade:1})}
const CFG=new THREE.PlaneGeometry(.2,.11),CFM=[0xff8fb1,0xffd23f,0x7fd6ff,0x9df0b4,0xc7a6ff,0xff6b4a].map(c=>new THREE.MeshStandardMaterial({color:c,side:THREE.DoubleSide,roughness:.5,metalness:.3,emissive:c,emissiveIntensity:.25}));
function confetti(x,y,z,n,sp=3){for(let i=0;i<n&&PT.length<700;i++){const m=new THREE.Mesh(CFG,CFM[i%CFM.length]);m.position.set(x+rand(-1,1),y,z+rand(-1,1));m.rotation.set(rand(0,TAU),rand(0,TAU),0);S.add(m);PT.push({m,cf:1,vx:rand(-sp,sp),vy:rand(0,sp*1.5),vz:rand(-sp,sp)*.5,g:5,l:rand(2.5,4),l0:4,ax:rand(4,12),ay:rand(3,9)})}}
const DEB=[];
function debris(mesh,x,y,z,vx,vy,vz,l=2.2,floor=0){mesh.position.set(x,y,z);mesh.castShadow=true;S.add(mesh);DEB.push({m:mesh,vx,vy,vz,ax:rand(-12,12),ay:rand(-12,12),l,floor,b:0})}
function updParticles(dt){
 for(let i=PT.length-1;i>=0;i--){const p=PT[i],m=p.m;p.l-=dt;if(p.l<0){S.remove(m);if(!p.cf)m.material.dispose();PT.splice(i,1);continue}
  if(p.cf){p.vx*=1-dt*1.6;p.vz*=1-dt*1.6;p.vy-=p.g*dt;if(p.vy<-2.2)p.vy=-2.2;m.position.x+=p.vx*dt+Math.sin(p.l*p.ay)*dt*.6;m.position.y+=p.vy*dt;m.position.z+=p.vz*dt;m.rotation.x+=p.ax*dt;m.rotation.y+=p.ay*dt;continue}
  p.vy-=p.g*dt;if(p.dr){p.vx*=1-dt*p.dr;p.vy*=1-dt*p.dr*.5}m.position.x+=p.vx*dt;m.position.y+=p.vy*dt;m.position.z+=p.vz*dt;
  const k=1-p.l/p.l0;if(p.fade!==undefined){m.scale.setScalar(lerp(p.s0,p.s1,1-Math.pow(1-k,2)));m.material.opacity=p.fade*(1-k)}else m.scale.setScalar(p.s0*Math.min(1,p.l*2.2))}
 for(let i=DEB.length-1;i>=0;i--){const d=DEB[i],m=d.m;d.l-=dt;d.vy-=24*dt;m.position.x+=d.vx*dt;m.position.y+=d.vy*dt;m.position.z+=d.vz*dt;m.rotation.x+=d.ax*dt;m.rotation.z+=d.ay*dt;
  if(m.position.y<d.floor&&d.vy<0&&d.b<2&&Math.abs(m.position.z)<3){m.position.y=d.floor;d.vy*=-.35;d.vx*=.6;d.vz*=.6;d.ax*=.5;d.ay*=.5;d.b++;if(d.snd)snd(1800+Math.random()*900,.06,'triangle',.02)}
  if(d.l<.4)m.scale.setScalar(Math.max(.01,d.l/.4));if(d.l<0||m.position.y<-10){S.remove(m);DEB.splice(i,1)}}}
// ---------- level
let cur=0,G,L,P,TK=[],st='load',time=0,zone='',shake=0,pile=[],tier=0,rt=0,cardShown=0,TOT=0,TOTM=0,arena={},WF=[],LIGHTS=[];
function gen(i){
 cur=i;L=LV[i];S.remove(LG);LG.traverse(o=>{if(o.geometry&&!o.isSprite&&o.geometry!==MGEO&&o.geometry!==BLADE&&o.geometry!==GM&&o.geometry!==PGEO)o.geometry.dispose()});LG=new THREE.Group();S.add(LG);WF=[];LIGHTS=[];
 const r=rngf(i*131+7);G={g:[],p:[],pad:[],m:[],got:0};
 const addM=(x,y)=>{const m=mattress(G.m.length+i);m.position.set(x,y,0);LG.add(m);const h=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:new THREE.Color(MC[(G.m.length+i)%5]).multiplyScalar(.9),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.55}));h.scale.setScalar(3.2);h.position.set(x,y,-.3);LG.add(h);G.m.push({x,y,m,h,by:y,got:0})};
 G.g.push([-14,32]);let x=32;
 while(x<L.len-45){const w=3.2+r()*2.4,s=x+w,l=12+r()*14;G.g.push([s,s+l]);for(let k=0;k<3;k++)addM(x+w*(k+.5)/3,2.4+Math.sin(k/2*Math.PI)*1.6);x=s+l}
 G.g.push([x,L.len+60]);
 for(const [a,b] of G.g){if(b-a<9)continue;
  for(let t=a+4;t<b-3;t+=4+r()*3)if(r()<.6&&a>20)addM(t,1.2);
  if(a>20&&r()<.8){const cx=a+(b-a)*(.3+.35*r()),w=4+r()*3,p={a:cx-w/2,b:cx+w/2,y:3.3};G.p.push(p);addM(cx-1,4.5);addM(cx+1,4.5);
   if(r()<.55){const hx=cx+w/2+2+r()*2,hp={a:hx-1.6,b:hx+1.6,y:6.2};G.p.push(hp);addM(hx,7.4);}
   if(r()<.4)G.pad.push({x:cx-w/2-3.5,s:0});}}
 // ground tiles
 for(const [a,b] of G.g)for(let t=a;t<b;t+=12){const e=Math.min(b,t+12);const m=bx(e-t,3,10,gmat(GTY[zoneAt((t+e)/2)],t,e-t),(t+e)/2,-1.5,-2);m.castShadow=false}
 // platforms: wooden/stone slab with a soft mattress-topper
 for(const p of G.p){const z=ZN[zoneAt(p.a)];bx(p.b-p.a,.4,3,new THREE.MeshStandardMaterial({color:z.pl,roughness:.6,envMapIntensity:.6}),(p.a+p.b)/2,p.y-.2,0);const t=new THREE.Mesh(rbox(p.b-p.a+.06,.16,3.06,.07,3),new THREE.MeshStandardMaterial({color:0xf6f1e4,map:QT,normalMap:QN,roughness:.7}));t.position.set((p.a+p.b)/2,p.y-.02,0);t.castShadow=t.receiveShadow=true;LG.add(t)}
 for(const q of G.pad){q.g=new THREE.Group();for(let k=0;k<3;k++){const m=mattress(k+1);m.position.y=.2+k*.42;m.rotation.y=k*.3;q.g.add(m)}q.g.position.set(q.x,0,0);LG.add(q.g)}
 const lawn=bx(L.len+260,.1,140,new THREE.MeshStandardMaterial({color:0x3a5a30,roughness:1}),L.len/2,-.06,-77);lawn.castShadow=false;
 G.ob=[];G.wp=[];
 for(const [a,b] of G.g){const e=Math.min(b,L.len-50);if(a<24||e-a<10)continue;
  for(let k=0,n=r()<.75?1+(r()<.5?1:0):0;k<n;k++){const x=a+3+r()*(e-a-6),zn=zoneAt(x);mkOb(x,zn==='suburb'||zn==='down'?0:zn==='falls'?2:1)}}
 G.bb=[];
 for(const [a,b] of G.g){const e=Math.min(b,L.len-50);if(a<24||e-a<10)continue;if(r()<.65){const cx=a+4+r()*(e-a-8),hf=1.3+r()*1.2;mkBug(cx-hf,cx+hf,0)}}
 for(const p of G.p)if(p.a>24&&p.b-p.a>4.2&&p.b<L.len-50&&r()<.5)mkBug(p.a+.8,p.b-.8,p.y);
 // decor
 for(let x=-30;x<L.len+70;x+=3+r()*5){const zn=zoneAt(x),z=-(8+r()*14);
  if(zn==='suburb'){if(r()<.5)house(x,z,r);else tree(x,z,r)}
  else if(zn==='down'){const w=5+r()*4,h=10+r()*16,[wt,we]=WTS[r()*3|0],t=wt.clone(),e=we.clone();t.needsUpdate=e.needsUpdate=true;t.repeat.set(w/2.6,h/3);e.repeat.copy(t.repeat);const zz=z-r()*6;
   bx(w,h,6,new THREE.MeshStandardMaterial({map:t,emissiveMap:e,emissive:0xffc070,emissiveIntensity:1.6,color:[0xc8d0e8,0xe8c8c0,0xd0e8d8][r()*3|0],roughness:.45,metalness:.15,envMapIntensity:1.2}),x,h/2,zz);
   bx(w+.4,.5,6.4,0x2b2f3d,x,h+.25,zz);if(r()<.5)bx(1.4,1,1.6,0x8a8f9c,x+rand(-1,1),h+1,zz)}
  else if(zn==='park'){tree(x,z+r()*5,r,true)}
  else if(zn==='falls'){const h=4+r()*8;const rk=new THREE.Mesh(new THREE.DodecahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:[0x5a5f68,0x686d75,0x4f545c][r()*3|0],roughness:.95,flatShading:true}));rk.scale.set(2.2+r()*2.2,h*.42,2.8);rk.position.set(x,h*.3-1,z-6);rk.rotation.y=r()*3;rk.castShadow=rk.receiveShadow=true;LG.add(rk);
   if(r()<.18){const f=bx(8,9,.6,new THREE.MeshStandardMaterial({map:FT.clone(),color:0xffffff,emissive:0x7ab8d8,emissiveIntensity:.6,roughness:.2,transparent:true,opacity:.92}),x,4.2,-9);f.castShadow=false;f.material.map.needsUpdate=true;f.material.map.repeat.set(1,1.5);WF.push(f.material.map);
    water(10,6,x,-.55,-7);for(let k=0;k<6;k++)LIGHTS.push({mist:1,x:x+rand(-4,4),y:.2,z:-7.5})}}
  else {tree(x,z,r,true);if(r()<.3)bx(1.4,1.4,1.4,0x3f8f3a,x+2,.7,-3)}}
 // street lamps (emissive bulbs that bloom)
 for(let x=10;x<L.len+60;x+=17){const zn=zoneAt(x);if(zn==='suburb'||zn==='down'||zn==='temple'){bx(.16,5,.16,0x2b2b3a,x,2.5,-3.2);bx(.8,.12,.12,0x2b2b3a,x+.3,5,-3.2);const b=bx(.5,.22,.4,new THREE.MeshStandardMaterial({color:0xfff2c0,emissive:0xffe2a0,emissiveIntensity:3}),x+.55,4.88,-3.2);b.castShadow=false;glow(x+.55,4.75,-3.1,0xffd890,3.2,.5)}}
 // grass: back lawn everywhere but downtown, plus park verge
 const gs=[];for(let gx=-30;gx<L.len+70;gx+=6){const zn=zoneAt(gx+3);if(zn==='down')continue;gs.push({x0:gx,x1:gx+6,z0:-15,z1:-7.15,y:0,n:zn==='falls'?40:120});if(zn==='park')gs.push({x0:gx,x1:gx+6,z0:-6.95,z1:-4.25,y:0,n:70})}
 grass(gs);
 if(i===1)water(30,60,L.len-30,-2.9,-30);
 if(i===2){const X=L.len-62,W=new THREE.MeshStandardMaterial({color:0xfbf8f0,roughness:.5,envMapIntensity:.9}),GOLD=new THREE.MeshStandardMaterial({color:0xf0c850,metalness:1,roughness:.22,emissive:0x6a4a00,emissiveIntensity:.4});
  bx(18,6,7,W,X,3,-15);bx(4,16,4,W,X,8,-15);for(const d of[-6,6]){bx(2.6,10,2.6,W,X+d,5,-15)}
  const sp=new THREE.Mesh(new THREE.ConeGeometry(1.6,8,8),GOLD);sp.position.set(X,20,-15);sp.castShadow=true;LG.add(sp);
  const an=new THREE.Mesh(new THREE.SphereGeometry(.7,16,12),new THREE.MeshStandardMaterial({color:0xffe080,emissive:0xffc040,emissiveIntensity:2.5,metalness:1,roughness:.2}));an.position.set(X,24.4,-15);LG.add(an);glow(X,24.4,-14.8,0xffd060,7,.8);
  for(const d of[-6,6]){const c=new THREE.Mesh(new THREE.ConeGeometry(1.4,4,8),GOLD);c.position.set(X+d,12,-15);c.castShadow=true;LG.add(c)}
  for(let k=0;k<5;k++){const w=bx(.9,2.4,.1,new THREE.MeshStandardMaterial({color:0xffe9b0,emissive:0xffd28a,emissiveIntensity:1.6}),X-6+k*3,3.4,-11.45);w.castShadow=false}}
 // arena: trailer, BCM spot, Boojo perch, festoon lights
 const T=L.len+11;arena={tx:T,bx:L.len+3.2,jx:T+2.2};
 const sign=cv(512,128,x=>{const g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'#fffaf0');g.addColorStop(1,'#f3e6c8');x.fillStyle=g;x.fillRect(0,0,512,128);x.fillStyle='#ff8fb1';x.fillRect(0,100,512,28);x.fillStyle='#241a52';x.font='60px Chango,Impact,sans-serif';x.textAlign='center';x.fillText('BCM MATTRESS CO.',256,76)});
 sign.wrapS=sign.wrapT=THREE.ClampToEdgeWrapping;
 const TW=new THREE.MeshStandardMaterial({color:0xf3f0e8,roughness:.35,metalness:.1,envMapIntensity:1.2});
 const tm=[TW,TW,TW,TW,new THREE.MeshStandardMaterial({map:sign,roughness:.4,envMapIntensity:1}),TW];
 bx(15,3.2,3.6,tm,T,1.9,-1.2);bx(15,.3,3.7,0x241a52,T,.4,-1.2);bx(15.2,.12,3.8,new THREE.MeshStandardMaterial({color:0xcccccc,metalness:1,roughness:.25}),T,3.55,-1.2);
 bx(3.2,2.4,3.4,new THREE.MeshStandardMaterial({color:0xe5483c,roughness:.25,metalness:.3,envMapIntensity:1.4}),T+9.2,1.5,-1.2);bx(1.2,1.1,3.3,new THREE.MeshStandardMaterial({color:0x9fd4ff,roughness:.05,metalness:.6,envMapIntensity:2}),T+10.4,2.1,-1.2);
 const HL_=bx(.2,.4,.6,new THREE.MeshStandardMaterial({color:0xfff8e0,emissive:0xfff0c0,emissiveIntensity:3}),T+10.85,1.1,.1);HL_.castShadow=false;
 for(const d of[-5.5,-3.8,6.5,9]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.5,24),mat(0x1a1a1a));w.rotation.x=Math.PI/2;w.position.set(T+d,.8,.7);w.castShadow=true;LG.add(w);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.52,16),new THREE.MeshStandardMaterial({color:0xdddddd,metalness:1,roughness:.2}));hub.rotation.x=Math.PI/2;hub.position.copy(w.position);LG.add(hub)}
 // festoon lights from trailer to a pole over BCM
 const PX=L.len-1;bx(.18,6,.18,0x3a3040,PX,3,-1.6);const BC_=[0xff8fb1,0xffd23f,0x7fd6ff,0x9df0b4,0xffffff];
 for(let k=0;k<=16;k++){const t=k/16,lx=lerp(PX,T-7.4,t),ly=lerp(6,3.6,t)-Math.sin(t*Math.PI)*1.1;const c=BC_[k%5];const b=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(3.5)}));b.position.set(lx,ly,-1.6);LG.add(b);LIGHTS.push({bulb:b,c,ph:k})}
 for(let k=0;k<5;k++)bx(.5,6,.5,0xffffff,L.len+34+k*3,3,-12).visible=false;
 G.total=G.m.length;
}
function glow(x,y,z,c,s,op){const h=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:new THREE.Color(c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:op}));h.scale.setScalar(s);h.position.set(x,y,z);LG.add(h);return h}
function water(w,d,x,y,z){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({color:0x1f86c0,roughness:.06,metalness:.25,envMapIntensity:1.8,transparent:true,opacity:.92}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;LG.add(m);return m}
function house(x,z,r){const w=6+r()*3,h=3.5+r()*1.5,c=[0xf2d7a6,0xb7d3ea,0xf0b8b8,0xcfe6c0][r()*4|0];bx(w,h,6,new THREE.MeshStandardMaterial({color:c,roughness:.8}),x,h/2,z);
 const rf=new THREE.Mesh(new THREE.ConeGeometry(w*.78,2.6,4),new THREE.MeshStandardMaterial({color:0x8a4b3b,roughness:.7,flatShading:true}));rf.rotation.y=Math.PI/4;rf.scale.z=.8;rf.position.set(x,h+1.3,z);rf.castShadow=rf.receiveShadow=true;LG.add(rf);
 bx(.7,1.6,.7,0x8a5a4a,x-w*.25,h+1.6,z-.6);bx(1,2,.2,0x6b4a8a,x,1,z+3.05);bx(1.4,1.2,.2,new THREE.MeshStandardMaterial({color:0xbfe6ff,roughness:.05,metalness:.5,envMapIntensity:2,emissive:0xffd890,emissiveIntensity:.25}),x+w*.28,2.4,z+3.05);bx(w+.3,.2,.3,0xffffff,x,.1,z+3.1)}
function tree(x,z,r,pine){const h=2+r()*2.5;const tr=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,h,7),mat(0x6a4a2a));tr.position.set(x,h/2,z);tr.castShadow=true;LG.add(tr);
 if(pine){for(let k=0;k<3;k++){const c=new THREE.Mesh(new THREE.ConeGeometry((2+r())*(1-k*.25),h*(1.1-k*.2),9),new THREE.MeshStandardMaterial({color:[0x2f8f4a,0x3da35a,0x2b7a46][r()*3|0],roughness:.85,flatShading:true}));c.position.set(x,h+h*.35+k*h*.55,z);c.castShadow=c.receiveShadow=true;LG.add(c)}}
 else{const col=[0x4cae4a,0x5fc25a,0x3f9a46][r()*3|0],M=new THREE.MeshStandardMaterial({color:col,roughness:.85,flatShading:true});for(let k=0;k<3;k++){const s=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3+r()*.9,1),M);s.position.set(x+(k-1)*.9,h+1+r()*.8,z+(r()-.5));s.castShadow=s.receiveShadow=true;LG.add(s)}}}
// ---------- tacos
function mkTaco(){const g=new THREE.Group(),sh=new THREE.Mesh(new THREE.TorusGeometry(.42,.2,10,18,Math.PI),new THREE.MeshStandardMaterial({color:0xf2b134,roughness:.6}));sh.rotation.z=Math.PI;sh.scale.z=2;g.add(sh);
 const l=new THREE.Mesh(new THREE.SphereGeometry(.34,10,8),mat(0x52b447));l.scale.set(1.3,.35,1.3);l.position.y=.1;g.add(l);const t=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),new THREE.MeshStandardMaterial({color:0xe0432f,roughness:.3}));t.position.set(.1,.15,0);g.add(t);g.traverse(o=>o.castShadow=true);return g}
function throwTaco(){const o={x:arena.jx-1,y:5.8},tt=.85+Math.abs(P.x-o.x)/32,tx=P.x+P.vx*.45+(Math.random()-.5)*2.6,ty=P.y+1.1,g=24;
 const m=mkTaco();m.position.set(o.x,o.y,0);m.scale.setScalar(1.3);S.add(m);TK.push({m,x:o.x,y:o.y,vx:(tx-o.x)/tt,vy:(ty-o.y+.5*g*tt*tt)/tt,g});BJ.sq=.3;snd(220,.18,'sawtooth',.04,-120)}
// ---------- roaming Boojos + goo
let EN=[],GOO=[],PD=[],ambT=4,superT=12,BK=[],bkT=8;
const GM=new THREE.SphereGeometry(1,10,8),GMAT=new THREE.MeshStandardMaterial({color:0xc4142b,roughness:.15,emissive:0x400008,envMapIntensity:1.5}),PGEO=new THREE.CircleGeometry(1,20),
 PMAT=new THREE.MeshStandardMaterial({color:0xa8102a,roughness:.1,emissive:0x2a0005,transparent:true,opacity:.93,depthWrite:false,envMapIntensity:1.6});
const SAUCE=new THREE.MeshStandardMaterial({color:0xb3200f,roughness:.2,emissive:0x2a0400,envMapIntensity:1.4}),SAUCEP=new THREE.MeshStandardMaterial({color:0x8a1206,roughness:.1,emissive:0x1c0200,transparent:true,opacity:.98,depthWrite:false,envMapIntensity:1.6});
function spawnBoojo(x,big){const c=THREE.SkeletonUtils.clone(BJ.g.children[0]),g=new THREE.Group();g.add(c);S.add(g);const m=new THREE.AnimationMixer(c),a={},ms=[];
 c.traverse(n=>{if(n.isMesh){n.material=rim(n.material.clone());if(big)n.material.color.setHex(0xc08aff);ms.push(n.material);n.castShadow=true}});
 for(const n of['Walking','Running'])a[n]=m.clipAction(BJ.a[n].getClip());
 const s=big?1.25:1;g.scale.set(big?1.45:1,s,big?1.45:1);
 EN.push({g,m,a,cur:null,ms,s,hp:big?2:1,inv:0,fl:0,kb:0,x,y:10,vy:0,fall:1,dir:-1,hold:0,sp:big?1.7:2.3+Math.random()*1.5,yaw:-Math.PI/2})}
function spawnBallinki(x){const c=THREE.SkeletonUtils.clone(BL.g.children[0]),g=new THREE.Group();g.add(c);S.add(g);c.traverse(n=>{if(n.isMesh)n.castShadow=true});const m=new THREE.AnimationMixer(c),a={};
 for(const n of['Running','Walking','360_Power_Spin_Jump','air_squat'])a[n]=m.clipAction(BL.a[n].getClip());
 BK.push({g,m,a,cur:null,x,y:10,vy:0,vx:0,fall:1,dir:-1,hold:0,cd:0,sp:6.2,st:'run',t:0,gas:0,tg:null,yaw:-Math.PI/2})}
function gooAt(cx,cy,cz,n,q,spd,gm,pm){for(let i=0;i<n;i++){const r=(.07+Math.random()*.16)*q,m=new THREE.Mesh(GM,gm);m.scale.setScalar(r);m.position.set(cx+(Math.random()-.5)*.8*q,cy+(Math.random()-.5)*.8*q,cz+(Math.random()-.5)*.8);LG.add(m);GOO.push({m,vx:(Math.random()-.5)*spd*q,vy:3+Math.random()*spd*.9*q,vz:(Math.random()-.5)*2.4,r,pm})}}
function splat(e){const s=e.s,q=Math.sqrt(s),cx=e.x,cy=e.y+1.1*s,n=s>1?120:48;gooAt(cx,cy,0,n,q,11,GMAT,PMAT);
 burst(cx,cy,[0xff2b4a,0xc4142b,0xff6b81],18,8,16);ring(cx,cy,.5,0xff4060,3.5);snd(110,.35,'sawtooth',.09,-70);snd(600,.12,'square',.04,-400);shake=.25*q}
function hurt(n,dir,msg){P.inv=1.4;P.stun=.4;P.vy=8;P.vx=dir*7;P.on=0;const l=Math.min(P.got,n);P.got-=l;$('#n').textContent=P.got;toast(msg+(l?' −'+l+(l>1?' mattresses':' mattress'):''));snd(130,.3,'sawtooth',.07,-60);shake=.25}
function mkBug(x0,x1,y){const g=new THREE.Group(),M=(geo,c,px,py,pz)=>{const m=new THREE.Mesh(geo,typeof c==='number'?mat(c):c);m.position.set(px,py,pz);m.castShadow=true;g.add(m);return m};
 const shell=new THREE.MeshStandardMaterial({color:0x8a3418,roughness:.25,envMapIntensity:1.4});
 M(new THREE.SphereGeometry(.5,16,10),shell,0,.4,0).scale.set(1.25,.75,.9);M(new THREE.SphereGeometry(.3,12,8),new THREE.MeshStandardMaterial({color:0xa54522,roughness:.3}),.62,.38,0);
 for(const s of[-1,1]){M(new THREE.SphereGeometry(.08,8,6),0xffffff,.82,.5,s*.15);M(new THREE.SphereGeometry(.04,6,6),0x000000,.88,.5,s*.15);M(new THREE.BoxGeometry(.4,.04,.04),0x3a140a,1,.68,s*.12).rotation.z=.5}
 const legs=[];for(let k=0;k<6;k++){const s=k<3?1:-1,l=M(new THREE.BoxGeometry(.07,.4,.07),0x3a140a,(k%3-1)*.4,.18,s*.45);l.rotation.x=s*.6;legs.push(l)}
 g.position.set((x0+x1)/2,y,.1);LG.add(g);G.bb.push({x0,x1,x:(x0+x1)/2,y,dir:Math.random()<.5?1:-1,sp:1.6+Math.random()*1.2,g,legs,dead:0,t:0})}
const isSlick=x=>G.wp.some(w=>Math.abs(x-w.x)<w.r)||PD.some(q=>q.k>.5&&Math.abs(x-q.m.position.x)<q.rx*.85);
function mkOb(x,ty){const g=new THREE.Group();let h=1.1,sm=1;const M=(geo,c,y)=>{const m=new THREE.Mesh(geo,typeof c==='number'?mat(c):c);m.position.y=y;m.castShadow=true;g.add(m);return m};
 if(ty===0){M(new THREE.ConeGeometry(.45,1.1,16),new THREE.MeshStandardMaterial({color:0xff6a1a,roughness:.4}),.65);M(new THREE.CylinderGeometry(.3,.36,.2,16),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:.3}),.55);M(new THREE.BoxGeometry(1,.12,1),0xcc4a0a,.06)}
 else if(ty===1){M(new THREE.IcosahedronGeometry(.65,1),new THREE.MeshStandardMaterial({color:0x2e7d32,flatShading:true,roughness:.8}),.6).scale.set(1.15,.9,1);for(let k=0;k<6;k++){const s=M(new THREE.ConeGeometry(.1,.4,5),0xb71c1c,.7+Math.sin(k*2)*.2),an=k/6*TAU;s.position.x=Math.cos(an)*.55;s.position.z=Math.sin(an)*.4;s.rotation.z=-Math.cos(an)*1.2}h=1.2}
 else{M(new THREE.DodecahedronGeometry(.75,1),new THREE.MeshStandardMaterial({color:0x7d838c,flatShading:true,roughness:.9}),.6).scale.set(1.2,.95,1);h=1.3;sm=0}
 g.position.set(x,0,.1);LG.add(g);G.ob.push({x,h,sm,g,dead:0})}
function puddle(x,y,z,r,pm=PMAT){const m=new THREE.Mesh(PGEO,pm);m.rotation.x=-Math.PI/2;m.position.set(x,y+.03+Math.random()*.02,z);m.renderOrder=1;m.scale.set(.01,.01,1);m.receiveShadow=true;LG.add(m);const rx=r*(2.2+Math.random()*2);PD.push({m,rx,ry:rx*(.6+Math.random()*.5),k:0});if(PD.length>360)LG.remove(PD.shift().m)}
// ---------- BCM'S PASTA SAUCE JARS
const JLAB=cv(512,128,x=>{x.fillStyle='#fff3d6';x.fillRect(0,0,512,128);x.fillStyle='#c8281a';x.fillRect(0,0,512,18);x.fillRect(0,110,512,18);x.fillStyle='#2f8a3a';for(let i=0;i<512;i+=128){x.beginPath();x.ellipse(i+22,64,14,7,.6,0,TAU);x.fill()}
 x.fillStyle='#c8281a';x.font='44px Chango,Impact,sans-serif';x.textAlign='center';x.fillText("BCM'S",160,62);x.fillText("BCM'S",416,62);x.fillStyle='#241a52';x.font='bold 26px Figtree,Arial,sans-serif';x.fillText('PASTA SAUCE',160,96);x.fillText('PASTA SAUCE',416,96)});
JLAB.wrapT=THREE.ClampToEdgeWrapping;
const JM={glass:new THREE.MeshStandardMaterial({color:0xeaf6ff,roughness:.04,metalness:.1,transparent:true,opacity:.32,envMapIntensity:2.6,depthWrite:false}),
 sauce:new THREE.MeshStandardMaterial({color:0xa3160c,roughness:.3,emissive:0x2a0300,envMapIntensity:.8}),
 lid:new THREE.MeshStandardMaterial({color:0xe0b040,metalness:1,roughness:.25,envMapIntensity:1.4}),
 lab:new THREE.MeshStandardMaterial({map:JLAB,roughness:.6,side:THREE.DoubleSide})};
const JG={body:new THREE.CylinderGeometry(.21,.21,.48,22),neck:new THREE.CylinderGeometry(.17,.21,.07,22),sauce:new THREE.CylinderGeometry(.19,.19,.4,18),lid:new THREE.CylinderGeometry(.185,.185,.1,22),lab:new THREE.CylinderGeometry(.214,.214,.24,26,1,true),shard:new THREE.TetrahedronGeometry(.09)};
function mkJar(){const g=new THREE.Group(),add=(geo,m,y)=>{const o=new THREE.Mesh(geo,m);o.position.y=y;g.add(o);return o};
 add(JG.sauce,JM.sauce,-.02).castShadow=true;add(JG.lab,JM.lab,-.02);add(JG.body,JM.glass,0);add(JG.neck,JM.glass,.27);add(JG.lid,JM.lid,.33).castShadow=true;g.scale.setScalar(1.25);return g}
let JARS=[];
function throwJar(o,vx,vy,vz,opt={}){const m=mkJar();m.position.copy(o);S.add(m);JARS.push({m,v:new THREE.Vector3(vx,vy,vz),av:new THREE.Vector3(rand(-9,9),rand(-4,4),rand(-9,9)),cam:!!opt.cam,lazy:!!opt.lazy});snd(520,.12,'triangle',.03,-200)}
function jarSupport(x,z,y0,y1){const T=arena.tx;if(x>T-7.5&&x<T+7.5&&z>-3&&z<.6&&y0>=3.6&&y1<=3.6)return 3.62;if(z>-7&&z<3&&y1<=.22&&y0>=-.3&&sup(x,.2)!==null)return 0;if(z<=-7&&z>-60&&y1<=0&&y0>=-.3)return 0;return null}
function smashJar(j,y){const p=j.m.position;S.remove(j.m);gooAt(p.x,y+.25,p.z,26,1,7,SAUCE,SAUCEP);
 for(let i=0;i<8;i++){const s=new THREE.Mesh(JG.shard,JM.glass);const d=debris(s,p.x,y+.3,p.z,rand(-5,5),rand(3,8),rand(-2,2),1.6,y);}
 const lid=new THREE.Mesh(JG.lid,JM.lid);lid.scale.setScalar(1.25);debris(lid,p.x,y+.4,p.z,rand(-3,3),rand(7,10),rand(-1,1),2.4,y);DEB[DEB.length-1].snd=1;
 burst(p.x,y+.3,[0xffffff,0xd8f2ff],10,7,14,p.z,.3);burst(p.x,y+.3,[0xc8281a,0x8e140a,0x3f9a2f],10,6,14,p.z,.35);puff(p.x,y+.3,p.z,0xffb0a0,.5,2.2,.5,0,.5,.35);smashSnd();shake=Math.max(shake,.12)}
function screenSplat(){const d=document.createElement('div');d.className='splat';d.style.left=(32+Math.random()*36)+'%';d.style.top=(30+Math.random()*26)+'%';
 const N=18,pts=[];for(let i=0;i<N;i++){const a=i/N*TAU,r=62+Math.random()*26+(i%3===0?18:0);pts.push([100+Math.cos(a)*r,100+Math.sin(a)*r])}
 let path='M'+pts[0][0].toFixed(1)+','+pts[0][1].toFixed(1);for(let i=0;i<N;i++){const a=pts[i],b=pts[(i+1)%N],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;path+=` Q${a[0].toFixed(1)},${a[1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`}path+='Z';
 let extra='';for(let i=0;i<9;i++){const a=Math.random()*TAU,r=95+Math.random()*45;extra+=`<circle cx="${100+Math.cos(a)*r}" cy="${100+Math.sin(a)*r}" r="${4+Math.random()*11}" fill="url(#sg${SPL.length})"/>`}
 for(let i=0;i<5;i++){const x=55+Math.random()*90,w=7+Math.random()*9,h=50+Math.random()*110;extra+=`<g class="drip" data-d="${(.2+Math.random()*.6).toFixed(2)}" style="transform-box:fill-box;transform-origin:50% 0;transform:scaleY(.15)"><rect x="${x}" y="110" width="${w}" height="${h}" rx="${w/2}" fill="#a8180c"/><circle cx="${x+w/2}" cy="${110+h}" r="${w*.68}" fill="#a8180c"/><rect x="${x+w*.2}" y="116" width="${w*.22}" height="${h*.8}" rx="${w*.11}" fill="#fff" opacity=".22"/></g>`}
 for(let i=0;i<5;i++)extra+=`<ellipse cx="${70+Math.random()*60}" cy="${70+Math.random()*60}" rx="${3+Math.random()*4}" ry="${2+Math.random()*2}" fill="#3f8a2f" transform="rotate(${Math.random()*180} 100 100)"/>`;
 d.innerHTML=`<svg viewBox="0 0 200 200"><defs><radialGradient id="sg${SPL.length}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#e8452e"/><stop offset=".55" stop-color="#b8200f"/><stop offset="1" stop-color="#7c1008"/></radialGradient></defs>${extra}<path d="${path}" fill="url(#sg${SPL.length})"/><ellipse cx="78" cy="72" rx="26" ry="13" fill="#fff" opacity=".38" transform="rotate(-30 78 72)"/><ellipse cx="122" cy="118" rx="7" ry="4" fill="#fff" opacity=".3"/></svg>`;
 document.body.appendChild(d);SPL.push({el:d,t:0,dr:[...d.querySelectorAll('.drip')].map(g=>({g,d:+g.dataset.d}))});splatSnd();shake=Math.max(shake,.35)}
const SPL=[];
function updSplats(dt){for(let i=SPL.length-1;i>=0;i--){const q=SPL[i];q.t+=dt;const t=q.t,k=Math.min(1,t/.2),bk=1+2.2*Math.pow(k-1,3)+1.2*Math.pow(k-1,2),out=Math.max(0,(t-2.8)/1.4);
 q.el.style.transform=`translate(-50%,${-50+out*12}%) scale(${(t<.2?bk:1)+out*.03})`;q.el.style.opacity=1-out;q.dr.forEach(o=>{const f=cl((t-o.d)/3.4,0,1);o.g.style.transform=`scaleY(${.15+.85*(1-Math.pow(1-f,2))})`});if(t>4.2){q.el.remove();SPL.splice(i,1)}}}
function updJars(dt){for(let i=JARS.length-1;i>=0;i--){const j=JARS[i],p=j.m.position,y0=p.y;j.v.y-=22*dt;p.addScaledVector(j.v,dt);j.m.rotation.x+=j.av.x*dt;j.m.rotation.y+=j.av.y*dt;j.m.rotation.z+=j.av.z*dt;
 if(j.cam){if(p.distanceTo(cam.position)<4.5||p.z>cam.position.z-3){S.remove(j.m);JARS.splice(i,1);screenSplat()}continue}
 const s=jarSupport(p.x,p.z,y0,p.y);if(s!==null){JARS.splice(i,1);smashJar(j,s);continue}
 if(p.y<-12){S.remove(j.m);JARS.splice(i,1)}}}
// ---------- speech bubbles
let BUB=null;
function say(txt,dur=1.6,col='#241a52'){if(BUB){S.remove(BUB.s)}const t=cv(512,256,x=>{x.fillStyle='rgba(0,0,0,.25)';rr(x,22,26,468,150,40);x.fill();x.fillStyle='#fff8e6';x.strokeStyle='#241a52';x.lineWidth=10;rr(x,16,14,468,150,40);x.fill();x.stroke();
  x.beginPath();x.moveTo(200,160);x.lineTo(236,236);x.lineTo(270,160);x.closePath();x.fill();x.stroke();x.fillStyle='#fff8e6';x.fillRect(196,150,80,12);
  let fs=72;x.font=fs+'px Chango,Impact,sans-serif';while(x.measureText(txt).width>420&&fs>30){fs-=4;x.font=fs+'px Chango,Impact,sans-serif'}x.fillStyle=col;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,250,92)});
 t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,fog:false}));s.renderOrder=20;s.center.set(.46,.05);S.add(s);BUB={s,t:0,dur}}
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function updBubble(dt){if(!BUB)return;BUB.t+=dt;const t=BUB.t,s=BUB.s,k=t<.35?1+Math.sin(t/.35*Math.PI)*.25*(1-t/.35)-(1-ease(t/.2))*1:1;const out=t>BUB.dur?Math.max(0,1-(t-BUB.dur)/.25):1;
 const hp=new THREE.Vector3();(RIG&&RIG.b.Head?RIG.b.Head:BC.g).getWorldPosition(hp);s.position.set(hp.x+.6,hp.y+.9,hp.z+.5);const sc=2.6*Math.max(.01,k*out);s.scale.set(sc*2,sc,1);if(out<=0){S.remove(s);BUB=null}}
// ---------- BCM procedural rig (layered on top of his clips)
let RIG=null;const _v=new THREE.Vector3(),_v2=new THREE.Vector3(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_pq=new THREE.Quaternion(),_gq=new THREE.Quaternion(),QI=new THREE.Quaternion();
function mkRig(o){const b={};o.g.traverse(n=>{if(n.isBone)b[n.name]=n});const rest={};for(const k in b)rest[k]=b[k].quaternion.clone();o.g.updateMatrixWorld(true);
 const lp=new THREE.Vector3(),hp=new THREE.Vector3(),fp=new THREE.Vector3(),hd=new THREE.Vector3();b.LeftHand.getWorldPosition(lp);b.Hips.getWorldPosition(hp);
 const F=b.headfront?(b.headfront.getWorldPosition(fp),b.Head.getWorldPosition(hd),Math.sign(fp.z-hd.z)||1):1;
 const ax=['L','R'].map(()=>({u:new THREE.Vector3(0,-1,0),l:new THREE.Vector3(0,-1,0)}));
 return{b,rest,L:Math.sign(lp.x-hp.x)||1,F,w:0,wt:0,arm:{L:{u:new THREE.Vector3(0,-1,0),l:new THREE.Vector3(0,-1,0)},R:{u:new THREE.Vector3(0,-1,0),l:new THREE.Vector3(0,-1,0)}},tgt:{L:{u:new THREE.Vector3(),l:new THREE.Vector3()},R:{u:new THREE.Vector3(),l:new THREE.Vector3()}},nod:0,shake:0,tilt:0,lean:0,cur:{nod:0,shake:0,tilt:0,lean:0}}}
// arm direction in "arm space": out (away from body), up, fwd → model space
function A(side,out,up,fwd,dst){const s=side==='L'?1:-1;return dst.set(out*s*RIG.L,up,fwd*RIG.F).normalize()}
function setArm(side,uo,uu,uf,lo,lu,lf){A(side,uo,uu,uf,RIG.tgt[side].u);A(side,lo,lu,lf,RIG.tgt[side].l)}
function rotWorld(bone,qw){bone.parent.getWorldQuaternion(_pq);_q2.copy(_pq).invert().multiply(qw).multiply(_pq);bone.quaternion.premultiply(_q2);bone.updateMatrixWorld(true)}
function aimBone(bone,child,dirModel,w){if(!bone||!child)return;bone.getWorldPosition(_v);child.getWorldPosition(_v2);_v2.sub(_v).normalize();const d=dirModel.clone().applyQuaternion(_gq);_q.setFromUnitVectors(_v2,d);const qw=QI.clone().slerp(_q,w);rotWorld(bone,qw)}
function turnBone(bone,axis,ang){if(!bone||!ang)return;const a=axis.clone().applyQuaternion(_gq);_q.setFromAxisAngle(a,ang);rotWorld(bone,_q)}
const AX=new THREE.Vector3(1,0,0),AY=new THREE.Vector3(0,1,0),AZ=new THREE.Vector3(0,0,1);
function rigReset(){if(!RIG)return;for(const k in RIG.b)RIG.b[k].quaternion.copy(RIG.rest[k])}
function rigApply(dt){if(!RIG)return;const r=RIG,b=r.b;r.w+=(r.wt-r.w)*Math.min(1,dt*8);if(r.w<.002)return;
 BC.g.updateMatrixWorld(true);BC.g.getWorldQuaternion(_gq);const k=Math.min(1,dt*16);
 for(const s of['L','R']){r.arm[s].u.lerp(r.tgt[s].u,k).normalize();r.arm[s].l.lerp(r.tgt[s].l,k).normalize()}
 for(const n of['nod','shake','tilt','lean'])r.cur[n]+=(r[n]-r.cur[n])*Math.min(1,dt*14);
 turnBone(b.UpperChest||b.Chest,AX,r.cur.lean*r.F*r.w);
 aimBone(b.LeftUpperArm,b.LeftLowerArm,r.arm.L.u,r.w);aimBone(b.LeftLowerArm,b.LeftHand,r.arm.L.l,r.w);
 aimBone(b.RightUpperArm,b.RightLowerArm,r.arm.R.u,r.w);aimBone(b.RightLowerArm,b.RightHand,r.arm.R.l,r.w);
 turnBone(b.Head,AY,r.cur.shake*r.w);turnBone(b.Head,AX,r.cur.nod*r.F*r.w);turnBone(b.Head,AZ,r.cur.tilt*r.w)}
function handPos(side,out){const h=RIG&&RIG.b[side==='L'?'LeftHand':'RightHand'];if(h)h.getWorldPosition(out);else out.set(arena.bx,2,0);return out}
// ---------- BCM behaviour state machine
const BCS={mode:'idle',t:0,beat:-1,jars:0,yaw:-Math.PI/2,sy:1,y:0,camJar:0,said:0,clap:0};
function bcmMode(m){BCS.mode=m;BCS.t=0;BCS.beat=-1;BCS.said=0;BCS.camJar=0;BCS.ph=0;BCS.thrown=-1;BCS.puff=0}
const HAPPY=['MAMMA MIA!','BELLISSIMO!','SAUCE FOR ALL!','WHAT A HAUL!','MOLTO BENE!'];
function bcmUpdate(dt){const r=RIG,s=BCS;if(!BC)return;s.t+=dt;const t=s.t,x0=arena.bx,face=r?(r.F>0?0:Math.PI):0;let y=0,yaw=-Math.PI/2,sx=1,sy=1;
 const def=()=>{setArm('L',.12,-1,.05,.05,-1,.15);setArm('R',.12,-1,.05,.05,-1,.15);r.nod=r.shake=r.tilt=r.lean=0};
 if(!r){return}
 if(s.mode==='idle'){r.wt=0;def()}
 else if(s.mode==='test'){r.wt=1;yaw=face+(s.ty||0)}
 else if(s.mode==='wave'){r.wt=1;def();yaw=-Math.PI/2+.75;const w=Math.sin(t*9);setArm('R',.55,.75,.25,.55+w*.45,.85,.1);r.tilt=Math.sin(t*4.5)*.12;r.nod=-.08;if(!s.said&&t>.3){s.said=1;say('COME ON!!',1.4)}}
 else if(s.mode==='clap'){r.wt=1;yaw=-Math.PI/2+.9;s.clap=Math.max(0,s.clap-dt*5);const o=s.clap;setArm('L',.32,-.15,.95,-.6+o*.7,.35,.75);setArm('R',.32,-.15,.95,-.6+o*.7,.35,.75);r.nod=-Math.sin(t*9)*.12-.05;r.shake=0;r.tilt=Math.sin(t*3)*.1;r.lean=-.05;y=o*.18}
 else if(s.mode==='happy'){r.wt=1;
  if(t<.35){const k=ease(t/.35);setArm('L',.4,-.75,-.5,.3,-.8,-.4);setArm('R',.4,-.75,-.5,.3,-.8,-.4);sy=1-.16*k;sx=1+.08*k;yaw=lerp(-Math.PI/2,face,k);r.nod=.15;r.lean=.15}
  else if(t<1.3){const k=(t-.35)/.95;if(!s.ph){s.ph=1;snd(330,.4,'triangle',.08,500);burst(x0,.2,0xd8d0c0,14,5,6,.4)}y=Math.sin(k*Math.PI)*3.4;yaw=face+k*TAU;setArm('L',.5,.85,.1,.3,1,.05);setArm('R',.5,.85,.1,.3,1,.05);r.nod=-.35;r.lean=-.2;sy=1+.12*Math.sin(k*Math.PI);sx=1-.05*Math.sin(k*Math.PI)}
  else{const T=t-1.3,BP=.62,bi=Math.floor(T/BP),p=(T%BP)/BP;if(s.ph===1){s.ph=2;s.yaw=face;shake=.3;burst(x0,.2,0xd8d0c0,20,6,6,.4);ring(x0,.15,.4,0xffe0a0,5);say('MAMMA MIA!',1.5);snd(90,.25,'sine',.15,-30)}
   y=Math.abs(Math.sin(p*Math.PI))*(bi%4===3?1.4:.75);const land=Math.max(0,1-p*5)+Math.max(0,(p-.85)*6);sy=1-.1*land+.06*Math.sin(p*Math.PI);sx=1+.05*land;yaw=face+Math.sin(T*3.1)*.45;
   if(bi!==s.beat){s.beat=bi;if(bi%5===4&&bi>0)say(HAPPY[(bi/5|0)%HAPPY.length],1.3);if(bi>0&&Math.random()<.5)snd(523*Math.pow(1.122,bi%6),.12,'triangle',.05)}
   if(bi%4===3){setArm('L',.55,.8,.15,.35,1,.1);setArm('R',.55,.8,.15,.35,1,.1);r.nod=-.4;r.shake=Math.sin(T*18)*.15;r.lean=-.18}
   else{const th=bi%2?'L':'R',ot=th==='L'?'R':'L';
    if(p<.42){const k=ease(p/.42);setArm(th,.35,.55,-.75,.15,.75,-.65);r.lean=.12*k}else{setArm(th,.3,.7,.65,.18,.45,.88);r.lean=-.1}
    const pump=Math.sin(p*TAU);setArm(ot,.55,.35+pump*.35,.3,.25,1,.15+pump*.2);r.nod=-.15+Math.sin(p*TAU)*.15;r.shake=0;r.tilt=Math.sin(T*2)*.15;
    if(p>=.5&&s.thrown!==bi&&JARS.length<14&&(!cardShown||bi%2===0)){s.thrown=bi;const hp=handPos(th,new THREE.Vector3());s.jars++;
     if(bi===6&&!s.camJar){s.camJar=1;const tt=.85,tg=cam.position.clone().add(new THREE.Vector3(rand(-1.5,1.5),rand(-1.6,-.2),0)),g=22;throwJar(hp,(tg.x-hp.x)/tt,(tg.y-hp.y+.5*g*tt*tt)/tt,(tg.z-hp.z)/tt,{cam:1});say('CATCH!',1)}
     else{const left=Math.random()<.72;throwJar(hp,left?-rand(2,6.5):rand(2.5,5),left?rand(9,12.5):rand(13,15.5),left?rand(-.5,2.2):rand(-1.6,0))}}}
   if(Math.random()<dt*12)confetti(x0+rand(-6,10),11,rand(-2,1),1,1.5);if(Math.random()<dt*2)sparkle(x0+rand(-1,1),rand(1.5,3.5),.8,0xffd23f,6)}}
 else if(s.mode==='meh'){r.wt=1;yaw=face-.25;
  if(t<1.7){setArm('L',.15,-.6,.75,-.95,.3,.25);setArm('R',.18,-.58,.78,-.95,.22,.3);r.shake=Math.sin(t*2.6)*.38;r.nod=.12;r.tilt=.1;r.lean=.04;y=Math.max(0,Math.sin(t*12))*.04;if(!s.said&&t>.25){s.said=1;say('Meh.',1.2,'#6a5a8a')}
   if(t>1.1&&!s.puff){s.puff=1;const hp=new THREE.Vector3();r.b.Head.getWorldPosition(hp);for(let i=0;i<5;i++)puff(hp.x-.3+i*.05,hp.y+.1,hp.z+.6,0xe8eef8,.2,1.1,1,rand(-.8,-.3),.4,.55);nz(.6,600,.5,.12,'lowpass')}}
  else if(t<2.8){const k=ease((t-1.7)/.3);setArm('L',.9,-.2+k*.15,.2,.35,.25,.9);setArm('R',.9,-.2+k*.15,.2,.35,.25,.9);r.shake=0;r.nod=-.05;r.tilt=.28*Math.sin(Math.min(1,(t-1.7)/.5)*Math.PI);y=Math.sin(Math.min(1,(t-1.7)/.4)*Math.PI)*.18;if(!s.ph){s.ph=1;say('I guess…',1.1,'#6a5a8a')}}
  else{const k=t-2.8;if(k<.25)setArm('R',.4,.6,-.5,.2,.8,-.6);else setArm('R',.3,.3,-.8,.1,.4,-.9);setArm('L',.15,-.6,.75,-.95,.3,.25);r.nod=.1;r.tilt=-.1;
   if(k>=.25&&s.ph===1){s.ph=2;const hp=handPos('R',new THREE.Vector3());throwJar(hp,rand(1,2.5),8,-5.5,{lazy:1})}
   if(k>1.6&&s.ph===2)s.ph=3;if(s.ph===3)setArm('R',.18,-.58,.78,-.95,.22,.3)}}
 else if(s.mode==='mad'){r.wt=1;yaw=face+Math.sin(t*25)*.25;const a=t*14,b=t*17.3;
  setArm('L',.55+.3*Math.sin(a),.55+.4*Math.sin(b),.2*Math.cos(a*.7),.35+.4*Math.sin(a+1.4),.7+.3*Math.cos(b),.2);setArm('R',.55+.3*Math.sin(a+2),.55+.4*Math.sin(b+1.7),.2*Math.cos(a*.6),.35+.4*Math.sin(a+3),.7+.3*Math.cos(b+.8),.2);
  r.shake=Math.sin(t*22)*.42;r.nod=-.18+Math.sin(t*9)*.1;r.tilt=Math.sin(t*11)*.12;r.lean=.12;
  const st_=Math.abs(Math.sin(t*9));y=st_*.5;if(Math.sin(t*9)*Math.sin((t-dt)*9)<0){shake=Math.max(shake,.18);burst(x0+rand(-.5,.5),.15,[0x9a8a7a,0xd8d0c0],5,4,8,.4,.5);snd(70,.12,'sine',.12,-20)}
  if(!s.said&&t>.15){s.said=1;say('WHAT?!',1.4,'#c4142b')}
  if(t>.8&&t<1.05)setArm('R',.2,1,.1,.1,1,.05);if(t>=1.05&&!s.ph){s.ph=1;const hp=handPos('R',new THREE.Vector3());throwJar(hp,rand(-1,1),-14,rand(.8,1.8));setArm('R',.3,-.2,.9,.2,-.6,.8)}
  if(Math.random()<dt*9){const hp=new THREE.Vector3();r.b.Head.getWorldPosition(hp);puff(hp.x+rand(-.3,.3),hp.y+.5,hp.z,0xffffff,.25,1.4,.9,rand(-.4,.4),2.5,.7)}}
 // body transform
 const spin=s.mode==='happy'&&t>.35&&t<1.3;if(spin)s.yaw=yaw;else{let dy=yaw-s.yaw;dy=((dy+Math.PI)%TAU+TAU)%TAU-Math.PI;s.yaw+=dy*Math.min(1,dt*10)}
 BC.g.position.set(x0+(s.mode==='mad'?Math.sin(t*45)*.12:0),y,1.25);BC.g.rotation.y=s.yaw;BC.g.scale.set(sx,sy,sx)}
// ---------- hell, curse, pause
const HX=5000,HG=new THREE.Group();HG.position.set(HX,0,0);HG.visible=false;S.add(HG);
let GB=null,hole,holeB,HL={},ct=0,lvlAdded=0,lvlM=0,paused=false,viewIn=false;
const ZF=()=>viewIn?1/1.5:1;
function setView(v){viewIn=!!v;$('#vo').classList.toggle('sel',!v);$('#vi').classList.toggle('sel',!!v)}
{const LV_=cv(512,512,x=>{x.fillStyle='#1a0505';x.fillRect(0,0,512,512);noise(x,0,0,512,512,2500,['#3a0a0a','#2a0606','#521010'],4);x.strokeStyle='#ff5a14';x.shadowColor='#ff9a30';x.shadowBlur=14;x.lineWidth=5;for(let i=0;i<22;i++){x.beginPath();let px=Math.random()*512,py=Math.random()*512;x.moveTo(px,py);for(let k=0;k<5;k++){px+=Math.random()*90-45;py+=Math.random()*90-45;x.lineTo(px,py)}x.stroke()}});LV_.repeat.set(6,2.4);
 const room=new THREE.Mesh(new THREE.BoxGeometry(110,44,50),new THREE.MeshStandardMaterial({map:LV_,emissiveMap:LV_,emissive:0xffffff,emissiveIntensity:1.4,side:THREE.BackSide,roughness:1}));room.position.set(0,22,-6);room.receiveShadow=true;HG.add(room);
 for(let x=-44;x<=44;x+=8){const gm=new THREE.ConeGeometry(1.5+Math.random(),5+Math.random()*3,8);gm.translate(0,3,0);const fc=Math.random()<.5?0xff5a14:0xffb02e,f=new THREE.Mesh(gm,new THREE.MeshBasicMaterial({color:new THREE.Color(fc).multiplyScalar(1.5),fog:false,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));f.position.set(x+Math.random()*3,.01,-22);f.userData.f=1;HG.add(f);
  const h=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:new THREE.Color(fc).multiplyScalar(1.4),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.7}));h.scale.set(9,12,1);h.position.set(f.position.x,4,-21.5);HG.add(h)}
 const l1=new THREE.PointLight(0xff4a10,2.6,70);l1.position.set(0,9,8);HG.add(l1);const l2=new THREE.PointLight(0xff8a30,1.8,50);l2.position.set(0,3,-14);HG.add(l2)}
function mkGB(){const c=THREE.SkeletonUtils.clone(BL.g.children[0]),g=new THREE.Group();g.add(c);c.traverse(n=>{if(n.isMesh)n.castShadow=true});g.scale.setScalar(3.4);S.add(g);const m=new THREE.AnimationMixer(c),a={};for(const n of['Running','air_squat','360_Power_Spin_Jump','Alert'])a[n]=m.clipAction(BL.a[n].getClip());return{g,m,a,cur:null,x:HX+6,y:70,vy:0,yaw:-Math.PI/2}}
function startCurse(){st='curse';ct=0;if(!hole){hole=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshBasicMaterial({color:new THREE.Color(0xff2a00).multiplyScalar(2.5),transparent:true,opacity:.85,depthWrite:false}));holeB=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshBasicMaterial({color:0x080000,depthWrite:false}));[hole,holeB].forEach((m,k)=>{m.rotation.x=-Math.PI/2;m.renderOrder=2+k;S.add(m)})}
 toast('BCM: I CURSE YOU TO HELL!!');say('TO HELL!!',2,'#c4142b');snd(70,1,'sawtooth',.12,-30);snd(220,.8,'square',.06,-150)}
function curseUpdate(dt){ct+=dt;const k=Math.min(1,ct/1.3);hole.visible=holeB.visible=true;hole.position.set(P.x,.07,.3);holeB.position.set(P.x,.08,.3);hole.scale.setScalar(.2+k*3.2);holeB.scale.setScalar(.1+k*2.4);hole.material.opacity=.65+.25*Math.sin(time*20);
 shake=Math.max(shake,.12+k*.25);if(Math.random()<.5)burst(P.x+(Math.random()-.5)*3,.2,[0xff3a00,0xffb000,0x330000],1,3,-6,.4);
 if(ct>1.3&&!P.dropT){P.dropT=1;P.vy=0;snd(150,.9,'sawtooth',.1,-120)}if(ct>2.5)$('#fade').style.opacity=1;if(ct>3.3)enterHell()}
function enterHell(){st='hell';HL={t:0,ph:0,gas:0,t2:0};LG.visible=false;MG.visible=false;SKY.visible=false;BC.g.visible=BJ.g.visible=false;pile.forEach(m=>m.visible=false);hole.visible=holeB.visible=false;shadow.visible=false;HG.visible=true;HEMI.intensity=.25;sun.intensity=.5;if(BUB){S.remove(BUB.s);BUB=null}
 SKYU.top.value.set(0x300404);SKYU.hor.value.set(0xff4010);SKYU.bot.value.set(0x200000);SKYU.sunI.value=0;regenEnv();MOTES.material.color.set(0xff8030);
 P.x=HX-6;P.y=0;P.vy=0;P.dropT=0;P.on=1;P.face=1;P.yaw=Math.PI/2;P.inv=0;CP.g.visible=true;CP.ms.forEach(m=>m.emissive&&m.emissive.setRGB(0,0,0));GB=mkGB();$('#fade').style.opacity=0;snd(60,1.2,'sawtooth',.1,-20)}
function hellUpdate(dt){const t=HL.t+=dt,g=GB,c=CP,ph=HL.ph;
 HG.children.forEach(o=>{if(o.userData.f)o.scale.y=1+.35*Math.sin(time*6+o.position.x)});
 if(Math.random()<.6)burst(HX+(Math.random()-.5)*40,.2,[0xff5a1f,0xffb347],1,1.5,-3,Math.random()*4-2);
 if(ph===0){if(t>1.2)HL.ph=1}
 else if(ph===1){g.vy-=48*dt;g.y+=g.vy*dt;play(g,'360_Power_Spin_Jump',1.2);if(g.y<=0){g.y=0;g.vy=0;HL.ph=2;HL.t2=0;shake=.8;burst(g.x,.3,[0xaa4a20,0x552211,0xff5a1f],40,10,12,.6);ring(g.x,.3,.5,0xff6020,9,.6);snd(45,.7,'sine',.25,-15);snd(95,.6,'sawtooth',.12,-60)}}
 else if(ph===2){HL.t2+=dt;play(g,'Alert',1);if(HL.t2>.9)HL.ph=3}
 else if(ph===3){play(g,'Running',1.5);g.x-=9*dt;shake=Math.max(shake,.1);if(Math.random()<.08)snd(70,.08,'square',.06,-30);if(g.x<=P.x+4.2){HL.ph=4;HL.t2=0}}
 else if(ph===4){HL.t2+=dt;play(g,'Alert',1);if(HL.t2>.7){HL.ph=5;HL.t2=0;HL.gas=0}}
 else if(ph===5){HL.t2+=dt;play(g,'air_squat',1.2);HL.gas-=dt;
  if(HL.gas<=0){HL.gas=.04;burst(P.x+.3,3.1,[0x9acd32,0x7fbf3f,0xc8e06a],4,3,-3,.6+Math.random()*.6);puff(P.x+.3,3,.6,0x9acd32,.4,2,1,rand(-1,1),.5,.4);snd(40+Math.random()*50,.1,'sawtooth',.1,-20)}
  const e=Math.min(1,HL.t2/2);c.ms.forEach(m=>m.emissive&&m.emissive.setRGB(0,.5*e,0));shake=Math.max(shake,.12);if(HL.t2>2.2){HL.ph=6}}
 else if(ph===6){c.g.visible=false;burst(P.x,1.2,[0xffd23f,0xff8a1f,0xff2b2b,0xffffff,0x4aa84a],90,14,16,.6);burst(P.x,1.5,[0xc4142b,0xff2b4a],40,10,16,.6);ring(P.x,1.4,.6,0xffd060,10,.7);const f=$('#flash');f.style.transition='none';f.style.opacity=1;requestAnimationFrame(()=>requestAnimationFrame(()=>{f.style.transition='opacity 1s';f.style.opacity=0}));shake=1.4;snd(70,.8,'sawtooth',.16,-50);snd(1000,.3,'square',.08,-900);HL.ph=7;HL.t2=0}
 else if(ph===7){HL.t2+=dt;play(g,'Alert',1);if(HL.t2>1.8&&st==='hell')showOver()}
 g.yaw+=((HL.ph>=4?Math.PI/2:-Math.PI/2)-g.yaw)*Math.min(1,dt*8);g.g.position.set(g.x,g.y,0);g.g.rotation.y=g.yaw;
 c.g.position.set(P.x+(HL.ph===5?(Math.random()-.5)*.12:0),0,0);c.g.rotation.y=P.yaw;play(c,'Axe_Breathe_and_Look_Around');c.m.update(dt);g.m.update(dt);
 const hz=Math.max(19,26/(cam.aspect*.7279));cam.position.set(HX-1+(Math.random()-.5)*shake,4.8+(Math.random()-.5)*shake,hz);cam.lookAt(HX-1,3.4,0);shake=Math.max(0,shake-dt*1.2);
 S.fog.color.set(0x2a0606);S.fog.near=18;S.fog.far=80;sunFollow(HX);updParticles(dt);updMotes(dt,true)}
function showOver(){st='over';setUI(false);card('<h2 style="color:#c4142b;font-size:42px">GAME OVER</h2><p>BCM cursed you to hell, and a giant Ballinki farted you into oblivion.</p><p>Collect more mattresses next time!</p><button id="rt" data-def=1>Try again</button> <button id="qx">Exit game</button>');$('#rt').onclick=restartLevel;$('#qx').onclick=quitToTitle}
function resetWorld(){HG.visible=false;MG.visible=true;SKY.visible=true;S.fog.near=40;S.fog.far=380;HEMI.intensity=.32;if(GB){S.remove(GB.g);GB=null}if(hole){hole.visible=false;holeB.visible=false}MOTES.material.color.set(0xfff2c8);
 CP.ms.forEach(m=>m.emissive&&m.emissive.setRGB(0,0,0));CP.g.visible=true;BC.g.visible=BJ.g.visible=true;$('#fade').style.opacity=0;$('#flash').style.opacity=0;
 JARS.forEach(j=>S.remove(j.m));JARS=[];DEB.forEach(d=>S.remove(d.m));DEB.length=0;if(BUB){S.remove(BUB.s);BUB=null}document.querySelectorAll('.splat').forEach(e=>e.remove());BC.g.scale.set(1,1,1);bcmMode('idle');zone='';envT=.05;snapSky=1;SKYU.sunI.value=1}
function restartLevel(){TOT-=lvlAdded;TOTM-=lvlM;lvlAdded=lvlM=0;start(cur)}
function quitToTitle(){resetWorld();EN.forEach(e=>S.remove(e.g));EN=[];BK.forEach(b=>S.remove(b.g));BK=[];TK.forEach(t=>S.remove(t.m));TK=[];pile.forEach(m=>S.remove(m));pile=[];gen(0);P={x:2,y:0,vx:0,vy:0,face:1,on:1,pun:0,stun:0,inv:0,got:0,yaw:0};$('#big').style.display='none';st='title';setUI(false);titleCard()}
function setPause(v){if(['load','title','over'].includes(st))return;paused=v;const p=$('#pause');
 if(v){Object.keys(K).forEach(k=>K[k]=0);const vo=Math.round(BGM.volume*100);p.innerHTML='<div><h2>Paused</h2><p>Music volume <b id="vv">'+vo+'%</b><br><input id="vol" type="range" min="0" max="100" value="'+vo+'"></p><p>View<br><button id="vo" class="vb'+(viewIn?'':' sel')+'">Out</button> <button id="vi" class="vb'+(viewIn?' sel':'')+'">In</button></p>'+
  (HDR_OK?'<p>Graphics<br><button id="gh" class="vb'+(QUAL==='high'?' sel':'')+'">Next-gen</button> <button id="gl" class="vb'+(QUAL==='low'?' sel':'')+'">Fast</button></p>':'')+'<p style="font-size:13px;opacity:.75">A/D move · W/Space jump · J/K/click punch · Esc pause<br>🎮 Stick/D-pad move · Ⓐ jump · Ⓧ/Ⓑ punch · Start pause</p><button id="rsm" data-def=1>Resume</button><br><button id="rs">Restart level</button> <button id="ex">Exit game</button></div>';p.style.display='flex';
  $('#vol').oninput=e=>{BGM.volume=e.target.value/100;$('#vv').textContent=e.target.value+'%'};$('#vo').onclick=()=>setView(0);$('#vi').onclick=()=>setView(1);
  if(HDR_OK){$('#gh').onclick=()=>{setQual('high');$('#gh').classList.add('sel');$('#gl').classList.remove('sel')};$('#gl').onclick=()=>{setQual('low');$('#gl').classList.add('sel');$('#gh').classList.remove('sel')}}
  $('#rsm').onclick=()=>setPause(false);if(padName){const r=$('#rsm');r.classList.add('foc');r.focus({preventScroll:true})}$('#rs').onclick=()=>{setPause(false);restartLevel()};$('#ex').onclick=()=>{setPause(false);quitToTitle()}}
 else p.style.display='none'}
$('#pbtn').onclick=()=>setPause(!paused);
// ---------- UI
const card=h=>{const c=$('#card');c.className='ov';c.style.backgroundImage='';c.innerHTML='<div>'+h+'</div>';c.style.display='flex';if(padName)setTimeout(()=>menuMove(1),0)};
const hide=()=>$('#card').style.display='none';
let tt=0;const toast=s=>{const t=$('#toast');t.textContent=s;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2400)};
function cntPop(){const c=$('#cnt');c.classList.add('pop');setTimeout(()=>c.classList.remove('pop'),120)}
// ---------- game flow
function start(i){bgm();resetWorld();setUI(true);gen(i);P={x:2,y:0,vx:0,vy:0,face:1,on:1,pun:0,stun:0,inv:0,coy:0,buf:0,cp:2,yaw:Math.PI/2,got:0};
 TK.forEach(t=>S.remove(t.m));TK=[];pile.forEach(m=>S.remove(m));pile=[];BJ.t=1.2;BJ.sq=0;BC.g.position.set(arena.bx,0,1.25);BC.g.rotation.y=-Math.PI/2;BCS.yaw=-Math.PI/2;BJ.g.position.set(arena.jx,3.4,-1);BJ.g.rotation.y=-Math.PI/2;
 BC.ms.forEach(m=>m.emissive&&m.emissive.setRGB(0,0,0));EN.forEach(e=>S.remove(e.g));EN=[];BK.forEach(b=>S.remove(b.g));BK=[];bkT=8;GOO=[];PD=[];ambT=4;superT=12;cardShown=0;$('#big').style.display='none';$('#n').textContent=0;zone='';st='play';hide();toast('Level '+(i+1)+': '+L.name);
 cam.position.set(Math.max(P.x+4,9),4.6,dist*ZF())}
function finish(){st='tally';P.vx=0;TOTM+=G.total;lvlM=G.total;arena.k=0;arena.ti=0;TK.forEach(t=>S.remove(t.m));TK=[];$('#big').style.display='block';$('#big').textContent=0;bcmMode('clap')}
function react(){const r=P.got/Math.max(1,G.total);tier=r>=.7?0:r>=.35?1:2;rt=0;TOT+=P.got;lvlAdded=P.got;bcmMode(['happy','meh','mad'][tier]);
 snd(tier===0?660:tier===1?330:110,.5,tier===2?'sawtooth':'triangle',.08,tier===0?400:-60);if(tier===0){confetti(arena.bx+2,10,0,60,4);setTimeout(()=>snd(784,.15,'triangle',.06),120);setTimeout(()=>snd(1046,.3,'triangle',.06),260)}}
const CARD_AT=[6.4,3.9,2.6];
function showCard(){const last=cur===LV.length-1,r=P.got/Math.max(1,G.total),stars=tier===0?(r>=.9?'★★★':'★★☆'):tier===1?'★☆☆':'☆☆☆';
 const msg=['“Now THAT is a mattress haul! Pasta sauce for EVERYBODY!”','“Hmm. Not bad, not great. My trailer has room for more.”','“THAT’S IT?! My trailer is EMPTY! I’m so MAD!!”'][tier];
 card('<h2>'+['BCM is thrilled!','BCM is unimpressed','BCM is having a tantrum'][tier]+'</h2><p>'+msg+'</p><div class="st">'+stars+'</div><p><b>'+P.got+' of '+G.total+'</b> mattresses delivered'+(last?'<br>Grand total: <b>'+TOT+' of '+TOTM+'</b>':'')+'</p><button id="nx" data-def=1>'+(last?'Play again':'Next level')+'</button>');
 $('#nx').onclick=()=>{if(last){TOT=TOTM=0;start(0)}else start(cur+1)}}
function titleCard(ready=true){card('<button id="go"'+(ready?'':' disabled')+'>'+(ready?'Start':'Loading '+Math.round(LOADP/LOADN*100)+'%')+'</button>'+(ready?'':'<div id="bar"><i style="width:'+(LOADP/LOADN*100)+'%"></i></div>')+'<p>'+(TOUCH?'Use the on-screen buttons to run, jump and punch &middot; 🎮 controllers work too':'<kbd>A</kbd> <kbd>D</kbd> move &middot; <kbd>Space</kbd> jump &middot; <kbd>J</kbd>/click punch &middot; <kbd>Esc</kbd> pause &middot; 🎮 controller ready')+'</p>');const c=$('#card');c.classList.add('t');if(TITLE_URL)c.style.backgroundImage='url('+TITLE_URL+')';
 $('#go').onclick=()=>{snd(500,.15,'square',.05,300);TOT=TOTM=0;start(0)}}
// ---------- world-wide per-frame helpers
const shadow=new THREE.Mesh(new THREE.CircleGeometry(.75,24),new THREE.MeshBasicMaterial({map:DOT,color:0,transparent:true,opacity:.35,depthWrite:false}));shadow.rotation.x=-Math.PI/2;S.add(shadow);
function sunFollow(x){sun.position.set(x-12,22,16);sun.target.position.set(x,0,-3);sun.target.updateMatrixWorld()}
const _c=new THREE.Color();
function skyUpdate(dt){const z=ZN[zone||zoneAt(cam.position.x)||'suburb'],k=snapSky?1:Math.min(1,dt*1.5);snapSky=0;
 SKYU.top.value.lerp(_c.set(z.top),k);SKYU.hor.value.lerp(_c.set(z.hor),k);SKYU.bot.value.lerp(_c.set(z.gr),k);SKYU.sunC.value.lerp(_c.set(z.sun),k);SKYU.sunI.value+=(1-SKYU.sunI.value)*k;
 S.fog.color.copy(SKYU.hor.value);HEMI.color.copy(SKYU.hor.value);HEMI.groundColor.lerp(_c.set(z.gr),k);sun.color.lerp(_c.set(z.sun),k);sun.intensity+=(z.si-sun.intensity)*k;
 CLOUDS.forEach(c=>{c.position.x+=c.userData.v*dt;if(c.position.x>400)c.position.x-=680;c.material.color.copy(SKYU.hor.value).lerp(_c.set(0xffffff),.6).multiplyScalar(1.15)});
 if(envT>0){envT-=dt;if(envT<=0)regenEnv()}}
function updMotes(dt,hell){const p=moteP,cx=cam.position.x;for(let i=0;i<MOTE_N;i++){const v=moteV,j=i*3;v[j+2]+=dt;p[j]+=(v[j]+Math.sin(v[j+2]*.7)*.25)*dt;p[j+1]+=(hell?1.6+v[j+1]*3:v[j+1]+Math.sin(v[j+2])*.1)*dt;
 if(p[j]<cx-32)p[j]+=64;else if(p[j]>cx+32)p[j]-=64;if(p[j+1]>16)p[j+1]=0;else if(p[j+1]<0)p[j+1]=16}moteG.attributes.position.needsUpdate=true;MOTES.material.size=hell?.22:.16}
// ---------- update
function sup(x,y){let b=null;for(const g of G.g)if(x>g[0]-.2&&x<g[1]+.2&&y>=-.05)b=0;for(const p of G.p)if(x>p.a-.2&&x<p.b+.2&&y>=p.y-.05)b=Math.max(b===null?-99:b,p.y);return b}
function update(dt){
 time+=dt;GU.time.value=time;WF.forEach(t=>t.offset.y-=dt*.9);if(FINAL)FINAL.uniforms.time.value=time%10;
 if(st==='load'||st==='title'){const c=CP;if(c){play(c,'Axe_Breathe_and_Look_Around');c.g.position.set(5,0,0);c.g.rotation.y=.6;c.m.update(dt)}cam.position.set(7,3.2,15);cam.lookAt(5,1.6,0);sunFollow(5);skyUpdate(dt);updMotes(dt);return}
 if(st==='hell'||st==='over'){hellUpdate(dt);return}
 updParticles(dt);
 const dir=P.stun>0?0:(K.r?1:0)-(K.l?1:0),play_=st==='play';
 if(play_){
  if(dir)P.face=dir;
  const ac=P.on?70:40,tv=dir*(P.pun>0&&P.on?3.5:9);if(P.stun<=0)P.vx+=cl(tv-P.vx,-ac*dt,ac*dt);else{P.stun-=dt;P.vx*=.97}
  P.x=Math.max(P.x+P.vx*dt,-6);P.inv-=dt;
  if(K.j)P.buf=.12;else P.buf-=dt;P.coy=P.on?.1:P.coy-dt;
  if(P.buf>0&&P.coy>0&&P.stun<=0){P.vy=17;P.on=0;P.coy=0;P.buf=0;snd(300,.15,'square',.04,260);puff(P.x,.15,.4,0xd8d0c0,.3,1.1,.45,-P.vx*.1,.3,.45)}
  if(!K.j&&P.vy>0)P.vy-=50*dt;
  const py=P.y,wasOn=P.on;P.vy-=34*dt;P.y+=P.vy*dt;
  if(P.vy<=0){let top=null,onG=false;for(const g of G.g)if(P.x>g[0]-.2&&P.x<g[1]+.2&&py>=-.05&&P.y<=0){top=0;onG=g}
   for(const p of G.p)if(P.x>p.a-.2&&P.x<p.b+.2&&py>=p.y-.05&&P.y<=p.y)top=Math.max(top===null?-99:top,p.y);
   if(top!==null){if(!wasOn&&py-top>.6){for(let k=0;k<4;k++)puff(P.x+rand(-.5,.5),top+.1,.4,0xd8d0c0,.25,.9,.4,rand(-2,2),.4,.4)}P.y=top;P.vy=0;P.on=1;if(onG&&top===0&&P.x>onG[0]+1.5)P.cp=P.x-.8}else P.on=0;
   for(const q of G.pad)if(Math.abs(P.x-q.x)<1.2&&py>=.3&&P.y<=.6){P.vy=27;P.on=0;q.s=.4;snd(200,.3,'sine',.1,500);ring(q.x,1.2,.4,0x7fd6ff,3)}}
  else P.on=0;
  if(P.y<-14){P.x=P.cp;P.y=.2;P.vy=0;P.vx=0;if(P.got>0){P.got--;$('#n').textContent=P.got}toast('Splat! Lost a mattress');snd(150,.4,'sawtooth',.06,-100);P.inv=1.2}
  if(K.pp&&P.pun<=0&&P.stun<=0){P.pun=.45;snd(420,.1,'square',.04,-200)}K.pp=0;
  for(const m of G.m)if(!m.got&&Math.abs(m.x-P.x)<1.1&&Math.abs(m.y-(P.y+1.1))<1.4){m.got=1;m.m.visible=false;m.h.visible=false;P.got++;$('#n').textContent=P.got;cntPop();sparkle(m.x,m.y,.5,0xffe080,10);ring(m.x,m.y,.6,MC[G.m.indexOf(m)%5],3.2,.4);snd(760+Math.min(P.got,20)*18,.12,'triangle',.07,300)}
  const zn=zoneAt(P.x);if(zn!==zone){zone=zn;toast(ZN[zn].n);envT=1.4}
  for(const o of G.ob)if(!o.dead){const dx=o.x-P.x;
   if(o.sm&&P.pun>.08&&P.pun<.4&&dx*P.face>-.3&&dx*P.face<2.2&&P.y<o.h){o.dead=1;o.g.visible=false;burst(o.x,.7,[0xff6a1a,0xffffff,0x2e7d32],14,6,14);snd(380,.1,'square',.05,-200)}
   else if(P.inv<=0&&Math.abs(dx)<.7&&P.y<o.h-.15)hurt(1,-(Math.sign(P.vx)||P.face),'Ouch!')}
  if(P.x>=L.len-.5)finish();
  if(BCS.mode==='idle'&&P.x>L.len-34)bcmMode('wave');else if(BCS.mode==='wave'&&P.x<L.len-40)bcmMode('idle');
 } else if(P.dropT){P.vy-=34*dt;P.y+=P.vy*dt;P.on=0;P.vx=0;P.pun=0}else{if(P.x<L.len+.8){P.x+=3.5*dt;P.face=1}P.vx=0;P.pun=0;P.on=1;P.y=0;P.vy=0}
 P.pun-=dt;
 // CornPop render
 const c=CP;c.g.position.set(P.x,P.y,0);P.yaw+=((P.face>0?Math.PI/2:-Math.PI/2)-P.yaw)*Math.min(1,dt*14);c.g.rotation.y=P.yaw;
 c.g.visible=P.inv<=0||Math.floor(time*14)%2===0||!play_;
 if(play_&&P.pun>0)play(c,P.on?'Right_Jab_from_Guard':'Jumping_Punch',1.5,true);
 else if(!P.on)play(c,'Jump_Run',1,true);
 else if(Math.abs(P.vx)>5.5)play(c,'Running',cl(Math.abs(P.vx)/8,.8,1.3));
 else if(Math.abs(P.vx)>.5||!play_&&P.x<L.len+.8)play(c,'Walking',1.2);
 else play(c,'Axe_Breathe_and_Look_Around');
 c.m.update(dt);
 const sh=sup(P.x,P.y+.1);shadow.visible=sh!==null&&P.y-sh>.05;if(sh!==null){shadow.position.set(P.x,sh+.04,.3);shadow.scale.setScalar(cl(1.2-(P.y-sh)*.1,.4,1.2));shadow.material.opacity=cl(.4-(P.y-sh)*.03,.1,.4)}
 // mattresses & pads
 for(const m of G.m)if(!m.got){m.m.rotation.y=time*1.8+m.x;m.m.position.y=m.by+Math.sin(time*3+m.x)*.15;m.h.position.y=m.m.position.y;m.h.material.opacity=.42+.18*Math.sin(time*4+m.x)}
 for(const q of G.pad){q.s=Math.max(0,(q.s||0)-dt);q.g.scale.y=1-Math.sin(q.s/.4*Math.PI)*.35}
 for(const l of LIGHTS){if(l.bulb){const k=.55+.45*Math.sin(time*3+l.ph*1.3);l.bulb.material.color.set(l.c).multiplyScalar(1+k*3)}else if(l.mist&&Math.random()<dt*2.5)puff(l.x+rand(-1,1),l.y,l.z,0xffffff,.8,3,1.6,rand(-.3,.3),.6,.35)}
 // Boojo + tacos
 const bj=BJ;bj.sq=Math.max(0,bj.sq-dt);bj.g.scale.setScalar(1+bj.sq*.4);
 if(play_&&P.x>L.len-48){bj.t-=dt;if(bj.t<=0){throwTaco();bj.t=.95+Math.random()*.55;if(P.x>L.len-20)bj.t-=.2}}
 play(bj,bj.sq>0||(play_&&P.x>L.len-48)?'Running':'Idle_02',bj.sq>0?1.4:.5);
 for(let i=TK.length-1;i>=0;i--){const t=TK[i];t.vy-=t.g*dt;t.x+=t.vx*dt;t.y+=t.vy*dt;t.m.position.set(t.x,t.y,0);t.m.rotation.z+=dt*9;let die=0;
  if(play_&&P.pun>.08&&P.pun<.4){const dx=(t.x-P.x)*P.face;if(dx>-.3&&dx<2.8&&Math.abs(t.y-(P.y+1.2))<1.8){die=1;burst(t.x,t.y,[0xf2b134,0x52b447,0xe0432f],12,6);ring(t.x,t.y,.5,0xffd060,2.5);snd(520,.12,'square',.05,300)}}
  if(!die&&play_&&P.inv<=0&&Math.hypot(t.x-P.x,t.y-(P.y+1.1))<1.0){die=1;P.inv=1.4;P.stun=.45;P.vy=9;P.vx=-6*P.face;P.on=0;const lost=Math.min(P.got,2);P.got-=lost;$('#n').textContent=P.got;burst(t.x,t.y,[0xf2b134,0x52b447,0xe0432f],14,7);snd(130,.3,'sawtooth',.07,-60);shake=.3;if(lost)toast('Taco hit! −'+lost+' mattresses')}
  if(!die&&t.y<.3){die=1;burst(t.x,.3,[0xf2b134,0x52b447],6,3)}
  if(die){S.remove(t.m);TK.splice(i,1)}}
 // roaming Boojos
 if(play_){ambT-=dt;superT-=dt;const sx=P.x+15+Math.random()*7,ok=EN.length<4&&P.x>12&&sx<L.len-52&&G.g.some(g=>sx>g[0]+1&&sx<g[1]-1);
  if(ok&&superT<=0&&!EN.some(e=>e.s>1)){superT=14+Math.random()*10;spawnBoojo(sx,1);toast('SUPER Boojo!')}
  else if(ok&&ambT<=0){ambT=4.5+Math.random()*6;spawnBoojo(sx,0);toast('Boojo ambush!')}}
 if(play_){bkT-=dt;if(bkT<=0&&BK.length<2&&P.x>14){const sx=P.x+16+Math.random()*6;if(sx<L.len-52&&G.g.some(g=>sx>g[0]+1&&sx<g[1]-1)){bkT=10+Math.random()*8;spawnBallinki(sx);toast('Ballinki incoming!')}}}
 for(let i=EN.length-1;i>=0;i--){const e=EN[i],s=e.s;if(e.dead){S.remove(e.g);EN.splice(i,1);continue}let kill=0;e.inv=Math.max(0,e.inv-dt);e.fl=Math.max(0,e.fl-dt);
  if(e.fall){e.vy-=34*dt;e.y+=e.vy*dt;if(e.y<=0){e.y=0;e.fall=0;burst(e.x,.2,0xcccccc,8,4,6);ring(e.x,.15,.3,0xffffff,2.5*s);shake=.12*s;snd(90,.2,'sine',.1,-30)}}
  else if(e.farted){}
  else if(e.inv>0){const nx=e.x+e.kb*dt;e.kb*=.9;if(G.g.some(g=>nx>g[0]&&nx<g[1]))e.x=nx}
  else{e.hold=Math.max(0,e.hold-dt);if(!e.hold&&Math.abs(P.x-e.x)<16)e.dir=Math.sign(P.x-e.x)||e.dir;const nx=e.x+e.dir*e.sp*dt,ax=nx+e.dir*.8*s;
   if(G.g.some(g=>ax>g[0]&&ax<g[1]))e.x=nx;else{e.dir*=-1;e.hold=1.2}}
  const f=e.fl>0&&Math.floor(time*20)%2?.8:0;e.ms.forEach(m=>m.emissive&&m.emissive.setRGB(f,f,f));
  e.g.position.set(e.x,e.y,0);e.yaw+=((e.dir>0?Math.PI/2:-Math.PI/2)-e.yaw)*Math.min(1,dt*10);e.g.rotation.y=e.yaw;play(e,e.fall||e.inv>0?'Running':'Walking',e.fall?1:e.inv>0?.3:e.farted?.2:e.sp/2.4);e.g.rotation.z=e.farted?Math.sin(time*40)*.12:0;e.m.update(dt);
  if(play_&&!e.fall){const dx=e.x-P.x;let hit=0;
   if(P.vy<0&&Math.abs(dx)<1.2*s&&P.y>e.y+s&&P.y<e.y+2.6*s){hit=1;P.vy=15;P.on=0;P.coy=0}
   else if(P.pun>.08&&P.pun<.4&&dx*P.face>-.4&&dx*P.face<2.7+(s-1)*1.5&&Math.abs(P.y-e.y)<1.8*s)hit=2;
   else if(P.inv<=0&&e.inv<=0&&Math.abs(dx)<.95*s&&P.y<e.y+1.4*s)hurt(s>1?2:1,-(Math.sign(dx)||1),s>1?'Super Boojo smash!':'Boojo bump!');
   if(hit&&e.inv<=0){e.hp--;if(e.hp<=0)kill=1;else{e.inv=.7;e.fl=.7;e.kb=(Math.sign(dx)||1)*7;shake=.2;snd(200,.15,'square',.06,-120);burst(e.x,e.y+1.5*s,[0xff2b4a,0xffffff],10,6,14)}}}
  if(kill){splat(e);if(s>1){P.got+=2;G.total+=2;$('#n').textContent=P.got;cntPop();toast('+2 mattresses!');burst(e.x,e.y+2,[0xffd23f,0xff8fb1,0x7fd6ff],26,8,10);snd(880,.3,'triangle',.08,500)}S.remove(e.g);EN.splice(i,1)}
  else if(e.x<P.x-35||st!=='play'){S.remove(e.g);EN.splice(i,1)}}
 for(let i=BK.length-1;i>=0;i--){const b=BK[i];let kill=0;const alive=t=>t&&!t.dead&&EN.includes(t);
  if(b.fall){b.vy-=34*dt;b.y+=b.vy*dt;play(b,'360_Power_Spin_Jump',1.3);if(b.y<=0){b.y=0;b.vy=0;b.fall=0;b.st='run';b.cd=.5;burst(b.x,.2,0xcccccc,8,4,6);shake=Math.max(shake,.1);snd(90,.2,'sine',.1,-30)}}
  else if(b.st==='run'){let tg=null,bd=26;for(const e of EN)if(e.s===1&&!e.fall&&!e.dead&&!e.farted){const d=Math.abs(e.x-b.x);if(d<bd){bd=d;tg=e}}b.tg=tg;
   b.hold=Math.max(0,b.hold-dt);b.cd=Math.max(0,b.cd-dt);const tx=tg?tg.x:P.x;if(!b.hold){const d=Math.sign(tx-b.x);if(d)b.dir=d}
   const nx=b.x+b.dir*b.sp*dt,ax=nx+b.dir*.8;if(G.g.some(g=>ax>g[0]&&ax<g[1]))b.x=nx;else{b.dir*=-1;b.hold=1}
   play(b,'Running',1.3);
   if(tg&&b.cd<=0){const dd=tg.x-b.x;if(Math.abs(dd)<4.5&&Math.abs(dd)>1.2&&Math.sign(dd)===b.dir){b.vx=cl((tg.x+tg.dir*tg.sp*.69-b.x)/.69,-9,9);b.vy=15;b.st='leap'}}}
  else if(b.st==='leap'){b.vy-=34*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.dir=Math.sign(b.vx)||b.dir;play(b,'360_Power_Spin_Jump',1.3);const t=b.tg;
   if(b.vy<0&&alive(t)&&!t.farted&&Math.abs(b.x-t.x)<1.1&&b.y<=t.y+2.45&&b.y>=t.y+1.2){b.st='fart';b.t=0;b.gas=0;t.farted=1;snd(220,.1,'square',.05,-100)}
   else if(b.y<=0){b.y=0;b.vy=0;b.st='run';b.cd=.9;burst(b.x,.2,0xcccccc,6,3,6)}}
  else if(b.st==='fart'){const t=b.tg;b.t+=dt;
   if(!alive(t)){b.tg=null;b.fall=1;b.vy=8}
   else{b.x=t.x;b.y=t.y+2.3;play(b,'air_squat',1.4);b.gas-=dt;if(b.gas<=0){b.gas=.07;burst(b.x-b.dir*.4,b.y+.1,[0x9acd32,0x7fbf3f,0xc8e06a],2,2.5,-3,.8);puff(b.x-b.dir*.4,b.y,.8,0x9acd32,.3,1.4,.8,-b.dir*.5,-.2,.45);snd(55+Math.random()*40,.12,'sawtooth',.07,-25)}
    if(b.t>.95){t.dead=1;splat(t);burst(b.x,b.y,[0x9acd32,0xc8e06a,0x7fbf3f],26,5,-2,.8);snd(70,.4,'sawtooth',.1,-30);b.tg=null;b.fall=1;b.vy=8}}}
  b.g.position.set(b.x,b.y,.2);b.yaw+=((b.dir>0?Math.PI/2:-Math.PI/2)-b.yaw)*Math.min(1,dt*12);b.g.rotation.y=b.yaw;b.m.update(dt);
  if(play_&&!b.fall){const dx=b.x-P.x;
   if(P.vy<0&&Math.abs(dx)<1.1&&P.y>b.y+.9&&P.y<b.y+2.3){kill=1;P.vy=15;P.on=0;P.coy=0}
   else if(P.pun>.08&&P.pun<.4&&dx*P.face>-.4&&dx*P.face<2.7&&Math.abs(P.y-b.y)<1.8)kill=1;
   else if(P.inv<=0&&b.st!=='fart'&&Math.abs(dx)<.95&&P.y<b.y+1.4)hurt(1,-(Math.sign(dx)||1),'Ballinki attack!')}
  if(kill){if(b.st==='fart'&&b.tg)b.tg.farted=0;burst(b.x,b.y+1,[0x9acd32,0xffe08a,0x7fbf3f],24,7,14);ring(b.x,b.y+1,.5,0xc8e06a,3);snd(500,.15,'square',.06,-300);S.remove(b.g);BK.splice(i,1)}
  else if(b.x<P.x-40||st!=='play'){S.remove(b.g);BK.splice(i,1)}}
 for(const b of G.bb){if(b.dead){if(b.t>0){b.t-=dt;if(b.t<=0)b.g.visible=false}continue}
  b.x+=b.dir*b.sp*dt;if(b.x>b.x1){b.x=b.x1;b.dir=-1}else if(b.x<b.x0){b.x=b.x0;b.dir=1}
  b.g.position.set(b.x,b.y+Math.abs(Math.sin(time*14+b.x))*.05,.1);b.g.rotation.y+=((b.dir>0?0:Math.PI)-b.g.rotation.y)*Math.min(1,dt*12);
  b.legs.forEach((l,k)=>l.rotation.z=Math.sin(time*18+k*1.7)*.5);
  if(play_){const dx=b.x-P.x;
   if(P.vy<0&&Math.abs(dx)<.9&&P.y>b.y+.2&&P.y<b.y+1.2){b.dead=1;b.t=.25;b.g.scale.y=.2;P.vy=13;P.on=0;P.coy=0;burst(b.x,b.y+.3,[0x8a3418,0x3a140a,0xc4142b],14,5,14);snd(700,.1,'square',.05,-500)}
   else if(P.inv<=0&&Math.abs(dx)<.75&&P.y<b.y+.6)hurt(1,-(Math.sign(dx)||1),'Bedbug bite!')}}
 for(let i=GOO.length-1;i>=0;i--){const b=GOO[i],p=b.m.position;b.vy-=30*dt;p.x+=b.vx*dt;p.y+=b.vy*dt;p.z+=b.vz*dt;let done=0;
  if(b.vy<0){let s=sup(p.x,p.y);const T=arena.tx;if(p.x>T-7.5&&p.x<T+7.5&&p.z>-3&&p.z<.6&&p.y>=3.5&&p.y<3.75)s=3.6;if(s!==null&&p.y<=s+.08){puddle(p.x,s,p.z,b.r,b.pm);done=1}}
  if(p.y<-8)done=1;if(done){LG.remove(b.m);GOO.splice(i,1)}}
 for(const q of PD)if(q.k<1){q.k=Math.min(1,q.k+dt*4);q.m.scale.set(q.rx*q.k,q.ry*q.k,1)}
 updJars(dt);updSplats(dt);
 // tally / reaction
 if(st==='tally'){arena.ti+=dt;if(arena.ti>.11&&arena.k<P.got&&P.x>=L.len+.8){arena.ti=0;arena.k++;const m=mattress(arena.k),k=arena.k-1;m.position.set(arena.bx+2.8+(k%6)*1.85,.25+Math.floor(k/6)*.44,1.7);m.rotation.y=(Math.random()-.5)*.3;S.add(m);pile.push(m);$('#big').textContent=arena.k;snd(300+arena.k*16,.07,'triangle',.06);BCS.clap=1;puff(m.position.x,m.position.y,1.8,0xffffff,.2,.9,.35,0,.4,.4)}
  if(arena.k>=P.got&&arena.ti>.8&&P.x>=L.len+.8){$('#big').style.display='none';st='react';react()}
  play(BC,'Idle_02')}
 else if(st==='react'||st==='curse'){rt+=dt;
  if(tier===0){play(BC,'Idle_02',1.6);play(BJ,'Running',1.6);BJ.g.position.y=3.4+Math.abs(Math.sin(rt*8))*.5}
  else if(tier===1){play(BC,'Idle_02',.7)}
  else{play(BC,'Running',2.6);const e=.35+.35*Math.sin(rt*14);BC.ms.forEach(m=>m.emissive&&m.emissive.setRGB(e,0,0));shake=Math.max(shake,.12);play(BJ,'Running',1.2);BJ.g.position.y=3.4+Math.abs(Math.sin(rt*10))*.4}
  if(rt>CARD_AT[tier]&&!cardShown){cardShown=1;tier===2?startCurse():showCard()}}
 else if(st==='play')play(BC,'Idle_02');
 if(st==='curse')curseUpdate(dt);
 rigReset();BC.m.update(dt);bcmUpdate(dt);rigApply(dt);BJ.m.update(dt);updBubble(dt);
 // camera (with a cinematic push-in on BCM's reaction)
 let tx=P.x+4,ty=viewIn?3.4+Math.max(0,P.y-1.5)*.8:4.6,d=dist*ZF(),lk=1.2;
 if(st!=='play'){tx=L.len+4.5;ty=4;d=dist*.95*ZF()}
 if(st==='react'||(st==='curse'&&tier===2)){const k=ease(rt/1.2);if(tier===0){tx=lerp(tx,arena.bx+2.2,k);ty=lerp(ty,3.3,k);d=lerp(d,dist*.58,k);lk=lerp(1.2,.6,k)}else if(tier===1){tx=lerp(tx,arena.bx+1.5,k);ty=lerp(ty,3,k);d=lerp(d,dist*.5,k);lk=lerp(1.2,.6,k)}else{d=lerp(d,dist*.72,k);tx=lerp(tx,arena.bx+1.5,k)}}
 tx=Math.max(tx,9);cam.position.x+=(tx-cam.position.x)*Math.min(1,dt*4);cam.position.y+=(ty-cam.position.y)*Math.min(1,dt*3);cam.position.z+=(d-cam.position.z)*Math.min(1,dt*3);
 shake=Math.max(0,shake-dt*.5);const sx=(Math.random()-.5)*shake,sy=(Math.random()-.5)*shake;
 cam.position.x+=sx;cam.position.y+=sy;cam.lookAt(cam.position.x-sx,cam.position.y-lk-sy,0);
 MG.position.x=cam.position.x*.9;SKY.position.copy(cam.position);sunFollow(cam.position.x);skyUpdate(dt);updMotes(dt);
}
// ---------- main loop with auto performance fallback
let snapSky=0;let T0=performance.now(),fpsAcc=0,fpsN=0,fpsT=0,autoDone=0;
function render(){if(composer&&QUAL==='high')composer.render();else R.render(S,cam)}
function loop(t){const raw=(t-T0)/1000,dt=Math.min(raw,1/30);T0=t;
 try{pollInput();if(!paused&&!window.MANUAL)update(dt)}catch(e){console.error(e)}render();
 if(!autoDone&&!window.MANUAL&&st==='play'&&QUAL==='high'&&!paused){fpsAcc+=raw;fpsN++;fpsT+=raw;if(fpsT>5){const fps=fpsN/fpsAcc;if(fps<32){autoDone=1;setQual('low',0);toast('Switched to fast graphics')}else if(fpsT>12)autoDone=1;fpsAcc=fpsN=0}}
 requestAnimationFrame(loop)}
setupPost();regenEnv();titleCard(false);
(async()=>{try{if(document.fonts)document.fonts.load('40px Chango').catch(()=>{});
 MUSIC_URL=window.EMBED?URL.createObjectURL(new Blob([b64(EMBED['music.mp3'])],{type:'audio/mpeg'})):await blobURL('music.mp3','audio/mpeg').catch(()=>null);CP=await loadM('cornpop',.94);BC=await loadM('bcm',1);BJ=await loadM('boojo',1.2);BJ.sq=0;BJ.t=1;BL=await loadM('ballinki',1.3);BL.g.visible=false;RIG=mkRig(BC);
 BC.g.visible=BJ.g.visible=true;P={x:2,y:0,vx:0,vy:0,face:1,on:1,pun:0,stun:0,inv:0,got:0,yaw:0};gen(0);bump();st='title';titleCard()}catch(e){console.error(e);card('<h2>Could not load</h2><p>'+e.message+'</p>')}})();
requestAnimationFrame(loop);
