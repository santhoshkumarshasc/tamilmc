(function(){
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fx={};
/* ---- floating pixel background ---- */
function bg(){
  const c=document.createElement('canvas');c.id='fxBg';c.setAttribute('aria-hidden','true');document.body.prepend(c);
  const a=document.createElement('div');a.className='aurora';a.setAttribute('aria-hidden','true');a.innerHTML='<i></i><i></i><i></i>';document.body.prepend(a);
  const ctx=c.getContext('2d');let W,H,P=[];
  const cols=['#3dffa0','#38d6ff','#ffd166','#8a7dff'];
  function size(){W=c.width=innerWidth;H=c.height=innerHeight;P=Array.from({length:Math.min(46,Math.floor(W/24))},()=>mk(true))}
  function mk(r){const s=4+Math.floor(Math.random()*3)*4;return{x:Math.random()*W,y:r?Math.random()*H:H+20,s,v:.15+Math.random()*.5,d:(Math.random()-.5)*.3,c:cols[Math.floor(Math.random()*cols.length)],a:.12+Math.random()*.3}}
  function draw(){
    ctx.clearRect(0,0,W,H);
    for(const p of P){ctx.globalAlpha=p.a;ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x),Math.round(p.y),p.s,p.s);
      if(!reduce){p.y-=p.v;p.x+=p.d;if(p.y<-20){Object.assign(p,mk(false))}}}
    ctx.globalAlpha=1;if(!reduce)requestAnimationFrame(draw);
  }
  size();addEventListener('resize',size);draw();
}
/* ---- scroll reveal ---- */
let io=null;
fx.reveal=function(root){
  root=root||document;const els=[...root.querySelectorAll('.rv:not(.in)')];
  if(reduce||!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return}
  if(!io)io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}}),{threshold:.12});
  els.forEach((e,i)=>{e.style.transitionDelay=(i%8)*70+'ms';io.observe(e)});
};
/* ---- count up ---- */
fx.countUp=function(el,to){
  const from=parseInt(el.textContent)||0;if(reduce||from===to){el.textContent=to;return}
  const t0=performance.now(),d=900;
  (function f(t){const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=Math.round(from+(to-from)*e);if(k<1)requestAnimationFrame(f)})(t0);
};
/* ---- 3D tilt (event delegation, fine pointers only) ---- */
if(!reduce&&matchMedia('(pointer:fine)').matches){
  document.addEventListener('pointermove',e=>{
    const el=e.target.closest&&e.target.closest('.pcard[data-tilt]');if(!el)return;
    const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    el.style.setProperty('--ry',((x-.5)*12).toFixed(2)+'deg');el.style.setProperty('--rx',((.5-y)*12).toFixed(2)+'deg');
    el.style.setProperty('--mx',(x*100)+'%');el.style.setProperty('--my',(y*100)+'%');
  });
  document.addEventListener('pointerout',e=>{const el=e.target.closest&&e.target.closest('.pcard[data-tilt]');if(el&&!el.contains(e.relatedTarget)){el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg')}});
}
/* ---- button ripple ---- */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('.btn');if(!b||reduce)return;
  const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),sp=document.createElement('span');
  sp.className='ripple';sp.style.cssText='width:'+s+'px;height:'+s+'px;left:'+(e.clientX-r.left-s/2)+'px;top:'+(e.clientY-r.top-s/2)+'px';
  b.appendChild(sp);setTimeout(()=>sp.remove(),650);
});
/* ---- pixel confetti ---- */
fx.confetti=function(){
  if(reduce)return;
  const c=document.createElement('canvas');c.id='fxConfetti';c.width=innerWidth;c.height=innerHeight;document.body.appendChild(c);
  const ctx=c.getContext('2d'),cols=['#3dffa0','#38d6ff','#ffd166','#ff7aa8','#8a7dff'];
  const P=Array.from({length:140},()=>({x:innerWidth/2,y:innerHeight*.35,vx:(Math.random()-.5)*16,vy:-Math.random()*14-4,s:6+Math.floor(Math.random()*3)*4,c:cols[Math.floor(Math.random()*cols.length)],r:Math.random()*6}));
  let t0=performance.now();
  (function f(t){
    ctx.clearRect(0,0,c.width,c.height);
    for(const p of P){p.vy+=.45;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.s,p.s)}
    if(t-t0<2600)requestAnimationFrame(f);else c.remove();
  })(t0);
};
window.fx=fx;
document.addEventListener('DOMContentLoaded',()=>{bg();fx.reveal()});
})();
