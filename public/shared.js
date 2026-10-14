(function(){
'use strict';
const cfg=window.TMC_CONFIG;
window.sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,
  {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.$=id=>document.getElementById(id);
window.esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.safeUrl=u=>/^https:\/\/[^\s"'<>]{3,200}$/i.test(u||'')?u:'';
window.safeColor=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:'#1f7a45';
window.onColor=c=>{const n=parseInt(safeColor(c).slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;return (0.299*r+0.587*g+0.114*b)>150?'#10170f':'#ffffff'};
window.setMsg=(el,text,cls)=>{el.className='msg '+cls;el.textContent=text};
window.clearMsg=el=>{el.className='msg hide';el.textContent=''};
window.CATS=['Builds','Survival','Redstone','PvP','Roleplay','Shorts'];
window.AWARDS=['Best Builder','Redstone Genius','Rising Star','Best Storyteller','Community Hero','Top Shorts Creator','Survival Legend','Best Tutorial','Participation'];
window.THEMES={
  emerald:{label:'Emerald',bg:'#eaf5ee',frame:'#1f7a45',accent:'#34b56b',ink:'#13301f',sub:'#3b5c47'},
  gold:{label:'Gold',bg:'#fbf3dc',frame:'#a87608',accent:'#e0a81f',ink:'#3b2b05',sub:'#6b5320'},
  diamond:{label:'Diamond',bg:'#e8f6f8',frame:'#177385',accent:'#3cc7d9',ink:'#0e2f36',sub:'#33636d'},
  netherite:{label:'Netherite',bg:'#2a2528',frame:'#6b5a5f',accent:'#c9a97a',ink:'#f1e8e4',sub:'#c7b9b3'}
};
window.fmtDate=d=>d?new Date(d).toISOString().slice(0,10):'';
function wrap(ctx,text,x,y,maxW,lh){let line='';for(const w of text.split(' ')){const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){ctx.fillText(line,x,y);line=w;y+=lh}else line=t}ctx.fillText(line,x,y)}
const SPRITES={
  star:['....#....','....#....','...###...','#########','.#######.','..#####..','..##.##..','.##...##.','.#.....#.'],
  trophy:['#########','#.#####.#','#.#####.#','.#######.','..#####..','...###...','....#....','...###...','..#####..'],
  shield:['#########','#########','#########','#########','.#######.','.#######.','..#####..','...###...','....#....'],
  heart:['.##...##.','####.####','#########','#########','#########','.#######.','..#####..','...###...','....#....'],
  gem:['..#####..','.#######.','#########','#########','.#######.','..#####..','...###...','....#....','.........']
};
window.ICONS=Object.keys(SPRITES);
window.certField=(c,k)=>{
  const ta=lang()==='ta';
  if(k==='award')return (ta&&c.award_ta)||(I18N[lang()]['award.'+c.award])||c.award;
  const main=ta?(c.heading_ta||c.heading||t('cert.title')):(c.heading||t('cert.title'));
  let sub=ta?(c.heading||''):(c.heading_ta||t('cert.ta'));
  if(sub===main)sub='';
  return k==='heading'?main:sub;
};
window.drawCert=async function(canvas,c,themeKey){
  const th=THEMES[themeKey]||THEMES.emerald,ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  try{await Promise.all([document.fonts.load('800 60px Outfit'),document.fonts.load('700 40px "Noto Sans Tamil"'),document.fonts.load('400 30px Outfit')])}catch(e){}
  ctx.fillStyle=th.bg;ctx.fillRect(0,0,W,H);
  const s=28;
  for(let x=0;x<W;x+=s)for(let k=0;k<2;k++){ctx.fillStyle=(x/s)%2?th.frame:th.accent;ctx.fillRect(x,k?H-s:0,s,s)}
  for(let y=s;y<H-s;y+=s)for(let k=0;k<2;k++){ctx.fillStyle=(y/s)%2?th.frame:th.accent;ctx.fillRect(k?W-s:0,y,s,s)}
  ctx.strokeStyle=th.frame;ctx.lineWidth=4;ctx.strokeRect(s+22,s+22,W-2*(s+22),H-2*(s+22));
  ctx.textAlign='center';
  ctx.fillStyle=th.frame;ctx.font='700 30px Outfit, Noto Sans Tamil, sans-serif';ctx.fillText(t('cert.org'),W/2,165);
  const sub=certField(c,'sub'),main=certField(c,'heading');
  if(sub){ctx.fillStyle=th.ink;ctx.font='700 46px Noto Sans Tamil, Outfit, sans-serif';ctx.fillText(sub,W/2,245)}
  let hs=76;ctx.fillStyle=th.ink;
  do{ctx.font='800 '+hs+'px Outfit, Noto Sans Tamil, sans-serif';hs-=3}while(ctx.measureText(main).width>W-300&&hs>34);
  ctx.fillText(main,W/2,350);
  ctx.fillStyle=th.sub;ctx.font='500 30px Outfit, Noto Sans Tamil, sans-serif';ctx.fillText(t('cert.presented'),W/2,430);
  let size=110;ctx.fillStyle=th.frame;
  do{ctx.font='800 '+size+'px Outfit, Noto Sans Tamil, sans-serif';size-=4}while(ctx.measureText(c.recipient_name).width>W-340&&size>40);
  ctx.fillText(c.recipient_name,W/2,550);
  ctx.fillStyle=th.accent;ctx.fillRect(W/2-260,585,520,6);
  ctx.fillStyle=th.sub;ctx.font='500 30px Outfit, Noto Sans Tamil, sans-serif';ctx.fillText(t('cert.for')+' '+c.channel_name,W/2,650);
  const aw=certField(c,'award');let as=62;ctx.fillStyle=th.ink;
  do{ctx.font='800 '+as+'px Outfit, Noto Sans Tamil, sans-serif';as-=3}while(ctx.measureText(aw).width>W-300&&as>30);
  ctx.fillText(aw,W/2,745);
  let y=800;
  ctx.fillStyle=th.sub;ctx.font='500 28px Outfit, Noto Sans Tamil, sans-serif';
  if(c.content_title){wrap(ctx,t('cert.content')+' '+c.content_title,W/2,y,W-460,40);y+=44}
  if(c.message){wrap(ctx,c.message,W/2,y,W-460,40)}
  // pixel icon for this certificate type
  const sp=SPRITES[c.icon]||SPRITES.star,px=7,ox=W/2-(9*px)/2,oy=895;
  for(const [dx,col] of [[3,th.frame],[0,th.accent]])
    sp.forEach((row,r)=>[...row].forEach((ch,k)=>{if(ch==='#'){ctx.fillStyle=col;ctx.fillRect(ox+k*px+dx,oy+r*px+dx,px,px)}}));
  for(let i=0;i<3;i++){ctx.fillStyle=i%2?th.accent:th.frame;ctx.fillRect(ox-70-i*34,oy+30,20,20);ctx.fillRect(ox+9*px+50+i*34,oy+30,20,20)}
  ctx.textAlign='left';ctx.fillStyle=th.sub;ctx.font='500 24px Outfit, Noto Sans Tamil, sans-serif';
  ctx.fillText(t('cert.issued')+' '+fmtDate(c.issued_at),150,1020);
  ctx.fillText(t('cert.id')+' '+c.cert_code,150,1056);
  ctx.textAlign='center';ctx.strokeStyle=th.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W-480,1020);ctx.lineTo(W-150,1020);ctx.stroke();
  ctx.fillText(t('cert.signed'),W-315,1056);
};
window.downloadCanvas=(canvas,name)=>canvas.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)},'image/png');
})();
