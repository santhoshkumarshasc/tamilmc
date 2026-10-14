(function(){
'use strict';
function createFallbackClient(){
  const STORAGE_KEY='tmc_mock_db_v1';
  const defaultTypes=[
    {id:'type-1',name:'Achievement',name_ta:'சாதனை',heading:'Certificate of Achievement',heading_ta:'சாதனைச் சான்றிதழ்',award:'Outstanding Creator',award_ta:'சிறந்த படைப்பாளர்',theme:'emerald',icon:'star',message:'Honouring outstanding creativity in Tamil Minecraft builds and videos.',is_active:true,sort_order:0},
    {id:'type-2',name:'Winner',name_ta:'வெற்றியாளர்',heading:'Certificate of Victory',heading_ta:'வெற்றிச் சான்றிதழ்',award:'Showcase Winner',award_ta:'காட்சியக வெற்றியாளர்',theme:'gold',icon:'trophy',message:'First prize in the Tamil Minecraft Builders Showcase tournament.',is_active:true,sort_order:1},
    {id:'type-3',name:'Participation',name_ta:'பங்கேற்பு',heading:'Certificate of Participation',heading_ta:'பங்கேற்புச் சான்றிதழ்',award:'Active Participant',award_ta:'சிறந்த பங்கேற்பாளர்',theme:'diamond',icon:'shield',message:'For active participation in the Tamil Minecraft Community Event.',is_active:true,sort_order:2},
    {id:'type-4',name:'Appreciation',name_ta:'பாராட்டு',heading:'Certificate of Appreciation',heading_ta:'பாராட்டுச் சான்றிதழ்',award:'Valued Contributor',award_ta:'மதிப்புமிக்க பங்களிப்பாளர்',theme:'netherite',icon:'heart',message:'In recognition of outstanding dedication and leadership.',is_active:true,sort_order:3},
    {id:'type-5',name:'Rising Star',name_ta:'வளரும் நட்சத்திரம்',heading:'Rising Star Certificate',heading_ta:'வளரும் நட்சத்திரச் சான்றிதழ்',award:'Rising Star',award_ta:'வளரும் நட்சத்திரம்',theme:'emerald',icon:'gem',message:'Recognising one of the most promising new Tamil creators.',is_active:true,sort_order:4}
  ];
  const defaultProfiles=[
    {id:'mock-u1',handle:'tamil_miner',display_name:'Karthik',channel_name:'Tamil Miner',channel_url:'https://youtube.com/@tamilminer',bio:'Minecraft survival, redstone guides and hardcore speedruns in Tamil!',accent:'#1f9d5e',card_style:'raised',avatar_emoji:'⛏️',links:[{label:'YouTube',url:'https://youtube.com/@tamilminer'}],is_public:true,is_hidden:false,likes:42,cert_count:1},
    {id:'mock-u2',handle:'block_thambi',display_name:'Santhosh',channel_name:'Block Thambi',channel_url:'https://youtube.com/@blockthambi',bio:'Building ancient Chola temples, Tanjore fortresses and mega structures in Minecraft.',accent:'#38d6ff',card_style:'outline',avatar_emoji:'🏰',links:[{label:'YouTube',url:'https://youtube.com/@blockthambi'}],is_public:true,is_hidden:false,likes:38,cert_count:1},
    {id:'mock-u3',handle:'redstone_raja',display_name:'Vijay',channel_name:'Redstone Raja',channel_url:'https://youtube.com/@redstoneraja',bio:'Automated farms and crazy redstone contraptions with Tamil voiceover.',accent:'#f97316',card_style:'flat',avatar_emoji:'⚙️',links:[{label:'YouTube',url:'https://youtube.com/@redstoneraja'}],is_public:true,is_hidden:false,likes:29,cert_count:0}
  ];
  const defaultCerts=[
    {id:'cert-1',cert_code:'CERT-TNBLOCKS1',token:'TMC-ALREADY-USED-1',recipient_name:'Karthik',channel_name:'Tamil Miner',award:'Outstanding Creator',award_ta:'சிறந்த படைப்பாளர்',heading:'Certificate of Achievement',heading_ta:'சாதனைச் சான்றிதழ்',theme:'emerald',icon:'star',content_title:'Hardcore 100 Days Tamil',content_url:'https://youtube.com/@tamilminer',message:'Outstanding milestone reaching 100 days in hardcore survival mode.',status:'redeemed',user_id:'mock-u1',issued_at:new Date('2025-01-15').toISOString()},
    {id:'cert-2',cert_code:'CERT-TNBLOCKS2',token:'TMC-TNBL-OCKS-2025',recipient_name:'Santhosh',channel_name:'Block Thambi',award:'Showcase Winner',award_ta:'காட்சியக வெற்றியாளர்',heading:'Certificate of Victory',heading_ta:'வெற்றிச் சான்றிதழ்',theme:'gold',icon:'trophy',content_title:'Thanjavur Periya Kovil Build',content_url:'https://youtube.com/@blockthambi',message:'1st prize winner of the TN Blocks mega builder competition.',status:'unused',user_id:null,issued_at:new Date('2025-02-01').toISOString()}
  ];
  function loadDb(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw)return JSON.parse(raw);
    }catch(e){}
    const init={users:[{id:'mock-u1',email:'karthik@example.com'}],profiles:defaultProfiles,certs:defaultCerts,types:defaultTypes,likes:{'mock-u1':['mock-u2']},session:null};
    saveDb(init);
    return init;
  }
  function saveDb(data){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}catch(e){}
  }
  let db=loadDb();
  let authListeners=[];
  function notifyAuth(event,session){
    authListeners.forEach(cb=>{try{cb(event,session)}catch(e){console.error(e)}});
  }
  return {
    from:(table)=>({
      select:(cols)=>{
        db=loadDb();
        const rows=table==='public_profiles'?db.profiles.filter(p=>p.is_public&&!p.is_hidden):[...db.profiles];
        return {
          order:(col,opts)=>({
            limit:async(n)=>{
              const sorted=[...rows].sort((a,b)=>opts&&opts.ascending?(a[col]-b[col]):(b[col]-a[col]));
              return {data:sorted.slice(0,n),error:null};
            }
          }),
          eq:(col,val)=>({
            maybeSingle:async()=>{
              db=loadDb();
              const found=db.profiles.find(p=>String(p[col])===String(val));
              return {data:found||null,error:null};
            }
          })
        };
      },
      insert:async(record)=>{
        db=loadDb();
        const existing=db.profiles.find(p=>p.handle===record.handle&&p.id!==record.id);
        if(existing)return {data:null,error:{code:'23505',message:'Handle already taken'}};
        const idx=db.profiles.findIndex(p=>p.id===record.id);
        if(idx>=0)db.profiles[idx]={...db.profiles[idx],...record};
        else db.profiles.push({likes:0,cert_count:0,...record});
        saveDb(db);
        return {data:record,error:null};
      },
      update:(data)=>({
        eq:async(col,val)=>{
          db=loadDb();
          const idx=db.profiles.findIndex(p=>String(p[col])===String(val));
          if(idx>=0){db.profiles[idx]={...db.profiles[idx],...data};saveDb(db);return {data:db.profiles[idx],error:null}}
          return {data:null,error:null};
        }
      })
    }),
    rpc:async(fn,params)=>{
      db=loadDb();
      if(fn==='toggle_like'){
        const id=params.p_profile,uid=db.session?db.session.user.id:'guest';
        if(!db.likes[uid])db.likes[uid]=[];
        const idx=db.likes[uid].indexOf(id);
        const p=db.profiles.find(x=>x.id===id);
        let liked=false;
        if(idx>=0){db.likes[uid].splice(idx,1);if(p)p.likes=Math.max(0,(p.likes||1)-1)}
        else{db.likes[uid].push(id);if(p)p.likes=(p.likes||0)+1;liked=true}
        saveDb(db);
        return {data:{likes:p?p.likes:0,liked},error:null};
      }
      if(fn==='my_likes'){
        const uid=db.session?db.session.user.id:null;
        return {data:uid?(db.likes[uid]||[]):[],error:null};
      }
      if(fn==='my_certificates'){
        const uid=db.session?db.session.user.id:null;
        return {data:uid?db.certs.filter(c=>c.user_id===uid):[],error:null};
      }
      if(fn==='redeem_certificate'){
        if(!db.session)return {data:{ok:false,error:'sign_in_required'},error:null};
        const tk=(params.p_token||'').trim();
        const found=db.certs.find(c=>c.token===tk&&c.status==='unused');
        if(!found)return {data:{ok:false,error:'invalid_token'},error:null};
        const myProf=db.profiles.find(p=>p.id===db.session.user.id);
        found.status='redeemed';found.user_id=db.session.user.id;
        if(myProf){found.recipient_name=myProf.display_name;found.channel_name=myProf.channel_name;myProf.cert_count=(myProf.cert_count||0)+1}
        saveDb(db);
        return {data:{ok:true,cert_code:found.cert_code},error:null};
      }
      if(fn==='verify_certificate'){
        const code=(params.p_code||'').trim().toUpperCase();
        return {data:db.certs.filter(c=>(c.cert_code||'').toUpperCase()===code),error:null};
      }
      if(fn==='delete_my_account'){
        if(db.session){const uid=db.session.user.id;db.profiles=db.profiles.filter(p=>p.id!==uid);db.session=null;saveDb(db);notifyAuth('SIGNED_OUT',null)}
        return {data:null,error:null};
      }
      if(fn==='admin_gate'||fn==='is_admin'||fn==='admin_list_profiles'||fn==='admin_list_certificates'||fn==='admin_list_types'){
        if(fn==='admin_gate'||fn==='is_admin')return {data:true,error:null};
        if(fn==='admin_list_profiles')return {data:db.profiles,error:null};
        if(fn==='admin_list_certificates')return {data:db.certs,error:null};
        if(fn==='admin_list_types')return {data:db.types,error:null};
      }
      if(fn==='admin_create_certificate'){
        const rnd=()=>Math.random().toString(36).substring(2,6).toUpperCase();
        const token=`TMC-${rnd()}-${rnd()}-${rnd()}`,code=`CERT-${rnd()}${rnd()}`;
        const ty=db.types.find(t=>t.id===params.p_type_id);
        const newCert={id:'cert-'+Date.now(),cert_code:code,token,recipient_name:params.p_recipient,channel_name:params.p_channel,award:params.p_award,award_ta:params.p_award_ta||'',content_title:params.p_content_title||'',content_url:params.p_content_url||'',message:params.p_message||'',theme:params.p_theme||'emerald',icon:ty?ty.icon:'star',status:'unused',user_id:null,issued_at:new Date().toISOString()};
        db.certs.unshift(newCert);saveDb(db);
        return {data:{token,cert_code:code},error:null};
      }
      if(fn==='admin_delete_certificate'){db.certs=db.certs.filter(c=>c.id!==params.p_id);saveDb(db);return {data:null,error:null}}
      if(fn==='admin_reissue_certificate'||fn==='admin_reissue_token'){
        const rnd=()=>Math.random().toString(36).substring(2,6).toUpperCase();
        const token=`TMC-${rnd()}-${rnd()}-${rnd()}`,cert=db.certs.find(c=>c.id===params.p_id);
        if(cert){cert.token=token;cert.status='unused'}saveDb(db);
        return {data:{token},error:null};
      }
      if(fn==='admin_revoke_certificate'||fn==='admin_set_certificate_status'){
        const cert=db.certs.find(c=>c.id===params.p_id);if(cert)cert.status='revoked';saveDb(db);return {data:null,error:null};
      }
      if(fn==='admin_toggle_hide'){
        const p=db.profiles.find(x=>x.id===params.p_id);if(p)p.is_hidden=!p.is_hidden;saveDb(db);return {data:null,error:null};
      }
      if(fn==='admin_save_type'){
        const ty={id:params.p_id||('type-'+Date.now()),name:params.p_name,name_ta:params.p_name_ta,heading:params.p_heading,heading_ta:params.p_heading_ta,award:params.p_award,award_ta:params.p_award_ta,theme:params.p_theme,icon:params.p_icon,message:params.p_message,is_active:params.p_active!==false,sort_order:params.p_sort||0};
        const idx=db.types.findIndex(t=>t.id===ty.id);if(idx>=0)db.types[idx]=ty;else db.types.push(ty);saveDb(db);return {data:null,error:null};
      }
      if(fn==='admin_delete_type'){db.types=db.types.filter(t=>t.id!==params.p_id);saveDb(db);return {data:null,error:null}}
      return {data:null,error:null};
    },
    auth:{
      getSession:async()=>{db=loadDb();return {data:{session:db.session},error:null}},
      onAuthStateChange:(callback)=>{
        authListeners.push(callback);db=loadDb();
        setTimeout(()=>callback(db.session?'SIGNED_IN':'SIGNED_OUT',db.session),0);
        return {data:{subscription:{unsubscribe:()=>{authListeners=authListeners.filter(x=>x!==callback)}}}};
      },
      signUp:async({email})=>{
        db=loadDb();const user={id:'u-'+Date.now(),email},session={user,access_token:'mock-token'};
        db.users.push(user);db.session=session;saveDb(db);notifyAuth('SIGNED_IN',session);
        return {data:{user,session},error:null};
      },
      signInWithPassword:async({email})=>{
        db=loadDb();let user=db.users.find(u=>u.email===email);
        if(!user){user={id:'u-'+Date.now(),email};db.users.push(user)}
        const session={user,access_token:'mock-token'};db.session=session;saveDb(db);notifyAuth('SIGNED_IN',session);
        return {data:{user,session},error:null};
      },
      signOut:async()=>{
        db=loadDb();db.session=null;saveDb(db);notifyAuth('SIGNED_OUT',null);return {data:null,error:null};
      },
      resetPasswordForEmail:async()=>({data:{},error:null}),
      mfa:{
        getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal2'}}),
        listFactors:async()=>({data:{totp:[{id:'mock-factor'}]}}),
        enroll:async()=>({data:{id:'mock-factor',totp:{qr_code:'',secret:'TNBLOCKSADMINKEY'}}}),
        challenge:async()=>({data:{id:'mock-challenge'}}),
        verify:async()=>({data:{},error:null})
      }
    }
  };
}

window.sb = createFallbackClient();
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
