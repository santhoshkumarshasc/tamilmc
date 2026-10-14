(function(){
'use strict';
const EMOJIS=['⛏️','🧱','🔥','🗡️','💎','🐉','🌲','⚙️','🎬','🏰'];
const COLORS=['#1f9d5e','#1b8fd6','#e0a81f','#a855f7','#f97316','#ec4899','#3358c4'];
const STYLE_CLASS={raised:'s-glass',flat:'s-solid',outline:'s-neon'};
let session=null,myProfile=null,list=[],myLikes=new Set(),myCerts=[],q='',themeKey='emerald',current=null,authMode='in',editColor='#1f9d5e',editEmoji='⛏️';

/* ---------- showcase ---------- */
function cardHtml(p,opts){
  opts=opts||{};
  const ac=safeColor(p.accent),on=onColor(ac),sc=STYLE_CLASS[p.card_style]||'s-glass';
  const liked=myLikes.has(p.id);
  return `<article class="pcard ${sc}" style="--ac:${ac};--on-ac:${on}" ${opts.preview?'':`data-tilt data-open="${esc(p.handle)}" tabindex="0" role="button" aria-label="${esc(p.channel_name)}"`}>
    <div class="card-top"><div class="avatar" aria-hidden="true">${esc(p.avatar_emoji||'⛏️')}</div>
      <div><h3>${esc(p.channel_name)}</h3><div class="by">${t('p.by')} ${esc(p.display_name)}</div></div></div>
    ${p.cert_count>0?`<div class="tags"><span class="tag">${t('p.cert')}</span></div>`:''}
    <p>${esc(p.bio||'')}</p>
    <div class="card-foot">${opts.preview?`<span class="by">♡ ${p.likes||0}</span>`:`<button class="like" data-like="${esc(p.id)}" aria-pressed="${liked}" aria-label="Like">${liked?'♥':'♡'} ${p.likes}</button>`}</div>
  </article>`;
}
function renderGrid(){
  const rows=list.filter(p=>(p.display_name+' '+p.channel_name+' '+(p.bio||'')).toLowerCase().includes(q));
  $('grid').innerHTML=rows.length?rows.map(p=>cardHtml(p).replace('<article class="pcard','<article class="rv pcard')).join(''):`<div class="empty glass" style="grid-column:1/-1">${t('empty.grid')}</div>`;
  $('grid').querySelectorAll('[data-open]').forEach(el=>{
    const open=()=>openProfile(el.dataset.open);
    el.onclick=e=>{if(e.target.closest('[data-like]'))return;open()};
    el.onkeydown=e=>{if(e.key==='Enter'&&!e.target.closest('[data-like]'))open()};
  });
  $('grid').querySelectorAll('[data-like]').forEach(b=>b.onclick=e=>{e.stopPropagation();like(b.dataset.like)});
  fx.reveal($('grid'));
  fx.countUp($('sCreators'),list.length);
  fx.countUp($('sCerts'),list.reduce((n,p)=>n+(p.cert_count||0),0));
}
$('search').oninput=e=>{q=e.target.value.trim().toLowerCase();renderGrid()};
async function loadPublic(){
  const {data,error}=await sb.from('public_profiles').select('*').order('likes',{ascending:false}).limit(500);
  list=error?[]:data;renderGrid();
}
async function like(id){
  if(!session)return openAuth('in');
  const {data,error}=await sb.rpc('toggle_like',{p_profile:id});
  if(error)return;
  const p=list.find(x=>x.id===id);if(p)p.likes=data.likes;
  data.liked?myLikes.add(id):myLikes.delete(id);renderGrid();
  const b=document.querySelector(`[data-like="${CSS.escape(id)}"]`);if(b)b.classList.add('pop');
}
function openProfile(handle){
  const p=list.find(x=>x.handle===handle);if(!p)return;
  const links=(Array.isArray(p.links)?p.links:[]).filter(l=>safeUrl(l.url)).map(l=>`<a class="btn small" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener noreferrer nofollow">${esc(l.label)}</a>`).join(' ');
  const ch=safeUrl(p.channel_url)?`<a class="btn primary small" href="${esc(safeUrl(p.channel_url))}" target="_blank" rel="noopener noreferrer nofollow">${t('p.visit')}</a>`:'';
  $('profBody').innerHTML=`<div class="dlg-head"><h2>@${esc(p.handle)}</h2><button class="icon-btn" id="profClose" aria-label="Close">✕</button></div>
    ${cardHtml(p,{preview:true})}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">${ch}${links}</div>`;
  $('profClose').onclick=()=>$('profDlg').close();
  $('profDlg').showModal();
}

/* ---------- auth ---------- */
function openAuth(mode){authMode=mode;authUi();clearMsg($('aMsg'));$('authDlg').showModal()}
function authUi(){
  $('tabIn').setAttribute('aria-pressed',authMode==='in');$('tabUp').setAttribute('aria-pressed',authMode==='up');
  $('authTitle').textContent=authMode==='in'?t('auth.in'):t('auth.up');
  $('aGo').textContent=authMode==='in'?t('auth.in'):t('auth.up');
  $('aPass').autocomplete=authMode==='in'?'current-password':'new-password';
}
function authBtns(){
  $('authBtn').textContent=session?t('auth.out'):t('auth.in');
  $('heroJoin').textContent=session?t('hero.cta1b'):t('hero.cta1');
}
$('tabIn').onclick=()=>{authMode='in';authUi()};$('tabUp').onclick=()=>{authMode='up';authUi()};
$('authClose').onclick=()=>$('authDlg').close();
$('authBtn').onclick=async()=>{if(session){await sb.auth.signOut();location.hash='#top'}else openAuth('in')};
$('heroJoin').onclick=()=>{if(session)location.hash='#dashboard';else openAuth('up')};
$('aGo').onclick=async()=>{
  const email=$('aEmail').value.trim(),pass=$('aPass').value;
  if(!/^\S+@\S+\.\S+$/.test(email))return setMsg($('aMsg'),t('m.a_email'),'err');
  if(authMode==='up'&&pass.length<10)return setMsg($('aMsg'),t('m.a_pass'),'err');
  $('aGo').disabled=true;
  if(authMode==='up'){
    const {error}=await sb.auth.signUp({email,password:pass,options:{emailRedirectTo:location.origin}});
    setMsg($('aMsg'),error?t('m.a_up_err'):t('m.a_up_ok'),error?'err':'ok');
  }else{
    const {error}=await sb.auth.signInWithPassword({email,password:pass});
    if(error)setMsg($('aMsg'),t('m.a_in_err'),'err');
    else{$('authDlg').close();$('aPass').value=''}
  }
  $('aGo').disabled=false;
};
$('aForgot').onclick=async()=>{
  const email=$('aEmail').value.trim();
  if(!/^\S+@\S+\.\S+$/.test(email))return setMsg($('aMsg'),t('m.reset_email'),'err');
  await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin});
  setMsg($('aMsg'),t('m.reset_ok'),'ok');
};

/* ---------- dashboard ---------- */
function fillSelects(){
  const s=$('pStyle').value;
  $('pStyle').innerHTML=['raised','flat','outline'].map(x=>`<option value="${x}">${esc(t('style.'+x))}</option>`).join('');
  if(s)$('pStyle').value=s;
}
function swatches(){
  $('pSwatches').innerHTML=COLORS.map(c=>`<button type="button" class="sw" data-c="${c}" style="background:${c}${c===editColor?';outline:3px solid #fff;outline-offset:2px':''}" aria-label="${c}"></button>`).join('');
  $('pSwatches').querySelectorAll('button').forEach(b=>b.onclick=()=>{editColor=b.dataset.c;$('pColor').value=editColor;swatches();preview()});
  $('pEmojis').innerHTML=EMOJIS.map(e=>`<button type="button" class="chip emoji" data-e="${e}" aria-pressed="${e===editEmoji}" aria-label="${e}">${e}</button>`).join('');
  $('pEmojis').querySelectorAll('button').forEach(b=>b.onclick=()=>{editEmoji=b.dataset.e;swatches();preview()});
}
$('pColor').oninput=e=>{editColor=e.target.value;swatches();preview()};
function linkRows(links){
  $('pLinks').innerHTML=[0,1,2,3].map(i=>{const l=(links||[])[i]||{};return `<div class="link-row"><input data-ll="${i}" data-i18n-ph="f.label" placeholder="${esc(t('f.label'))}" maxlength="24" value="${esc(l.label||'')}"><input data-lu="${i}" placeholder="https://..." maxlength="200" value="${esc(l.url||'')}"></div>`}).join('');
  $('pLinks').querySelectorAll('input').forEach(i=>i.oninput=preview);
}
function collectLinks(){
  const out=[];
  for(let i=0;i<4;i++){
    const label=document.querySelector(`[data-ll="${i}"]`).value.trim(),url=document.querySelector(`[data-lu="${i}"]`).value.trim();
    if(!label&&!url)continue;
    if(!label||!safeUrl(url))return null;
    out.push({label,url});
  }
  return out;
}
function formData(){
  return {display_name:$('pName').value.trim(),channel_name:$('pChannel').value.trim(),channel_url:$('pUrl').value.trim()||null,
    bio:$('pBio').value.trim()||null,accent:safeColor(editColor),card_style:$('pStyle').value||'raised',
    avatar_emoji:editEmoji,is_public:$('pPublic').checked};
}
function preview(){
  const d=formData();
  $('pPreview').innerHTML=cardHtml({...d,id:'x',handle:'preview',display_name:d.display_name||t('cert.sample.n'),channel_name:d.channel_name||t('cert.sample.c'),bio:d.bio||'…',likes:myProfile?myProfile.likes:0,cert_count:0},{preview:true});
}
['pName','pChannel','pBio','pStyle','pPublic','pUrl'].forEach(id=>$(id).addEventListener('input',preview));
function fillForm(p){
  fillSelects();
  $('pHandle').value=p?p.handle:'';$('pHandle').disabled=!!p;
  $('pName').value=p?p.display_name:'';$('pChannel').value=p?p.channel_name:'';$('pUrl').value=p&&p.channel_url||'';
  $('pBio').value=p&&p.bio||'';$('pStyle').value=p?p.card_style:'raised';
  editColor=p?safeColor(p.accent):'#1f9d5e';editEmoji=p?p.avatar_emoji:'⛏️';$('pColor').value=editColor;$('pPublic').checked=p?p.is_public:true;
  linkRows(p?p.links:[]);swatches();preview();
}
$('pSave').onclick=async()=>{
  const d=formData(),handle=$('pHandle').value.trim().toLowerCase();
  if(d.display_name.length<2||d.channel_name.length<2)return setMsg($('pMsg'),t('m.name2'),'err');
  if(d.channel_url&&!safeUrl(d.channel_url))return setMsg($('pMsg'),t('m.url'),'err');
  const links=collectLinks();if(links===null)return setMsg($('pMsg'),t('m.link'),'err');
  d.links=links;
  $('pSave').disabled=true;
  let error;
  if(myProfile){({error}=await sb.from('profiles').update(d).eq('id',session.user.id))}
  else{
    if(!/^[a-z0-9_]{3,24}$/.test(handle)){$('pSave').disabled=false;return setMsg($('pMsg'),t('m.handle'),'err')}
    ({error}=await sb.from('profiles').insert({...d,id:session.user.id,handle}));
  }
  $('pSave').disabled=false;
  if(error)return setMsg($('pMsg'),error.code==='23505'?t('m.taken'):t('m.save_err'),'err');
  setMsg($('pMsg'),t('m.saved'),'ok');fx.confetti();
  await loadMine();await loadPublic();
};
$('pDelete').onclick=async()=>{
  if(!confirm(t('m.del_confirm')))return;
  const {error}=await sb.rpc('delete_my_account');
  if(error)return setMsg($('pMsg'),t('m.del_err'),'err');
  await sb.auth.signOut();location.hash='#top';await loadPublic();
};

/* ---------- certificates ---------- */
function themeButtons(){
  $('themes').innerHTML=Object.keys(THEMES).map(k=>`<button class="chip" data-t="${k}" aria-pressed="${k===themeKey}">${esc(t('theme.'+k))}</button>`).join('');
  $('themes').querySelectorAll('button').forEach(b=>b.onclick=()=>{themeKey=b.dataset.t;themeButtons();if(current)drawCert($('cert'),current,themeKey)});
}
function showCert(c){current=c;themeKey=c.theme;themeButtons();drawCert($('cert'),c,themeKey);$('dlBtn').disabled=false}
function renderMyCerts(){
  $('myCerts').innerHTML=myCerts.length?myCerts.map((c,i)=>`<div class="list-item"><div><b>${esc(certField(c,'award'))}</b><div class="by" style="color:var(--muted);font-size:14px">${esc(certField(c,'heading'))} · ${esc(c.cert_code)}</div></div><button class="btn small" data-c="${i}">${t('certs.prev')}</button></div>`).join(''):`<div class="empty">${t('certs.none')}</div>`;
  $('myCerts').querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>showCert(myCerts[+b.dataset.c]));
}
$('rBtn').onclick=async()=>{
  const tk=$('rToken').value.trim();if(!tk)return setMsg($('rMsg'),t('m.token'),'err');
  $('rBtn').disabled=true;
  const {data,error}=await sb.rpc('redeem_certificate',{p_token:tk});
  $('rBtn').disabled=false;
  if(error||!data)return setMsg($('rMsg'),t('m.wrong'),'err');
  if(!data.ok){
    const m={invalid_token:t('m.tok_bad'),locked:t('m.locked'),sign_in_required:t('m.signin')};
    return setMsg($('rMsg'),m[data.error]||t('m.wrong'),'err');
  }
  $('rToken').value='';setMsg($('rMsg'),t('m.redeemed'),'ok');fx.confetti();
  await loadCerts();if(myCerts.length)showCert(myCerts[0]);await loadPublic();
};
$('dlBtn').onclick=()=>{if(current)downloadCanvas($('cert'),'certificate-'+current.cert_code+'.png')};
async function loadCerts(){const {data}=await sb.rpc('my_certificates');myCerts=data||[];renderMyCerts()}

$('vBtn').onclick=async()=>{
  const code=$('vCode').value.trim();if(!code)return setMsg($('vMsg'),t('m.v_enter'),'err');
  const {data,error}=await sb.rpc('verify_certificate',{p_code:code});
  if(error)return setMsg($('vMsg'),t('m.v_err'),'err');
  if(!data||!data.length)return setMsg($('vMsg'),t('m.v_none'),'err');
  const c=data[0];
  if(c.status==='revoked')return setMsg($('vMsg'),t('m.v_revoked'),'err');
  verified=c;
  setMsg($('vMsg'),t('m.v_ok',{n:c.recipient_name,a:certField(c,'award')}),'ok');
  drawCert($('vCert'),c,c.theme);
};
let verified=null;

/* ---------- session ---------- */
async function loadMine(){
  const {data}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
  myProfile=data||null;fillForm(myProfile);
}
async function onSession(s){
  session=s;
  $('dashboard').classList.toggle('hide',!s);
  $('navDash').classList.toggle('hide',!s);
  authBtns();
  if(s){
    await loadMine();await loadCerts();
    const {data}=await sb.rpc('my_likes');myLikes=new Set(data||[]);
    fx.reveal($('dashboard'));
  }else{myProfile=null;myCerts=[];myLikes=new Set();current=null}
  renderGrid();
}
function samples(){
  drawCert($('cert'),current||{recipient_name:t('cert.sample.n'),channel_name:t('cert.sample.c'),award:'Best Builder',message:t('cert.sample.m'),cert_code:'CERT-XXXXXXXX',issued_at:new Date()},current?themeKey:'emerald');
  drawCert($('vCert'),verified||{recipient_name:t('cert.sample.n'),channel_name:t('cert.sample.c'),award:'Best Builder',cert_code:'CERT-XXXXXXXX',issued_at:new Date()},verified?verified.theme:'emerald');
}
function rerender(){
  themeButtons();fillSelects();authUi();authBtns();renderGrid();renderMyCerts();
  if(session){linkRows((collectLinks()||[]));preview()}
  samples();
}
document.addEventListener('langchange',rerender);
themeButtons();fillSelects();swatches();linkRows([]);authUi();authBtns();
sb.auth.onAuthStateChange((ev,s)=>{setTimeout(()=>onSession(s),0)});
(async()=>{await loadPublic();const {data}=await sb.auth.getSession();await onSession(data.session);samples()})();
})();
