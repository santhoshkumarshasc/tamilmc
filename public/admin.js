(function(){
'use strict';
let factorId=null,profiles=[],certs=[],types=[],users=[],admins=[],editingType=null,editing=null,current=null;
let adminTimer=null,adminExpiresAt=null;
const ADMIN_TIMEOUT_MS=5*60*1000; // 5 minutes strict session timeout

function selects(){
  const th=$('cTheme').value,tt=$('tTheme').value,ti=$('tIcon').value,ct=$('cType').value;
  const themeOpts=Object.keys(THEMES).map(k=>`<option value="${k}">${esc(t('theme.'+k))}</option>`).join('');
  $('cTheme').innerHTML=themeOpts;$('tTheme').innerHTML=themeOpts;
  $('tIcon').innerHTML=ICONS.map(k=>`<option value="${k}">${esc(t('icon.'+k))}</option>`).join('');
  if(th)$('cTheme').value=th;if(tt)$('tTheme').value=tt;if(ti)$('tIcon').value=ti;
  typeOptions(ct);
}
function typeName(x){return (lang()==='ta'&&x.name_ta)||x.name}
function typeOptions(keep){
  $('cType').innerHTML=`<option value="">${esc(t('ad.type.custom'))}</option>`+types.filter(x=>x.is_active).map(x=>`<option value="${esc(x.id)}">${esc(typeName(x))}</option>`).join('');
  if(keep!==undefined&&[...$('cType').options].some(o=>o.value===keep))$('cType').value=keep;
}
selects();

function view(step){
  ['stepLogin','stepMfa','app'].forEach(s=>$(s).classList.toggle('hide',s!==step));
  $('outBtn').classList.toggle('hide',step==='stepLogin');
  $('admSessionTimer').classList.toggle('hide',step!=='app');
}

/* 5-minute Session Timeout */
function startAdminTimer(){
  clearInterval(adminTimer);
  adminExpiresAt=Date.now()+ADMIN_TIMEOUT_MS;
  updateAdminCountdown();
  adminTimer=setInterval(updateAdminCountdown,1000);
}
function updateAdminCountdown(){
  const remaining=Math.max(0,adminExpiresAt-Date.now());
  const mins=Math.floor(remaining/60000);
  const secs=Math.floor((remaining%60000)/1000);
  const el=$('admTimeLeft');
  if(el) el.textContent=`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  if(remaining<=0){
    clearInterval(adminTimer);
    signOut();
    alert('Admin session ended after 5 minutes.');
  }
}

async function signOut(){
  clearInterval(adminTimer);
  await sb.auth.signOut();
  view('stepLogin');
  ['lPass','mCode','lToken'].forEach(i=>{if($(i))$(i).value=''});
}
$('outBtn').onclick=signOut;

/* ---------- login + MFA ---------- */
if($('lTokenGo')){
  const submitToken = async()=>{
    clearMsg($('lMsg'));
    const tk = ($('lToken').value || '').trim();
    const em = ($('lEmail').value || '').trim();
    if(!tk && !em) return setMsg($('lMsg'), 'Please enter administrator token or credentials.', 'err');
    $('lTokenGo').disabled = true;
    const {data, error} = await sb.rpc('admin_login_token', {token: tk, email: em});
    $('lTokenGo').disabled = false;
    if(error || !data || !data.ok){
      return setMsg($('lMsg'), (data && data.error) || t('ad.fail'), 'err');
    }
    await enter();
  };
  $('lTokenGo').onclick = submitToken;
  if($('lToken')) $('lToken').onkeydown = e => { if(e.key === 'Enter') submitToken(); };
  if($('lEmail')) $('lEmail').onkeydown = e => { if(e.key === 'Enter') submitToken(); };
}

$('lGo').onclick=async()=>{
  clearMsg($('lMsg'));
  $('lGo').disabled=true;
  const {error}=await sb.auth.signInWithPassword({email:$('lEmail').value.trim(),password:$('lPass').value});
  $('lGo').disabled=false;
  if(error)return setMsg($('lMsg'),t('ad.fail'),'err');
  await afterLogin();
};
async function afterLogin(){
  const {data:gate}=await sb.rpc('admin_gate');
  if(!gate){await sb.auth.signOut();return setMsg($('lMsg'),t('ad.fail'),'err')}
  const {data:aal}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if(aal&&aal.currentLevel==='aal2')return enter();
  const {data:f}=await sb.auth.mfa.listFactors();
  const verified=f&&f.totp&&f.totp[0];
  $('mfaEnroll').classList.toggle('hide',!!verified);
  if(verified){factorId=verified.id}
  else{
    const {data,error}=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'Admin '+Date.now()});
    if(error)return setMsg($('lMsg'),t('ad.mfa.start'),'err');
    factorId=data.id;$('mfaQr').src=data.totp.qr_code;$('mfaSecret').textContent=data.totp.secret;
  }
  clearMsg($('mMsg'));view('stepMfa');
}
$('mGo').onclick=async()=>{
  const code=$('mCode').value.trim();if(!/^\d{6}$/.test(code))return setMsg($('mMsg'),t('ad.mfa.fmt'),'err');
  $('mGo').disabled=true;
  const ch=await sb.auth.mfa.challenge({factorId});
  const v=ch.error?ch:await sb.auth.mfa.verify({factorId,challengeId:ch.data.id,code});
  $('mGo').disabled=false;
  if(v.error)return setMsg($('mMsg'),t('ad.mfa.bad'),'err');
  $('mCode').value='';await enter();
};
async function enter(){
  const {data}=await sb.rpc('is_admin');
  if(!data){await sb.auth.signOut();view('stepLogin');return setMsg($('lMsg'),t('ad.fail'),'err')}
  view('app');
  startAdminTimer();
  await refresh();
  sample();fillType(null);
}

/* ---------- mobile drawer & tab switching ---------- */
function switchAdminTab(t){
  if($('app').classList.contains('hide')){
    closeAdminDrawer();
    setMsg($('lMsg'), 'Please sign in with your admin credentials to access this section.', 'note');
    $('lToken')?.focus();
    return;
  }
  document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-pressed', String(x.dataset.tab===t)));
  document.querySelectorAll('[data-admin-tab]').forEach(x=>x.classList.toggle('active', x.dataset.adminTab===t));
  $('tab-certs').classList.toggle('hide', t!=='certs');
  $('tab-creators').classList.toggle('hide', t!=='creators');
  $('tab-users').classList.toggle('hide', t!=='users');
  $('tab-types').classList.toggle('hide', t!=='types');
  if($('tab-announcements')) $('tab-announcements').classList.toggle('hide', t!=='announcements');
  if($('tab-admins')) $('tab-admins').classList.toggle('hide', t!=='admins');
  $('tab-settings').classList.toggle('hide', t!=='settings');
  closeAdminDrawer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openAdminDrawer(){
  const d = $('adminMobileNav');
  if(d){
    d.classList.remove('hide');
    $('adminNavToggle')?.classList.add('active');
    $('adminNavToggle')?.setAttribute('aria-expanded', 'true');
  }
}

function closeAdminDrawer(){
  const d = $('adminMobileNav');
  if(d){
    d.classList.add('hide');
    $('adminNavToggle')?.classList.remove('active');
    $('adminNavToggle')?.setAttribute('aria-expanded', 'false');
  }
}

// Desktop tab clicks
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>switchAdminTab(b.dataset.tab));

// Mobile drawer tab clicks
document.querySelectorAll('[data-admin-tab]').forEach(b=>b.onclick=()=>switchAdminTab(b.dataset.adminTab));

// Mobile drawer open/close
if($('adminNavToggle')) $('adminNavToggle').onclick = () => {
  const isClosed = $('adminMobileNav')?.classList.contains('hide');
  isClosed ? openAdminDrawer() : closeAdminDrawer();
};
if($('adminMobileNavClose')) $('adminMobileNavClose').onclick = closeAdminDrawer;
if($('adminMobileNavBackdrop')) $('adminMobileNavBackdrop').onclick = closeAdminDrawer;

// Mobile Drawer Theme & Lang toggles
if($('mAdminThemeBtn')) $('mAdminThemeBtn').onclick = () => {
  const curr=document.documentElement.getAttribute('data-theme')||'light';
  const next=curr==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme', next);
  try{localStorage.setItem('tmc_theme', next)}catch(e){}
};
if($('mAdminLangBtn')) $('mAdminLangBtn').onclick = () => {
  if($('langBtn')) $('langBtn').click();
  const nextLang = lang()==='ta'?'தமிழ்':'English';
  if($('mAdminLangVal')) $('mAdminLangVal').textContent = nextLang;
};
if($('mAdminOutBtn')) $('mAdminOutBtn').onclick = async () => {
  closeAdminDrawer();
  if($('outBtn')) $('outBtn').click();
};

/* ---------- Announcements Logic ---------- */
let announcements = [];
let editingAnnouncement = null;

function renderAnnouncements(){
  const box = $('annListContainer');
  if(!box) return;
  if(!announcements.length){
    box.innerHTML = '<div class="empty">No announcements published yet.</div>';
    return;
  }
  box.innerHTML = announcements.map(a => `
    <div class="list-item" style="padding:14px;border-radius:12px;margin-bottom:10px;background:var(--surface-inset);border:1px solid var(--line-subtle);">
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
          <span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:9999px;background:var(--em-soft);color:var(--em);">${esc(a.badge || 'NOTICE')}</span>
          <span style="font-size:11px;font-weight:700;color:${a.is_active ? 'var(--em)' : 'var(--muted)'};">${a.is_active ? '● Active on Site' : '○ Inactive'}</span>
          <span style="font-size:11px;color:var(--muted);">${new Date(a.created_at).toLocaleDateString()}</span>
        </div>
        <b style="font-size:14px;display:block;margin-bottom:2px;color:var(--text);">${esc(a.title)}</b>
        <p style="font-size:12px;color:var(--muted);margin:0;line-height:1.4;">${esc(a.message)}</p>
        ${a.link_url ? `<span style="font-size:11px;color:var(--em);display:inline-block;margin-top:4px;">🔗 ${esc(a.link_text || a.link_url)}</span>` : ''}
      </div>
      <div style="display:flex;gap:6px;flex-none;align-items:center;">
        <button type="button" class="btn small" data-ann-toggle="${esc(a.id)}" title="Toggle Active/Inactive">
          ${a.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button type="button" class="btn small" data-ann-edit="${esc(a.id)}">Edit</button>
        <button type="button" class="btn small danger" data-ann-del="${esc(a.id)}">Delete</button>
      </div>
    </div>
  `).join('');

  box.querySelectorAll('[data-ann-toggle]').forEach(btn => {
    btn.onclick = async () => {
      const target = announcements.find(x => x.id === btn.dataset.annToggle);
      if(!target) return;
      target.is_active = !target.is_active;
      await sb.rpc('admin_save_announcement', target);
      await refresh();
    };
  });

  box.querySelectorAll('[data-ann-edit]').forEach(btn => {
    btn.onclick = () => {
      const target = announcements.find(x => x.id === btn.dataset.annEdit);
      if(!target) return;
      editingAnnouncement = target;
      fillAnnouncementForm(target);
      switchAdminTab('announcements');
      $('annTitle')?.focus();
    };
  });

  box.querySelectorAll('[data-ann-del]').forEach(btn => {
    btn.onclick = async () => {
      const target = announcements.find(x => x.id === btn.dataset.annDel);
      if(!target || !confirm(`Delete announcement "${target.title}"?`)) return;
      await sb.rpc('admin_delete_announcement', { p_id: target.id });
      if(editingAnnouncement && editingAnnouncement.id === target.id) fillAnnouncementForm(null);
      await refresh();
    };
  });
}

function fillAnnouncementForm(a){
  if($('annId')) $('annId').value = a ? a.id : '';
  if($('annTitle')) $('annTitle').value = a ? a.title : '';
  if($('annMessage')) $('annMessage').value = a ? a.message : '';
  if($('annBadge')) $('annBadge').value = a ? (a.badge || '') : '';
  if($('annBadgeColor')) $('annBadgeColor').value = a ? (a.badge_color || 'emerald') : 'emerald';
  if($('annLinkUrl')) $('annLinkUrl').value = a ? (a.link_url || '') : '';
  if($('annLinkText')) $('annLinkText').value = a ? (a.link_text || '') : '';
  if($('annActive')) $('annActive').checked = a ? (a.is_active !== false) : true;
  updateAnnouncementPreview();
  clearMsg($('annOutMsg'));
}

function updateAnnouncementPreview(){
  const title = $('annTitle')?.value.trim() || 'Welcome to TMC Awards 2026! 🎮';
  const msg = $('annMessage')?.value.trim() || 'Tamil Minecraft Creators showcase & awards voting is now officially open! Connect your Discord to build your profile, showcase your channel, and cast your vote.';
  const badge = $('annBadge')?.value.trim() || '📢 ANNOUNCEMENT';
  const linkText = $('annLinkText')?.value.trim() || 'Browse Creators →';
  const hasLink = Boolean($('annLinkUrl')?.value.trim());
  const isActive = $('annActive')?.checked;

  if($('prevTitle')) $('prevTitle').textContent = title;
  if($('prevMsg')) $('prevMsg').textContent = msg;
  if($('prevBadge')) $('prevBadge').textContent = badge;
  if($('prevActiveStatus')) {
    $('prevActiveStatus').textContent = isActive ? '● Active' : '○ Inactive';
    $('prevActiveStatus').style.color = isActive ? 'var(--em)' : 'var(--muted)';
  }
  if($('prevActionBtn')) {
    $('prevActionBtn').style.display = hasLink ? 'inline-block' : 'none';
    const span = $('prevActionBtn').querySelector('span');
    if(span) span.textContent = linkText;
  }
}

['annTitle','annMessage','annBadge','annLinkUrl','annLinkText'].forEach(id=>{
  $(id)?.addEventListener('input', updateAnnouncementPreview);
});
$('annBadgeColor')?.addEventListener('change', updateAnnouncementPreview);
$('annActive')?.addEventListener('change', updateAnnouncementPreview);

if($('annResetBtn')) $('annResetBtn').onclick = () => {
  editingAnnouncement = null;
  fillAnnouncementForm(null);
};

if($('annSaveBtn')) $('annSaveBtn').onclick = async () => {
  const title = $('annTitle')?.value.trim();
  const message = $('annMessage')?.value.trim();
  if(!title || !message){
    setMsg($('annOutMsg'), 'Announcement title and message are required.', 'err');
    return;
  }
  const payload = {
    id: $('annId')?.value || undefined,
    title,
    message,
    badge: $('annBadge')?.value.trim() || 'ANNOUNCEMENT',
    badge_color: $('annBadgeColor')?.value || 'emerald',
    link_url: $('annLinkUrl')?.value.trim(),
    link_text: $('annLinkText')?.value.trim(),
    is_active: $('annActive')?.checked
  };
  const {data, error} = await sb.rpc('admin_save_announcement', payload);
  if(error){
    setMsg($('annOutMsg'), error.message || 'Could not save announcement.', 'err');
    return;
  }
  setMsg($('annOutMsg'), 'Announcement published successfully!', 'ok');
  fx.confetti();
  fillAnnouncementForm(null);
  await refresh();
};

async function refresh(){
  const [p,c,ty,u,adm,ann]=await Promise.all([
    sb.rpc('admin_list_profiles'),
    sb.rpc('admin_list_certificates'),
    sb.rpc('admin_list_types'),
    sb.rpc('admin_list_users'),
    sb.rpc('admin_list_admins'),
    sb.rpc('admin_list_announcements')
  ]);
  profiles=p.data||[];certs=c.data||[];types=ty.data||[];users=u.data||[];
  admins=(adm&&adm.data)||[];
  announcements=(ann&&ann.data)||[];
  renderProfiles();renderCerts();renderTypes();renderUsers();renderAdmins();renderAnnouncements();
  const keep=$('cType').value;typeOptions(keep);
  if(!keep&&types.some(x=>x.is_active)&&!$('cAward').value){$('cType').value=types.find(x=>x.is_active).id;applyType()}
  $('cPick').innerHTML=`<option value="">${esc(t('ad.manual'))}</option>`+profiles.map(x=>`<option value="${esc(x.id)}">${esc(x.channel_name)} (@${esc(x.handle)})</option>`).join('');
  loadServerIcon();
}

/* ---------- certificates ---------- */
if($('cIsTeam')){
  $('cIsTeam').onchange = () => {
    const isT = $('cIsTeam').checked;
    if($('teamFieldsPane')) $('teamFieldsPane').classList.toggle('hide', !isT);
    if(isT){
      if(!$('cAward').value) $('cAward').value = 'Team Championship Award';
      if(!$('cAwardTa').value) $('cAwardTa').value = 'குழு சாம்பியன்ஷிப் விருது';
      if(!$('cName').value) $('cName').value = 'Team Members';
    }
  };
}

$('cPick').onchange=e=>{const p=profiles.find(x=>x.id===e.target.value);if(p){$('cName').value=p.display_name;$('cChannel').value=p.channel_name}};
function applyType(){
  const ty=types.find(x=>x.id===$('cType').value);if(!ty)return;
  $('cAward').value=ty.award;$('cAwardTa').value=ty.award_ta||'';$('cTheme').value=ty.theme;$('cMsg').value=ty.message||'';
}
$('cType').onchange=()=>{applyType()};
$('cMake').onclick=async()=>{
  clearMsg($('cOutMsg'));
  const isTeam = $('cIsTeam') && $('cIsTeam').checked;
  const teamName = isTeam ? ($('cTeamName').value.trim() || 'Tamil MC SMP Guild') : null;
  const teamMembers = isTeam ? ($('cTeamMembers').value.trim() || 'Team Members') : null;
  const name=($('cName').value.trim()) || (isTeam ? (teamName || 'Team Members') : '');
  const channel=($('cChannel').value.trim()) || (isTeam ? (teamName || 'Community Team') : '');
  const award=$('cAward').value.trim() || (isTeam ? 'Team Championship Award' : ''),awardTa=$('cAwardTa').value.trim(),url=$('cUrl').value.trim();
  const ty=types.find(x=>x.id===$('cType').value)||null;
  if(!isTeam && (name.length<2||channel.length<2||award.length<2))return setMsg($('cOutMsg'),t('ad.fields'),'err');
  if(isTeam && !teamName) return setMsg($('cOutMsg'), 'Please provide a Team / Guild name.', 'err');
  if(url&&!safeUrl(url))return setMsg($('cOutMsg'),t('ad.urlbad'),'err');
  $('cMake').disabled=true;
  const {data,error}=await sb.rpc('admin_create_certificate',{
    p_recipient:name,
    p_channel:channel,
    p_type_id:ty?ty.id:null,
    p_award:award,
    p_award_ta:awardTa,
    p_content_title:$('cTitle').value,
    p_content_url:url,
    p_message:$('cMsg').value,
    p_theme:$('cTheme').value,
    p_is_team_award:isTeam,
    p_team_name:teamName,
    p_team_members:teamMembers
  });
  $('cMake').disabled=false;
  if(error)return setMsg($('cOutMsg'),t('ad.createfail'),'err');
  $('cToken').textContent=data.token;$('cOut').classList.remove('hide');
  setMsg($('cOutMsg'),t('ad.created',{c:data.cert_code}),'ok');
  current={
    recipient_name:name,
    channel_name:channel,
    award,
    award_ta:awardTa||null,
    heading:isTeam ? 'Official Team Achievement Certificate' : (ty?ty.heading:null),
    heading_ta:isTeam ? 'அதிகாரப்பூர்வ குழு சாதனைச் சான்றிதழ்' : (ty?ty.heading_ta:null),
    icon:isTeam ? 'shield' : (ty?ty.icon:'star'),
    content_title:$('cTitle').value.trim(),
    message:$('cMsg').value.trim(),
    cert_code:data.cert_code,
    is_team_award:isTeam,
    team_name:teamName,
    team_members:teamMembers,
    badge_text:isTeam ? 'TEAM CERTIFICATE' : null,
    issued_at:new Date()
  };
  drawCert($('aCert'),current,$('cTheme').value);$('aDl').disabled=false;
  ['cName','cChannel','cTitle','cUrl','cTeamName','cTeamMembers'].forEach(i=>{if($(i))$(i).value=''});$('cPick').value='';
  if($('cIsTeam')) { $('cIsTeam').checked=false; $('teamFieldsPane')?.classList.add('hide'); }
  await refresh();
};
$('cTheme').onchange=()=>{if(current)drawCert($('aCert'),current,$('cTheme').value)};
$('cCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('cToken').textContent);setMsg($('cOutMsg'),t('ad.copied'),'ok')}catch(e){setMsg($('cOutMsg'),t('ad.copyfail'),'err')}};
$('aDl').onclick=()=>{
  if(!current) return;
  const btn = $('aDl');
  const prevText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Saving...';
  downloadCanvas($('aCert'),'preview-'+current.cert_code+'.png', (ok)=>{
    btn.disabled = false;
    btn.textContent = ok ? '✓ Saved!' : prevText;
    setTimeout(()=>{ if(btn) btn.textContent = prevText; }, 2500);
  });
};

function renderCerts(){
  $('cBody').innerHTML=certs.length?certs.map(c=>`<tr><td><b>${esc(c.cert_code)}</b></td><td>${esc(c.recipient_name)}</td><td>${esc(c.type_name||'-')}</td><td>${esc(certField(c,'award'))}</td>
    <td class="status ${esc(c.status)}">${esc(t('st.'+c.status))}</td><td>${esc(c.user_id||'')}</td>
    <td style="display:flex;gap:8px">
      <button class="btn small" data-prev="${esc(c.id)}">${t('ad.prev')}</button>
      ${c.status==='unused'?`<button class="btn small" data-re="${esc(c.id)}">${t('ad.reissue')}</button><button class="btn small danger" data-rev="${esc(c.id)}">${t('ad.revoke')}</button>`:''}
      <button class="btn small danger" data-del="${esc(c.id)}">${t('ad.delete')}</button></td></tr>`).join(''):`<tr><td colspan="7">${t('ad.nocerts')}</td></tr>`;
  const byId=id=>certs.find(x=>x.id===id);
  $('cBody').querySelectorAll('[data-prev]').forEach(b=>b.onclick=()=>{const c=byId(b.dataset.prev);current=c;$('cTheme').value=c.theme||'emerald';drawCert($('aCert'),c,c.theme||'emerald');$('aDl').disabled=false;$('aCert').scrollIntoView({block:'center'})});
  $('cBody').querySelectorAll('[data-re]').forEach(b=>b.onclick=async()=>{
    const {data,error}=await sb.rpc('admin_reissue_token',{p_id:b.dataset.re});
    if(error)return setMsg($('cOutMsg'),t('ad.reissuefail'),'err');
    $('cToken').textContent=data.token;$('cOut').classList.remove('hide');setMsg($('cOutMsg'),t('ad.reissued'),'ok');$('cToken').scrollIntoView({block:'center'});
  });
  $('cBody').querySelectorAll('[data-rev]').forEach(b=>b.onclick=async()=>{if(!confirm(t('ad.confirm.revoke')))return;await sb.rpc('admin_set_certificate_status',{p_id:b.dataset.rev,p_status:'revoked'});refresh()});
  $('cBody').querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(!confirm(t('ad.confirm.delete')))return;await sb.rpc('admin_delete_certificate',{p_id:b.dataset.del});refresh()});
}

/* ---------- creators ---------- */
function renderProfiles(){
  $('uList').innerHTML=profiles.length?profiles.map(p=>`<div class="list-item">
    <div><b>${esc(p.channel_name)}</b> <span class="by" style="color:var(--muted)">@${esc(p.handle)}</span>
      <div class="note" style="margin:2px 0 0">${esc(p.display_name)} · ${p.is_hidden?t('ad.hiddenby'):(p.is_public?t('ad.public'):t('ad.private'))} · ${p.votes||0} votes · ${p.likes||0} ${t('ad.likes')}</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn small" data-edit="${esc(p.id)}">${t('ad.edit')}</button>
      <button class="btn small" data-hide="${esc(p.id)}">${p.is_hidden?t('ad.unhide'):t('ad.hide')}</button>
      <button class="btn small danger" data-rm="${esc(p.id)}">${t('ad.delete')}</button></div></div>`).join(''):`<div class="empty">${t('ad.nousers')}</div>`;
  const byId=id=>profiles.find(x=>x.id===id);
  const save=(p,over)=>sb.rpc('admin_update_profile',{p_id:p.id,p_display:over.display_name??p.display_name,p_channel:over.channel_name??p.channel_name,p_bio:over.bio??p.bio??'',p_hidden:over.is_hidden??p.is_hidden,p_votes:over.votes??p.votes??0});
  $('uList').querySelectorAll('[data-hide]').forEach(b=>b.onclick=async()=>{const p=byId(b.dataset.hide);await save(p,{is_hidden:!p.is_hidden});refresh()});
  $('uList').querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{const p=byId(b.dataset.rm);if(!confirm(t('ad.confirm.user',{n:p.channel_name})))return;await sb.rpc('admin_delete_profile',{p_id:p.id});refresh()});
  $('uList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
    editing=byId(b.dataset.edit);
    $('eName').value=editing.display_name;$('eChannel').value=editing.channel_name;$('eBio').value=editing.bio||'';$('eHidden').checked=editing.is_hidden;
    clearMsg($('eMsg'));$('editDlg').showModal();
  });
  $('eSave').onclick=async()=>{
    if(!editing)return;
    const {error}=await save(editing,{display_name:$('eName').value,channel_name:$('eChannel').value,bio:$('eBio').value,is_hidden:$('eHidden').checked});
    if(error)return setMsg($('eMsg'),t('ad.savefail'),'err');
    $('editDlg').close();refresh();
  };
}
$('editClose').onclick=()=>$('editDlg').close();

/* ---------- users ---------- */
function renderUsers(){
  $('userTableBody').innerHTML=users.length?users.map(u=>{
    const prof=profiles.find(p=>p.id===u.id);
    return `<tr>
      <td><code>${esc(u.id)}</code></td>
      <td><b>${esc(u.email)}</b></td>
      <td>${fmtDate(u.created_at)}</td>
      <td>${u.discord_username ? ('<div style="color:#5865F2;font-weight:600;font-size:12px;">Discord: @'+esc(u.discord_username)+'</div>') : ''}${prof?esc(prof.channel_name)+' (@'+esc(prof.handle)+')':'-'}</td>
      <td><button class="btn small danger" data-del-u="${esc(u.id)}">Delete Account</button></td>
    </tr>`;
  }).join(''):`<tr><td colspan="5" class="empty">No registered user accounts yet.</td></tr>`;

  $('userTableBody').querySelectorAll('[data-del-u]').forEach(b=>b.onclick=async()=>{
    if(!confirm('Permanently delete this user account and its creator profile?')) return;
    await sb.rpc('admin_delete_user',{p_id:b.dataset.delU});
    refresh();
  });
}

/* ---------- administrators ---------- */
function renderAdmins(){
  const tb = $('admTableBody');
  if(!tb) return;
  tb.innerHTML = admins.length ? admins.map(a => `<tr>
    <td><b>${esc(a.name)}</b></td>
    <td><code>${esc(a.email)}</code></td>
    <td><span class="tag-pill">${esc(a.role)}</span></td>
    <td><small style="color:var(--muted)">${esc((a.created_at||'').slice(0,10))}</small></td>
    <td><button class="btn small danger" data-del-adm="${esc(a.id)}">Delete</button></td>
  </tr>`).join('') : '<tr><td colspan="5" class="empty">No administrators configured.</td></tr>';

  tb.querySelectorAll('[data-del-adm]').forEach(b => b.onclick = async () => {
    if(!confirm('Permanently delete this administrator account?')) return;
    const { error } = await sb.rpc('admin_delete_admin', { p_id: b.dataset.delAdm });
    if(error) alert(error.message || 'Failed to delete administrator');
    else refresh();
  });
}

if($('admCreateBtn')) {
  $('admCreateBtn').onclick = async () => {
    const name = ($('admNewName') && $('admNewName').value.trim()) || '';
    const email = ($('admNewEmail') && $('admNewEmail').value.trim()) || '';
    const role = ($('admNewRole') && $('admNewRole').value) || 'moderator';
    const notes = ($('admNewNotes') && $('admNewNotes').value.trim()) || '';
    const msgEl = $('admOutMsg');

    if(!name || name.length < 2 || !email || !email.includes('@')) {
      return setMsg(msgEl, 'Valid name and email are required.', 'err');
    }

    $('admCreateBtn').disabled = true;
    const { error } = await sb.rpc('admin_create_admin', { name, email, role, notes });
    $('admCreateBtn').disabled = false;

    if(error) {
      setMsg(msgEl, error.message || 'Failed to create administrator.', 'err');
    } else {
      setMsg(msgEl, 'Administrator added successfully!', 'ok');
      if($('admNewName')) $('admNewName').value = '';
      if($('admNewEmail')) $('admNewEmail').value = '';
      if($('admNewNotes')) $('admNewNotes').value = '';
      refresh();
    }
  };
}

/* ---------- server icon settings ---------- */
let serverIconData='';
async function loadServerIcon(){
  const {data}=await sb.rpc('get_server_icon');
  if(data){
    $('serverIconSlotAdmin').innerHTML=`<img src="${esc(data)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`;
    $('navIconSlot').innerHTML=`<img src="${esc(data)}" class="nav-server-icon">`;
  }
}
$('adIconFile').onchange=e=>{
  const file=e.target.files&&e.target.files[0];
  if(file){
    const r=new FileReader();
    r.onload=ev=>{
      serverIconData=ev.target.result;
      $('serverIconSlotAdmin').innerHTML=`<img src="${esc(serverIconData)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`;
    };
    r.readAsDataURL(file);
  }
};
$('adIconUrl').oninput=e=>{
  serverIconData=e.target.value.trim();
  if(serverIconData){
    $('serverIconSlotAdmin').innerHTML=`<img src="${esc(serverIconData)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`;
  }
};
$('adIconSave').onclick=async()=>{
  clearMsg($('adIconMsg'));
  if(!serverIconData) return setMsg($('adIconMsg'),'Please upload an icon file or enter an image URL.','err');
  await sb.rpc('admin_set_server_icon',{icon:serverIconData});
  $('navIconSlot').innerHTML=`<img src="${esc(serverIconData)}" class="nav-server-icon">`;
  setMsg($('adIconMsg'),'Server icon updated successfully!','ok');
  fx.confetti();
};
$('adIconReset').onclick=async()=>{
  await sb.rpc('admin_set_server_icon',{icon:null});
  $('serverIconSlotAdmin').innerHTML=`<svg viewBox="0 0 8 8" style="width:36px;height:36px"><rect width="8" height="8" rx="1.2" fill="#1f7a45"/><g fill="#3dffa0"><rect x="1" y="1" width="2" height="2"/><rect x="5" y="1" width="2" height="2"/><rect x="3" y="3" width="2" height="2"/><rect x="1" y="5" width="2" height="2"/><rect x="5" y="5" width="2" height="2"/></g></svg>`;
  $('navIconSlot').innerHTML=`<svg viewBox="0 0 8 8" aria-hidden="true"><rect width="8" height="8" rx="1.2" fill="#1f7a45"/><g fill="#3dffa0"><rect x="1" y="1" width="2" height="2"/><rect x="5" y="1" width="2" height="2"/><rect x="3" y="3" width="2" height="2"/><rect x="1" y="5" width="2" height="2"/><rect x="5" y="5" width="2" height="2"/></g></svg>`;
  $('adIconUrl').value='';$('adIconFile').value='';
  setMsg($('adIconMsg'),'Server icon reset to default.','ok');
};

/* ---------- supabase cloud database settings ---------- */
(function setupSupabaseAdminUI(){
  const urlInp = $('sbProjectUrl');
  const saveBtn = $('btnSaveSbUrl');
  const testBtn = $('btnTestSbConn');
  const badge = $('supabaseStatusBadge');
  const msg = $('sbMsg');

  fetch('/api/supabase/config')
    .then(r => r.json())
    .then(cfg => {
      if(cfg && cfg.url && urlInp && !urlInp.value) {
        urlInp.value = cfg.url;
      }
      if(badge && cfg.configured) {
        badge.textContent = '● Connected';
        badge.style.background = 'rgba(30,167,99,0.18)';
        badge.style.color = '#10b981';
      }
    }).catch(()=>{});

  if(saveBtn){
    saveBtn.onclick = async () => {
      const url = (urlInp?.value || '').trim();
      if(!url){
        if(msg) setMsg(msg, 'Please enter a Supabase Project URL', 'err');
        return;
      }
      try{
        const res = await fetch('/api/supabase/set-url', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if(data.success){
          if(msg) setMsg(msg, '✓ Project URL saved and connected successfully!', 'ok');
          if(badge){
            badge.textContent = data.status?.connected ? '● Live & Connected' : '● URL Saved';
            badge.style.color = data.status?.connected ? '#10b981' : '#f59e0b';
          }
        } else {
          if(msg) setMsg(msg, data.error || 'Failed to update URL', 'err');
        }
      }catch(err){
        if(msg) setMsg(msg, err?.message || 'Error saving URL', 'err');
      }
    };
  }

  if(testBtn){
    testBtn.onclick = async () => {
      if(msg) setMsg(msg, 'Testing Supabase connection...', 'note');
      try{
        const res = await fetch('/api/supabase/status');
        const status = await res.json();
        if(status.connected){
          if(msg) setMsg(msg, '✓ Supabase connection active and responding!', 'ok');
          if(badge){
            badge.textContent = '● Live & Connected';
            badge.style.color = '#10b981';
          }
        } else {
          if(msg) setMsg(msg, status.error || 'Connection failed: Check Project URL or RLS policies', 'err');
          if(badge){
            badge.textContent = '● Not Connected';
            badge.style.color = '#ef4444';
          }
        }
  const copySqlBtn = $('btnCopySql');
  if(copySqlBtn){
    copySqlBtn.onclick = async () => {
      try {
        const res = await fetch('/api/supabase/sql');
        const sqlText = await res.text();
        await navigator.clipboard.writeText(sqlText);
        if(msg) setMsg(msg, '✓ Complete Supabase SQL copied to clipboard! Paste and Run in Supabase SQL Editor.', 'ok');
      } catch(err) {
        window.open('/api/supabase/sql', '_blank');
      }
    };
  }
})();

/* ---------- discord oauth and redirect settings ---------- */
(function setupDiscordAdminUI(){
  const secretInp = $('dcClientSecret');
  const saveBtn = $('btnSaveDcSecret');
  const msg = $('dcMsg');

  if(saveBtn){
    saveBtn.onclick = async () => {
      const secret = (secretInp?.value || '').trim();
      if(!secret){
        if(msg) setMsg(msg, 'Please enter a Discord Client Secret', 'err');
        return;
      }
      try {
        const res = await fetch('/api/auth/discord/set-secret', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ secret })
        });
        const data = await res.json();
        if(data.success){
          if(msg) setMsg(msg, '✓ Discord Client Secret saved successfully! OAuth2 connection is active.', 'ok');
          if(secretInp) secretInp.value = '';
        } else {
          if(msg) setMsg(msg, data.error || 'Failed to save secret', 'err');
        }
      } catch(err){
        if(msg) setMsg(msg, err?.message || 'Error saving secret', 'err');
      }
    };
  }
})();



/* ---------- certificate types ---------- */
function typeForm(){
  return {name:$('tName').value.trim(),name_ta:$('tNameTa').value.trim(),heading:$('tHeading').value.trim(),heading_ta:$('tHeadingTa').value.trim(),
    award:$('tAward').value.trim(),award_ta:$('tAwardTa').value.trim(),theme:$('tTheme').value,icon:$('tIcon').value,message:$('tMsg').value.trim(),is_active:$('tActive').checked};
}
function typePreview(){
  const f=typeForm();
  drawCert($('tCert'),{recipient_name:t('ad.sample.n'),channel_name:t('ad.sample.c'),award:f.award||t('ad.sample.a'),award_ta:f.award_ta||null,heading:f.heading||null,heading_ta:f.heading_ta||null,icon:f.icon,message:f.message,cert_code:'CERT-XXXXXXXX',issued_at:new Date()},f.theme||'emerald');
}
['tName','tNameTa','tHeading','tHeadingTa','tAward','tAwardTa','tTheme','tIcon','tMsg'].forEach(i=>$(i).addEventListener('input',typePreview));
function fillType(x){
  editingType=x||null;
  $('tName').value=x?x.name:'';$('tNameTa').value=x&&x.name_ta||'';$('tHeading').value=x?x.heading:'';$('tHeadingTa').value=x&&x.heading_ta||'';
  $('tAward').value=x?x.award:'';$('tAwardTa').value=x&&x.award_ta||'';$('tTheme').value=x?x.theme:'emerald';$('tIcon').value=x?x.icon:'star';
  $('tMsg').value=x&&x.message||'';$('tActive').checked=x?x.is_active:true;
  $('typeFormTitle').textContent=x?t('ad.type.edit'):t('ad.type.new');clearMsg($('tMsgOut'));typePreview();
}
$('tNew').onclick=()=>fillType(null);
$('tSave').onclick=async()=>{
  const f=typeForm();
  if(f.name.length<2||f.heading.length<2||f.award.length<2)return setMsg($('tMsgOut'),t('ad.type.err'),'err');
  $('tSave').disabled=true;
  const {error}=await sb.rpc('admin_save_type',{p_id:editingType?editingType.id:null,p_name:f.name,p_name_ta:f.name_ta,p_heading:f.heading,p_heading_ta:f.heading_ta,p_award:f.award,p_award_ta:f.award_ta,p_theme:f.theme,p_icon:f.icon,p_message:f.message,p_active:f.is_active});
  $('tSave').disabled=false;
  if(error)return setMsg($('tMsgOut'),t('ad.type.err'),'err');
  setMsg($('tMsgOut'),t('ad.type.saved'),'ok');fx.confetti();fillType(null);await refresh();
};
function renderTypes(){
  $('typeList').innerHTML=types.length?types.map(x=>`<div class="list-item"><div><b>${esc(typeName(x))}</b>${x.is_active?'':` <span class="note">(${t('ad.type.off')})</span>`}
    <div class="note" style="margin:2px 0 0">${esc((lang()==='ta'&&x.heading_ta)||x.heading)}</div></div>
    <div style="display:flex;gap:8px"><button class="btn small" data-te="${esc(x.id)}">${t('ad.edit')}</button><button class="btn small danger" data-td="${esc(x.id)}">${t('ad.delete')}</button></div></div>`).join(''):`<div class="empty">${t('ad.type.none')}</div>`;
  $('typeList').querySelectorAll('[data-te]').forEach(b=>b.onclick=()=>{fillType(types.find(x=>x.id===b.dataset.te));$('tName').scrollIntoView({block:'center'})});
  $('typeList').querySelectorAll('[data-td]').forEach(b=>b.onclick=async()=>{const x=types.find(y=>y.id===b.dataset.td);if(!confirm(t('ad.type.confirm',{n:x.name})))return;await sb.rpc('admin_delete_type',{p_id:x.id});if(editingType&&editingType.id===x.id)fillType(null);refresh()});
}

function fillTypeTitle(){$('typeFormTitle').textContent=editingType?t('ad.type.edit'):t('ad.type.new')}
function sample(){drawCert($('aCert'),current||{recipient_name:t('ad.sample.n'),channel_name:t('ad.sample.c'),award:t('ad.sample.a'),cert_code:'CERT-XXXXXXXX',issued_at:new Date()},current?$('cTheme').value:'emerald')}
document.addEventListener('langchange',()=>{selects();if(!$('app').classList.contains('hide')){renderCerts();renderProfiles();renderTypes();renderUsers();typePreview();fillTypeTitle();sample()}});

if($('themeBtn')) $('themeBtn').onclick=()=>{
  const curr=document.documentElement.getAttribute('data-theme')||'light';
  const next=curr==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme', next);
  try{localStorage.setItem('tmc_theme', next)}catch(e){}
};

/* ---------- start & token URL check ---------- */
(async()=>{
  const searchParams=new URLSearchParams(window.location.search);
  const tokenParam=searchParams.get('token');
  if(tokenParam==='ADMINOFTMC'){
    if($('lToken')) $('lToken').value = 'ADMINOFTMC';
    const {data}=await sb.rpc('admin_login_token',{token:'ADMINOFTMC'});
    if(data&&data.ok){
      await enter();
      return;
    }
  }

  const {data:gate}=await sb.rpc('is_admin');
  if(gate){
    await enter();
  } else {
    view('stepLogin');
  }
})();
})();
