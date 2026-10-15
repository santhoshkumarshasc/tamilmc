(function(){
'use strict';
function createFallbackClient(){
  const STORAGE_KEY='tmc_live_db_v3';

  const defaultTypes=[
    {id:'type-welcome',name:'Welcome Member',name_ta:'வரவேற்பு உறுப்பினர்',heading:'Community Welcome Certificate',heading_ta:'சமூக வரவேற்புச் சான்றிதழ்',award:'Welcome to Tamil MC Community',award_ta:'தமிழ் MC சமூக வரவேற்பு',theme:'emerald',icon:'shield',message:'Welcome to the Tamil Minecraft community! Official certified creator of TMC Awards.',is_active:true,sort_order:0},
    {id:'type-1',name:'Achievement',name_ta:'சாதனை',heading:'Certificate of Achievement',heading_ta:'சாதனைச் சான்றிதழ்',award:'Outstanding Creator',award_ta:'சிறந்த படைப்பாளர்',theme:'emerald',icon:'star',message:'Honouring outstanding creativity in Tamil Minecraft builds and videos.',is_active:true,sort_order:1},
    {id:'type-2',name:'Winner',name_ta:'வெற்றியாளர்',heading:'Certificate of Victory',heading_ta:'வெற்றிச் சான்றிதழ்',award:'Best Creator Award',award_ta:'சிறந்த படைப்பாளர் விருது',theme:'gold',icon:'trophy',message:'Winner of the TMC Awards Best Creator community poll.',is_active:true,sort_order:2},
    {id:'type-3',name:'Participation',name_ta:'பங்கேற்பு',heading:'Certificate of Participation',heading_ta:'பங்கேற்புச் சான்றிதழ்',award:'Active Participant',award_ta:'சிறந்த பங்கேற்பாளர்',theme:'diamond',icon:'shield',message:'For active participation in the Tamil Minecraft Community Event.',is_active:true,sort_order:3},
    {id:'type-4',name:'Appreciation',name_ta:'பாராட்டு',heading:'Certificate of Appreciation',heading_ta:'பாராட்டுச் சான்றிதழ்',award:'Valued Contributor',award_ta:'மதிப்புமிக்க பங்களிப்பாளர்',theme:'netherite',icon:'heart',message:'In recognition of outstanding dedication and leadership in the community.',is_active:true,sort_order:4},
    {id:'type-5',name:'Rising Star',name_ta:'வளரும் நட்சத்திரம்',heading:'Rising Star Certificate',heading_ta:'வளரும் நட்சத்திரச் சான்றிதழ்',award:'Rising Star Creator',award_ta:'வளரும் நட்சத்திரப் படைப்பாளர்',theme:'emerald',icon:'gem',message:'Recognising one of the most promising new Tamil Minecraft creators.',is_active:true,sort_order:5}
  ];

  function loadDb(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed=JSON.parse(raw);
        // Ensure session persists from dedicated storage key if available
        try{
          const savedSession=localStorage.getItem('tmc_auth_session');
          if(savedSession){
            parsed.session=JSON.parse(savedSession);
          }
        }catch(e){}
        return parsed;
      }
    }catch(e){}
    let savedSession=null;
    try{
      const rawSess=localStorage.getItem('tmc_auth_session');
      if(rawSess) savedSession=JSON.parse(rawSess);
    }catch(e){}
    const init={
      users:[],
      profiles:[],
      certs:[],
      types:defaultTypes,
      likes:{},
      votes:{},
      session:savedSession,
      isAdmin:false,
      serverIcon:null
    };
    saveDb(init);
    return init;
  }
  function saveDb(data){
    try{
      localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
      if(data.session){
        localStorage.setItem('tmc_auth_session',JSON.stringify(data.session));
      } else {
        localStorage.removeItem('tmc_auth_session');
      }
    }catch(e){}
  }
  let db=loadDb();
  let authListeners=[];
  function notifyAuth(event,session){
    try{
      if(session){
        localStorage.setItem('tmc_auth_session',JSON.stringify(session));
      } else {
        localStorage.removeItem('tmc_auth_session');
      }
    }catch(e){}
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
              const sorted=[...rows].sort((a,b)=>opts&&opts.ascending?((a[col]||0)-(b[col]||0)):((b[col]||0)-(a[col]||0)));
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
        
        // Auto-award Common Minecraft Welcome to Tamil MC Community Certificate!
        const rnd=()=>Math.random().toString(36).substring(2,6).toUpperCase();
        const welcomeCode=`CERT-TMC-WELCOME-${rnd()}`;
        const welcomeCert={
          id:'cert-welcome-'+Date.now(),
          cert_code:welcomeCode,
          token:`TMC-WELCOME-${rnd()}`,
          recipient_name:record.display_name||'Minecraft Creator',
          channel_name:record.channel_name||'Community Member',
          award:'Welcome to Tamil MC Community',
          award_ta:'தமிழ் MC சமூக வரவேற்பு',
          heading:'Community Welcome Certificate',
          heading_ta:'சமூக வரவேற்புச் சான்றிதழ்',
          content_title:'Official Member of TMC Awards',
          content_url:record.channel_url||'',
          message:'Welcome to the Tamil Minecraft community! Official certified creator of TMC Awards.',
          theme:'emerald',
          icon:'shield',
          type_name:'Community Welcome',
          status:'redeemed',
          user_id:record.id,
          is_welcome:true,
          issued_at:new Date().toISOString()
        };

        const existingWelcome=db.certs.find(c=>c.user_id===record.id&&c.is_welcome);
        if(!existingWelcome){
          db.certs.unshift(welcomeCert);
          record.cert_count=1;
          record.has_welcome=true;
        }

        const idx=db.profiles.findIndex(p=>p.id===record.id);
        if(idx>=0)db.profiles[idx]={...db.profiles[idx],...record};
        else db.profiles.push({likes:0,votes:0,cert_count:1,...record});
        saveDb(db);
        return {data:record,welcomeCert,error:null};
      },
      update:(data)=>({
        eq:async(col,val)=>{
          db=loadDb();
          const idx=db.profiles.findIndex(p=>String(p[col])===String(val));
          if(idx>=0){
            db.profiles[idx]={...db.profiles[idx],...data};
            const uid=String(db.profiles[idx].id);
            let welcomeCert=db.certs.find(c=>c.user_id===uid&&c.is_welcome);
            if(!welcomeCert){
              const rnd=()=>Math.random().toString(36).substring(2,6).toUpperCase();
              welcomeCert={
                id:'cert-welcome-'+Date.now(),
                cert_code:`CERT-TMC-WELCOME-${rnd()}`,
                token:`TMC-WELCOME-${rnd()}`,
                recipient_name:db.profiles[idx].display_name||'Minecraft Creator',
                channel_name:db.profiles[idx].channel_name||'Community Member',
                award:'Welcome to Tamil MC Community',
                award_ta:'தமிழ் MC சமூக வரவேற்பு',
                heading:'Community Welcome Certificate',
                heading_ta:'சமூக வரவேற்புச் சான்றிதழ்',
                content_title:'Official Member of TMC Awards',
                content_url:db.profiles[idx].channel_url||'',
                message:'Welcome to the Tamil Minecraft community! Official certified creator of TMC Awards.',
                theme:'emerald',
                icon:'shield',
                type_name:'Community Welcome',
                status:'redeemed',
                user_id:uid,
                is_welcome:true,
                issued_at:new Date().toISOString()
              };
              db.certs.unshift(welcomeCert);
              db.profiles[idx].has_welcome=true;
              db.profiles[idx].cert_count=(db.profiles[idx].cert_count||0)+1;
            }
            saveDb(db);
            return {data:db.profiles[idx],welcomeCert,error:null};
          }
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

      /* Voting System - Who is your Best Creator (Strictly 1 vote per person) */
      if(fn==='vote_best_creator'){
        const targetId=params.p_profile;
        const voterId=db.session?db.session.user.id:(params.p_voter_id||'guest-voter');
        if(!db.votes) db.votes={};
        const prevVote=db.votes[voterId];
        if(prevVote===targetId){
          // Cancel vote
          delete db.votes[voterId];
          const p=db.profiles.find(x=>x.id===targetId);
          if(p) p.votes=Math.max(0,(p.votes||1)-1);
          saveDb(db);
          return {data:{voted:false,votedId:null,votes:p?p.votes:0,prevVoteId:null},error:null};
        }
        let oldVotes=0;
        if(prevVote){
          const oldP=db.profiles.find(x=>x.id===prevVote);
          if(oldP){
            oldP.votes=Math.max(0,(oldP.votes||1)-1);
            oldVotes=oldP.votes;
          }
        }
        db.votes[voterId]=targetId;
        const p=db.profiles.find(x=>x.id===targetId);
        if(p) p.votes=(p.votes||0)+1;
        saveDb(db);
        return {data:{voted:true,votedId:targetId,votes:p?p.votes:0,prevVoteId:prevVote||null,oldVotes:oldVotes},error:null};
      }
      if(fn==='get_my_vote'){
        const voterId=db.session?db.session.user.id:(params.p_voter_id||'guest-voter');
        return {data:(db.votes&&db.votes[voterId])||null,error:null};
      }

      /* Server Icon */
      if(fn==='get_server_icon'){
        return {data:db.serverIcon||null,error:null};
      }
      if(fn==='admin_set_server_icon'){
        db.serverIcon=params.icon||null;
        saveDb(db);
        return {data:db.serverIcon,error:null};
      }

      if(fn==='my_certificates'){
        const uid=db.session?db.session.user.id:null;
        if(!uid) return {data:[],error:null};
        let userCerts=db.certs.filter(c=>c.user_id===uid);
        const myProf=db.profiles.find(p=>p.id===uid);
        if(!userCerts.some(c=>c.is_welcome)){
          const rnd=()=>Math.random().toString(36).substring(2,6).toUpperCase();
          const welcomeCert={
            id:'cert-welcome-'+Date.now(),
            cert_code:`CERT-TMC-WELCOME-${rnd()}`,
            token:`TMC-WELCOME-${rnd()}`,
            recipient_name:(myProf&&myProf.display_name)||(db.session.user&&db.session.user.name)||'Minecraft Creator',
            channel_name:(myProf&&myProf.channel_name)||'Community Member',
            award:'Welcome to Tamil MC Community',
            award_ta:'தமிழ் MC சமூக வரவேற்பு',
            heading:'Community Welcome Certificate',
            heading_ta:'சமூக வரவேற்புச் சான்றிதழ்',
            content_title:'Official Member of TMC Awards',
            content_url:(myProf&&myProf.channel_url)||'',
            message:'Welcome to the Tamil Minecraft community! Official certified creator of TMC Awards.',
            theme:'emerald',
            icon:'shield',
            type_name:'Community Welcome',
            status:'redeemed',
            user_id:uid,
            is_welcome:true,
            issued_at:new Date().toISOString()
          };
          db.certs.unshift(welcomeCert);
          if(myProf){
            myProf.has_welcome=true;
            myProf.cert_count=(myProf.cert_count||0)+1;
          }
          saveDb(db);
          userCerts=[welcomeCert, ...userCerts];
        }
        return {data:userCerts,error:null};
      }
      if(fn==='redeem_certificate'){
        const tk=(params.p_token||'').trim().toUpperCase();
        const found=db.certs.find(c=>(c.token||'').toUpperCase()===tk&&c.status==='unused');
        if(!found)return {data:{ok:false,error:'invalid_token'},error:null};
        const uid=db.session?db.session.user.id:(params.p_user_id||'creator-'+Date.now());
        const myProf=db.session?db.profiles.find(p=>p.id===db.session.user.id):null;
        found.status='redeemed';
        found.user_id=uid;
        if(myProf){
          if(myProf.display_name) found.recipient_name=myProf.display_name;
          if(myProf.channel_name) found.channel_name=myProf.channel_name;
          myProf.cert_count=(myProf.cert_count||0)+1;
        }
        saveDb(db);
        return {data:{ok:true,cert:found,cert_code:found.cert_code},error:null};
      }
      if(fn==='verify_certificate'){
        const code=(params.p_code||'').trim().toUpperCase();
        return {data:db.certs.filter(c=>(c.cert_code||'').toUpperCase()===code),error:null};
      }
      if(fn==='admin_login_token'){
        const tk=(params.token||'').trim();
        const em=(params.email||'').trim().toLowerCase();
        // Support ADMINOFTMC with optional custom Gmail, or any admin in db.admins
        if(!db.admins||!db.admins.length){
          db.admins=[
            {id:'admin-lead-1',email:'santhoshkumarshasc@gmail.com',name:'Santhosh (Lead Admin)',role:'super_admin',password:'ADMINOFTMC',created_at:'2026-09-01T00:00:00.000Z',is_active:true},
            {id:'admin-lead-2',email:'admin@tmcawards.org',name:'TMC Awards Operations',role:'super_admin',password:'ADMINOFTMC',created_at:'2026-09-01T00:00:00.000Z',is_active:true},
            {id:'admin-lead-3',email:'ogisbacktamil@gmail.com',name:'TMC Admin (Owner)',role:'super_admin',password:'ADMINOFTMC',created_at:'2026-09-01T00:00:00.000Z',is_active:true}
          ];
        }
        const matchedAdm=db.admins.find(a=>(a.email.toLowerCase()===em||!em)&&(a.password===tk||tk==='ADMINOFTMC')&&a.is_active);
        if(tk==='ADMINOFTMC'||matchedAdm){
          const adminEmail=em||(matchedAdm?matchedAdm.email:'admin@tmcawards.org');
          const adminName=(matchedAdm?matchedAdm.name:null)||(em?em.split('@')[0]:'TMC Administrator');
          const adminUser={
            id:matchedAdm?matchedAdm.id:('admin-'+Date.now()),
            email:adminEmail,
            is_admin:true,
            name:adminName,
            role:matchedAdm?matchedAdm.role:'super_admin'
          };
          const session={user:adminUser,access_token:'admin-secret-token-'+Date.now()};
          db.isAdmin=true;
          db.adminLoginAt=Date.now();
          db.session=session;
          saveDb(db);
          notifyAuth('SIGNED_IN',session);
          return {data:{ok:true,session},error:null};
        }
        return {data:{ok:false,error:'Invalid administrator credentials or token'},error:null};
      }
      if(fn==='delete_my_account'){
        if(db.session){
          const uid=db.session.user.id;
          db.profiles=db.profiles.filter(p=>p.id!==uid);
          db.users=db.users.filter(u=>u.id!==uid);
          db.session=null;
          saveDb(db);
          notifyAuth('SIGNED_OUT',null);
        }
        return {data:null,error:null};
      }

      /* Admin APIs */
      const isAdmin=db.isAdmin||(db.session&&db.session.user&&(db.session.user.is_admin||db.session.user.email==='admin@tmcawards.org'));
      if(fn==='admin_gate'||fn==='is_admin'){
        return {data:isAdmin,error:null};
      }
      if(fn==='admin_list_profiles'||fn==='admin_list_certificates'||fn==='admin_list_types'||fn==='admin_list_users'||fn==='admin_list_admins'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        if(fn==='admin_list_profiles')return {data:db.profiles,error:null};
        if(fn==='admin_list_certificates')return {data:db.certs,error:null};
        if(fn==='admin_list_types')return {data:db.types,error:null};
        if(fn==='admin_list_users')return {data:db.users,error:null};
        if(fn==='admin_list_admins'){
          if(!db.admins||!db.admins.length) db.admins=[
            {id:'admin-lead-1',email:'santhoshkumarshasc@gmail.com',name:'Santhosh (Lead Admin)',role:'super_admin',password:'ADMINOFTMC',created_at:'2026-09-01T00:00:00.000Z',is_active:true},
            {id:'admin-lead-2',email:'admin@tmcawards.org',name:'TMC Awards Operations',role:'super_admin',password:'ADMINOFTMC',created_at:'2026-09-01T00:00:00.000Z',is_active:true},
            {id:'admin-lead-3',email:'ogisbacktamil@gmail.com',name:'TMC Admin (Owner)',role:'super_admin',password:'ADMINOFTMC',created_at:'2026-09-01T00:00:00.000Z',is_active:true}
          ];
          return {data:db.admins,error:null};
        }
      }
      if(fn==='admin_create_admin'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        const email=(params.email||'').trim().toLowerCase(),name=(params.name||'').trim(),role=params.role||'moderator',notes=(params.notes||'').trim(),password=(params.password||'ADMINOFTMC').trim();
        if(!email||!email.includes('@'))return {data:null,error:{message:'Valid email required'}};
        if(!name||name.length<2)return {data:null,error:{message:'Admin name required (min 2 chars)'}};
        if(!db.admins) db.admins=[];
        if(db.admins.some(a=>a.email.toLowerCase()===email)) return {data:null,error:{message:'Admin with this email already exists'}};
        const newAdmin={id:'admin-'+Date.now(),email,name,role,notes,password,created_at:new Date().toISOString(),created_by:db.session?.user?.email||'Lead Administrator',is_active:true};
        db.admins.unshift(newAdmin);saveDb(db);return {data:newAdmin,error:null};
      }
      if(fn==='admin_delete_admin'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        const targetId=params.p_id;if(!db.admins) db.admins=[];
        const curEmail=(db.session?.user?.email||'').toLowerCase();
        const target=db.admins.find(a=>a.id===targetId||a.email===targetId);
        if(!target)return {data:null,error:{message:'Admin not found'}};
        if(curEmail&&target.email.toLowerCase()===curEmail)return {data:null,error:{message:'Cannot delete your own active administrator account'}};
        db.admins=db.admins.filter(a=>a.id!==target.id);saveDb(db);return {data:{success:true},error:null};
      }
      if(fn==='admin_export_backup'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        const payload={version:'1.0',exported_at:new Date().toISOString(),profiles:db.profiles,certs:db.certs,types:db.types,admins:db.admins,users:db.users,votes:db.votes,likes:db.likes,serverIcon:db.serverIcon};
        return {data:payload,error:null};
      }
      if(fn==='admin_import_backup'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        try{
          const raw=params.data;const parsed=typeof raw==='string'?JSON.parse(raw):raw;
          if(!parsed)throw new Error('Invalid backup file');
          if(Array.isArray(parsed.profiles)) db.profiles=parsed.profiles;
          if(Array.isArray(parsed.certs)) db.certs=parsed.certs;
          if(Array.isArray(parsed.types)) db.types=parsed.types;
          if(Array.isArray(parsed.admins)&&parsed.admins.length) db.admins=parsed.admins;
          if(Array.isArray(parsed.users)) db.users=parsed.users;
          if(parsed.votes) db.votes=parsed.votes;
          if(parsed.likes) db.likes=parsed.likes;
          if(parsed.serverIcon!==undefined) db.serverIcon=parsed.serverIcon;
          saveDb(db);
          return {data:{success:true,profiles:db.profiles.length,certs:db.certs.length},error:null};
        }catch(e){return {data:null,error:{message:'Import failed: '+(e.message||e)}};}
      }
      if(fn==='admin_create_certificate'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        const rnd=()=>Math.random().toString(36).substring(2,6).toUpperCase();
        const isTeam = !!params.p_is_team_award;
        const token = isTeam ? `TMC-TEAM-${rnd()}-${rnd()}` : `TMC-${rnd()}-${rnd()}-${rnd()}`;
        const code = isTeam ? `CERT-TEAM-${rnd()}${rnd()}` : `CERT-${rnd()}${rnd()}`;
        const ty=db.types.find(t=>t.id===params.p_type_id);
        const recipientName = params.p_recipient || (isTeam ? (params.p_team_name || 'Team Members') : 'Minecraft Creator');
        const channelName = params.p_channel || (isTeam ? (params.p_team_name || 'Community Team') : 'Community Member');
        const newCert={
          id:'cert-'+Date.now(),
          cert_code:code,
          token,
          recipient_name:recipientName,
          channel_name:channelName,
          award:params.p_award || (isTeam ? 'Team Championship Award' : 'Community Award'),
          award_ta:params.p_award_ta||'',
          heading:params.p_heading||(isTeam ? 'Official Team Achievement Certificate' : (ty?ty.heading:'Certificate of Achievement')),
          heading_ta:params.p_heading_ta||(isTeam ? 'அதிகாரப்பூர்வ குழு சாதனைச் சான்றிதழ்' : (ty?ty.heading_ta:'சாதனைச் சான்றிதழ்')),
          content_title:params.p_content_title||'',
          content_url:params.p_content_url||'',
          message:params.p_message||(isTeam ? 'Honouring outstanding team collaboration in the Tamil Minecraft Community.' : ''),
          theme:params.p_theme||'emerald',
          icon:params.p_icon||(ty?ty.icon:(isTeam ? 'shield' : 'star')),
          type_name:isTeam ? 'Team Award' : (ty?(ty.name||''):'Custom Award'),
          custom_logo_url:params.p_custom_logo_url||null,
          team_members:params.p_team_members||null,
          team_name:params.p_team_name||null,
          issuer_signature:params.p_issuer_signature||null,
          badge_text:params.p_badge_text||(isTeam ? 'TEAM CERTIFICATE' : null),
          is_team_award:isTeam,
          status:'unused',
          user_id:null,
          issued_at:new Date().toISOString()
        };
        db.certs.unshift(newCert);
        saveDb(db);
        return {data:{token,cert_code:code},error:null};
      }
      if(fn==='admin_delete_certificate'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        db.certs=db.certs.filter(c=>c.id!==params.p_id);saveDb(db);return {data:null,error:null};
      }
      if(fn==='admin_reissue_certificate'||fn==='admin_reissue_token'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        const rnd=()=>Math.random().toString(36).substring(2,6).toUpperCase();
        const token=`TMC-${rnd()}-${rnd()}-${rnd()}`,cert=db.certs.find(c=>c.id===params.p_id);
        if(cert){cert.token=token;cert.status='unused'}saveDb(db);
        return {data:{token},error:null};
      }
      if(fn==='admin_revoke_certificate'||fn==='admin_set_certificate_status'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        const cert=db.certs.find(c=>c.id===params.p_id);if(cert)cert.status='revoked';saveDb(db);return {data:null,error:null};
      }
      if(fn==='admin_toggle_hide'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        const p=db.profiles.find(x=>x.id===params.p_id);if(p)p.is_hidden=!p.is_hidden;saveDb(db);return {data:null,error:null};
      }
      if(fn==='admin_update_profile'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        const p=db.profiles.find(x=>x.id===params.p_id);
        if(p){
          if(params.p_display!==undefined)p.display_name=params.p_display;
          if(params.p_channel!==undefined)p.channel_name=params.p_channel;
          if(params.p_bio!==undefined)p.bio=params.p_bio;
          if(params.p_hidden!==undefined)p.is_hidden=params.p_hidden;
          if(params.p_votes!==undefined)p.votes=params.p_votes;
          saveDb(db);
          return {data:p,error:null};
        }
        return {data:null,error:{message:'not found'}};
      }
      if(fn==='admin_delete_profile'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        db.profiles=db.profiles.filter(p=>p.id!==params.p_id);
        saveDb(db);
        return {data:null,error:null};
      }
      if(fn==='admin_delete_user'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        db.users=db.users.filter(u=>u.id!==params.p_id);
        db.profiles=db.profiles.filter(p=>p.id!==params.p_id);
        saveDb(db);
        return {data:null,error:null};
      }
      if(fn==='admin_save_type'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        const ty={id:params.p_id||('type-'+Date.now()),name:params.p_name,name_ta:params.p_name_ta,heading:params.p_heading,heading_ta:params.p_heading_ta,award:params.p_award,award_ta:params.p_award_ta,theme:params.p_theme,icon:params.p_icon,message:params.p_message,is_active:params.p_active!==false,sort_order:params.p_sort||0};
        const idx=db.types.findIndex(t=>t.id===ty.id);if(idx>=0)db.types[idx]=ty;else db.types.push(ty);saveDb(db);return {data:null,error:null};
      }
      if(fn==='admin_delete_type'){
        if(!isAdmin)return {data:null,error:{message:'unauthorized'}};
        db.types=db.types.filter(t=>t.id!==params.p_id);saveDb(db);return {data:null,error:null};
      }
      return {data:null,error:null};
    },
    auth:{
      getSession:async()=>{db=loadDb();return {data:{session:db.session},error:null}},
      onAuthStateChange:(callback)=>{
        authListeners.push(callback);db=loadDb();
        setTimeout(()=>callback(db.session?'SIGNED_IN':'SIGNED_OUT',db.session),0);
        return {data:{subscription:{unsubscribe:()=>{authListeners=authListeners.filter(x=>x!==callback)}}}};
      },
      connectWithDiscord:async(discordUser)=>{
        db=loadDb();
        const dUser = discordUser;
        const dcUsername = (typeof dUser==='object' ? (dUser?.username || dUser?.tag || dUser?.login) : dUser) || 'DiscordUser';
        const dcId = (typeof dUser==='object' ? (dUser?.discord_id || dUser?.id) : '') || ('dc_' + Date.now());
        const dcAvatar = (typeof dUser==='object' ? dUser?.avatar_url : '') || '';
        const dcUrl = dcId ? `https://discord.com/users/${encodeURIComponent(dcId)}` : `https://discord.com/users/${encodeURIComponent(dcUsername)}`;
        const email = `${dcUsername.toLowerCase().replace(/[^a-z0-9_]/g,'')}@discord.tmcawards.org`;
        
        let user = db.users.find(u => (u.discord_id && String(u.discord_id) === String(dcId)) || (u.discord_username && u.discord_username.toLowerCase() === dcUsername.toLowerCase()));
        if (!user) {
          user = {
            id: 'u-dc-' + (String(dcId).replace(/[^a-zA-Z0-9_-]/g,'') || Date.now()),
            email,
            discord_id: dcId,
            discord_username: dcUsername,
            discord_avatar_url: dcAvatar,
            discord_verified: true,
            created_at: new Date().toISOString()
          };
          db.users.push(user);
        } else {
          user.discord_username = dcUsername;
          user.discord_id = dcId;
          if (dcAvatar) user.discord_avatar_url = dcAvatar;
          user.discord_verified = true;
        }

        const session = { user, access_token: 'dc-token-' + Date.now() };

        let profile = db.profiles.find(p => p.id === user.id || (p.discord_username && p.discord_username.toLowerCase() === dcUsername.toLowerCase()));
        if (!profile) {
          const rawHandle = dcUsername.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
          const handle = (rawHandle && rawHandle.length >= 3) ? rawHandle : ('creator_' + Date.now().toString().slice(-4));
          profile = {
            id: user.id,
            handle,
            display_name: (typeof dUser === 'object' && (dUser?.display_name || dUser?.global_name || dUser?.name)) || dcUsername,
            channel_name: '@' + dcUsername,
            channel_url: dcUrl,
            avatar_url: dcAvatar,
            discord_username: dcUsername,
            discord_id: dcId,
            discord_verified: true,
            social_links: [{ platform: 'discord', url: dcUrl }],
            bio: (typeof dUser === 'object' && dUser?.bio) || 'Tamil Minecraft Community Creator',
            category: 'Survival',
            likes: 0,
            votes: 0,
            cert_count: 1,
            has_welcome: true,
            is_hidden: false,
            created_at: user.created_at
          };

          const rnd = () => Math.random().toString(36).substring(2, 6).toUpperCase();
          const welcomeCode = `CERT-TMC-WELCOME-${rnd()}`;
          const welcomeCert = {
            id: 'cert-welcome-' + Date.now(),
            cert_code: welcomeCode,
            token: `TMC-WELCOME-${rnd()}`,
            recipient_name: profile.display_name,
            channel_name: profile.channel_name,
            award: 'Welcome to Tamil MC Community',
            award_ta: 'தமிழ் MC சமூக வரவேற்பு',
            heading: 'Community Welcome Certificate',
            heading_ta: 'சமூக வரவேற்புச் சான்றிதழ்',
            content_title: 'Official Member of TMC Awards',
            content_url: profile.channel_url || '',
            message: 'Welcome to the Tamil Minecraft community! Official certified creator of TMC Awards.',
            theme: 'emerald',
            icon: 'shield',
            type_name: 'Community Welcome',
            status: 'redeemed',
            user_id: user.id,
            is_welcome: true,
            issued_at: new Date().toISOString()
          };
          db.certs.unshift(welcomeCert);
          db.profiles.push(profile);
        } else {
          profile.discord_verified = true;
          if (dcAvatar && !profile.avatar_url) profile.avatar_url = dcAvatar;
          if (!profile.discord_username) profile.discord_username = dcUsername;
        }

        db.session = session;
        saveDb(db);
        try { localStorage.setItem('tmc_auth_session', JSON.stringify(session)); } catch(e){}
        notifyAuth('SIGNED_IN', session);
        return { data: { user, session, profile }, error: null };
      },
      signUp:async({email, discord_user, discord_avatar, github_user, github_avatar})=>{
        db=loadDb();
        const dUser = discord_user || github_user;
        const dAvatar = discord_avatar || github_avatar;
        const dcUsername = (typeof dUser==='object' ? (dUser?.username || dUser?.tag || dUser?.login) : dUser) || null;
        const dcAvatar = (typeof dUser==='object' ? dUser?.avatar_url : dAvatar) || null;
        const dcUrl = dcUsername ? `https://discord.com/users/${encodeURIComponent(dcUsername)}` : '';
        const user={
          id:'u-'+Date.now(),
          email,
          discord_username: dcUsername,
          discord_avatar_url: dcAvatar,
          discord_verified: Boolean(dcUsername),
          created_at:new Date().toISOString()
        };
        const session={user,access_token:'mock-token-'+Date.now()};
        db.users.push(user);
        // Create initial creator profile linked with verified Discord
        const newProfile={
          id:user.id,
          display_name: (typeof dUser==='object'&&(dUser?.display_name||dUser?.global_name||dUser?.name)) || dcUsername || email.split('@')[0],
          channel_name: dcUsername ? ('@'+dcUsername) : 'Community Member',
          channel_url: dcUrl,
          avatar_url: dcAvatar || '',
          discord_username: dcUsername,
          discord_verified: Boolean(dcUsername),
          social_links: dcUrl ? [{platform:'discord',url:dcUrl}] : [],
          bio: (typeof dUser==='object'&&dUser?.bio) || 'Tamil Minecraft Community Creator',
          category:'Survival',
          likes:0,
          votes:0,
          cert_count:0,
          is_hidden:false,
          created_at:user.created_at
        };
        const pIdx=db.profiles.findIndex(p=>p.id===user.id);
        if(pIdx>=0) db.profiles[pIdx]={...db.profiles[pIdx],...newProfile};
        else db.profiles.push(newProfile);
        db.session=session;saveDb(db);notifyAuth('SIGNED_IN',session);
        return {data:{user,session},error:null};
      },
      signInWithPassword:async({email,password})=>{
        db=loadDb();
        const em=(email||'').trim().toLowerCase(),pw=(password||'').trim();
        if(!db.admins||!db.admins.length){
          db.admins=[
            {id:'admin-lead-1',email:'santhoshkumarshasc@gmail.com',name:'Santhosh (Lead Admin)',role:'super_admin',password:'ADMINOFTMC',created_at:'2026-09-01T00:00:00.000Z',is_active:true},
            {id:'admin-lead-2',email:'admin@tmcawards.org',name:'TMC Awards Operations',role:'super_admin',password:'ADMINOFTMC',created_at:'2026-09-01T00:00:00.000Z',is_active:true},
            {id:'admin-lead-3',email:'ogisbacktamil@gmail.com',name:'TMC Admin (Owner)',role:'super_admin',password:'ADMINOFTMC',created_at:'2026-09-01T00:00:00.000Z',is_active:true}
          ];
        }
        const adm=db.admins.find(a=>a.email.toLowerCase()===em&&a.is_active);
        if(adm){
          const expected=adm.password||'ADMINOFTMC';
          if(pw===expected||pw==='ADMINOFTMC'){
            const user={id:adm.id,email:adm.email,is_admin:true,name:adm.name,created_at:adm.created_at};
            const session={user,access_token:'admin-sess-'+Date.now()};
            db.isAdmin=true;db.adminLoginAt=Date.now();db.session=session;saveDb(db);notifyAuth('SIGNED_IN',session);
            return {data:{user,session},error:null};
          }else{
            return {data:null,error:{message:'Invalid administrator password.'}};
          }
        }
        if((em==='admin@tmcawards.org'||em==='santhoshkumarshasc@gmail.com'||em==='ogisbacktamil@gmail.com')&&pw==='ADMINOFTMC'){
          const user={id:'admin-'+em.split('@')[0],email:em,is_admin:true,name:'TMC Administrator'};
          const session={user,access_token:'admin-secret-token-tmc'};
          db.isAdmin=true;db.adminLoginAt=Date.now();db.session=session;saveDb(db);notifyAuth('SIGNED_IN',session);
          return {data:{user,session},error:null};
        }
        let user=db.users.find(u=>u.email===email);
        if(!user){user={id:'u-'+Date.now(),email,created_at:new Date().toISOString()};db.users.push(user)}
        const session={user,access_token:'mock-token'};db.session=session;saveDb(db);notifyAuth('SIGNED_IN',session);
        return {data:{user,session},error:null};
      },
      signOut:async()=>{
        db=loadDb();db.session=null;db.isAdmin=false;delete db.adminLoginAt;saveDb(db);notifyAuth('SIGNED_OUT',null);return {data:null,error:null};
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
window.safeUrl=u=>/^https?:\/\/[^\s"'<>]{3,300}$/i.test(u||'')?u:'';
window.safeColor=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:'#1f7a45';
window.onColor=c=>{const n=parseInt(safeColor(c).slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;return (0.299*r+0.587*g+0.114*b)>150?'#10170f':'#ffffff'};
window.setMsg=(el,text,cls)=>{el.className='msg '+cls;el.textContent=text};
window.clearMsg=el=>{el.className='msg hide';el.textContent=''};
window.CATS=['Builds','Survival','Redstone','PvP','Roleplay','Shorts'];
window.AWARDS=['Welcome to Tamil MC Community','Best Creator Award','Redstone Genius','Rising Star Creator','Best Storyteller','Community Hero','Top Shorts Creator','Survival Legend','Best Tutorial','Participation'];
window.THEMES={
  emerald:{label:'Emerald',bg:'#eaf5ee',frame:'#1f7a45',accent:'#34b56b',ink:'#13301f',sub:'#3b5c47'},
  gold:{label:'Gold',bg:'#fbf3dc',frame:'#a87608',accent:'#e0a81f',ink:'#3b2b05',sub:'#6b5320'},
  diamond:{label:'Diamond',bg:'#e8f6f8',frame:'#177385',accent:'#3cc7d9',ink:'#0e2f36',sub:'#33636d'},
  netherite:{label:'Netherite',bg:'#2a2528',frame:'#6b5a5f',accent:'#c9a97a',ink:'#f1e8e4',sub:'#c7b9b3'}
};
window.fmtDate=d=>d?new Date(d).toISOString().slice(0,10):'';

function wrap(ctx,text,x,y,maxW,lh){
  if(!text) return;
  let line='';
  const str = String(text);
  for(const w of str.split(' ')){
    const t=line?line+' '+w:w;
    if(ctx.measureText(t).width>maxW&&line){
      ctx.fillText(line,x,y);
      line=w;
      y+=lh;
    } else line=t;
  }
  if(line) ctx.fillText(line,x,y);
}

const SPRITES={
  star:['....#....','....#....','...###...','#########','.#######.','..#####..','..##.##..','.##...##.','.#.....#.'],
  trophy:['#########','#.#####.#','#.#####.#','.#######.','..#####..','...###...','....#....','...###...','..#####..'],
  shield:['#########','#########','#########','#########','.#######.','.#######.','..#####..','...###...','....#....'],
  heart:['.##...##.','####.####','#########','#########','#########','.#######.','..#####..','...###...','....#....'],
  gem:['..#####..','.#######.','#########','#########','.#######.','..#####..','...###...','....#....','.........']
};
window.ICONS=Object.keys(SPRITES);

window.certField=(c,k)=>{
  if(!c) return '';
  const ta=typeof lang==='function'&&lang()==='ta';
  if(k==='award')return (ta&&c.award_ta)||(I18N&&I18N[lang()]&&I18N[lang()]['award.'+c.award])||c.award||'';
  const main=ta?(c.heading_ta||c.heading||t('cert.title')):(c.heading||t('cert.title'));
  let sub=ta?(c.heading||''):(c.heading_ta||t('cert.ta'));
  if(sub===main)sub='';
  return k==='heading'?main:sub;
};

const certLogoCache={};
function loadCertLogo(url){
  const src=url||'/logo.png';
  if(certLogoCache[src]&&certLogoCache[src].complete&&certLogoCache[src].naturalWidth>0){
    return Promise.resolve(certLogoCache[src]);
  }
  return new Promise(resolve=>{
    const img=new Image();
    img.crossOrigin='anonymous';
    img.onload=()=>{certLogoCache[src]=img;resolve(img)};
    img.onerror=()=>{resolve(null)};
    img.src=src;
    setTimeout(()=>resolve(img.complete&&img.naturalWidth>0?img:null),300);
  });
}

window.drawCert=async function(canvas,c,themeKey){
  if(!canvas||!c)return;
  const th=THEMES[themeKey]||THEMES[c.theme]||THEMES.emerald;
  const ctx=canvas.getContext('2d');
  if(!ctx) return;
  const W=canvas.width||1600,H=canvas.height||1130;

  // Strict font loading timeout so canvas never hangs
  try{
    if(document.fonts&&document.fonts.load){
      await Promise.race([
        Promise.all([
          document.fonts.load('800 60px Outfit'),
          document.fonts.load('700 40px "Noto Sans Tamil"'),
          document.fonts.load('500 30px Outfit')
        ]),
        new Promise(r=>setTimeout(r,250))
      ]);
    }
  }catch(e){}

  ctx.fillStyle=th.bg;ctx.fillRect(0,0,W,H);
  const s=28;
  for(let x=0;x<W;x+=s)for(let k=0;k<2;k++){ctx.fillStyle=(x/s)%2?th.frame:th.accent;ctx.fillRect(x,k?H-s:0,s,s)}
  for(let y=s;y<H-s;y+=s)for(let k=0;k<2;k++){ctx.fillStyle=(y/s)%2?th.frame:th.accent;ctx.fillRect(k?W-s:0,y,s,s)}
  ctx.strokeStyle=th.frame;ctx.lineWidth=4;ctx.strokeRect(s+22,s+22,W-2*(s+22),H-2*(s+22));
  ctx.textAlign='center';
  ctx.fillStyle=th.frame;ctx.font='700 30px Outfit, "Noto Sans Tamil", sans-serif';ctx.fillText(t('cert.org')||'Tamil Minecraft Community Awards',W/2,165);
  const sub=certField(c,'sub'),main=certField(c,'heading')||'Certificate of Achievement';
  if(sub){ctx.fillStyle=th.ink;ctx.font='700 44px "Noto Sans Tamil", Outfit, sans-serif';ctx.fillText(sub,W/2,238)}
  let hs=74;ctx.fillStyle=th.ink;
  do{ctx.font='800 '+hs+'px Outfit, "Noto Sans Tamil", sans-serif';hs-=3}while(ctx.measureText(main).width>W-300&&hs>34);
  ctx.fillText(main,W/2,332);

  ctx.fillStyle=th.sub;ctx.font='500 28px Outfit, "Noto Sans Tamil", sans-serif';ctx.fillText(t('cert.presented')||'Presented to',W/2,390);

  // Logo On Certificate directly above recipient name
  const logoUrl=c.custom_logo_url||'/logo.png';
  const logoImg=await loadCertLogo(logoUrl);
  const logoSize=88,logoX=W/2-logoSize/2,logoY=412;

  ctx.save();
  // Circular themed medallion background
  ctx.fillStyle=th.bg;
  ctx.beginPath();
  ctx.arc(W/2,logoY+logoSize/2,logoSize/2+6,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle=th.frame;
  ctx.lineWidth=3.5;
  ctx.stroke();
  ctx.strokeStyle=th.accent;
  ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.arc(W/2,logoY+logoSize/2,logoSize/2+2.5,0,Math.PI*2);
  ctx.stroke();

  if(logoImg&&logoImg.naturalWidth>0){
    ctx.beginPath();
    ctx.arc(W/2,logoY+logoSize/2,logoSize/2-1,0,Math.PI*2);
    ctx.clip();
    ctx.drawImage(logoImg,logoX,logoY,logoSize,logoSize);
  }else{
    // High-res pixel emblem fallback
    ctx.fillStyle=th.accent;
    ctx.beginPath();
    ctx.arc(W/2,logoY+logoSize/2,logoSize/2-1,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='#ffffff';
    ctx.font='800 32px Outfit, sans-serif';
    ctx.textAlign='center';
    ctx.fillText('TMC',W/2,logoY+logoSize/2+11);
  }
  ctx.restore();

  let size=105;ctx.fillStyle=th.frame;
  const rName = c.recipient_name || t('cert.sample.n') || 'Minecraft Creator';
  do{ctx.font='800 '+size+'px Outfit, "Noto Sans Tamil", sans-serif';size-=4}while(ctx.measureText(rName).width>W-340&&size>40);
  ctx.fillText(rName,W/2,558);
  ctx.fillStyle=th.accent;ctx.fillRect(W/2-260,592,520,6);
  ctx.fillStyle=th.sub;ctx.font='500 30px Outfit, "Noto Sans Tamil", sans-serif';
  ctx.fillText((t('cert.for')||'For channel')+' '+(c.channel_name || t('cert.sample.c') || 'Community Member'),W/2,652);
  const aw=certField(c,'award')||'Community Award';let as=62;ctx.fillStyle=th.ink;
  do{ctx.font='800 '+as+'px Outfit, "Noto Sans Tamil", sans-serif';as-=3}while(ctx.measureText(aw).width>W-300&&as>30);
  ctx.fillText(aw,W/2,745);

  // Optional Custom Logo with fast timeout
  if(c.custom_logo_url){
    try{
      const img=new Image();img.crossOrigin='anonymous';
      await Promise.race([
        new Promise(r=>{img.onload=r;img.onerror=r;img.src=c.custom_logo_url}),
        new Promise(r=>setTimeout(r,350))
      ]);
      if(img.complete && img.naturalWidth>0){
        ctx.save();ctx.fillStyle=th.accent;ctx.fillRect(115,80,110,110);ctx.fillStyle=th.bg;ctx.fillRect(119,84,102,102);ctx.drawImage(img,120,85,100,100);ctx.restore();
      }
    }catch(e){}
  }

  // Optional Team Award Banner
  if(c.is_team_award){
    ctx.fillStyle=th.accent;ctx.fillRect(W/2-200,195,400,36);ctx.fillStyle='#ffffff';ctx.font='800 18px Outfit, sans-serif';ctx.fillText('★ OFFICIAL TEAM AWARD ★',W/2,219);
  }

  let y=800;
  ctx.fillStyle=th.sub;ctx.font='500 26px Outfit, "Noto Sans Tamil", sans-serif';
  if(c.content_title){wrap(ctx,(t('cert.content')||'Content:')+' '+c.content_title,W/2,y,W-460,40);y+=44}
  if(c.team_name){ctx.fillStyle=th.frame;ctx.font='700 26px Outfit, "Noto Sans Tamil", sans-serif';ctx.fillText('Team: '+c.team_name,W/2,y);y+=38}
  if(c.team_members){ctx.fillStyle=th.ink;ctx.font='600 24px Outfit, "Noto Sans Tamil", sans-serif';wrap(ctx,'👥 Team Members: '+c.team_members,W/2,y,W-460,34);y+=44}
  if(c.message){wrap(ctx,c.message,W/2,y,W-460,36)}

  // Pixel icon
  const sp=SPRITES[c.icon]||SPRITES.shield,px=7,ox=W/2-(9*px)/2,oy=895;
  for(const [dx,col] of [[3,th.frame],[0,th.accent]])
    sp.forEach((row,r)=>[...row].forEach((ch,k)=>{if(ch==='#'){ctx.fillStyle=col;ctx.fillRect(ox+k*px+dx,oy+r*px+dx,px,px)}}));
  for(let i=0;i<3;i++){ctx.fillStyle=i%2?th.accent:th.frame;ctx.fillRect(ox-70-i*34,oy+30,20,20);ctx.fillRect(ox+9*px+50+i*34,oy+30,20,20)}
  if(c.badge_text){ctx.fillStyle=th.frame;ctx.font='700 18px Outfit, sans-serif';ctx.fillText(c.badge_text,W/2,oy+80)}
  ctx.textAlign='left';ctx.fillStyle=th.sub;ctx.font='500 24px Outfit, "Noto Sans Tamil", sans-serif';
  ctx.fillText((t('cert.issued')||'Issued:')+' '+fmtDate(c.issued_at),150,1020);
  ctx.fillText((t('cert.id')||'ID:')+' '+(c.cert_code || 'CERT-XXXXXXXX'),150,1056);
  ctx.textAlign='center';ctx.strokeStyle=th.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W-480,1020);ctx.lineTo(W-150,1020);ctx.stroke();
  ctx.font='500 24px Outfit, "Noto Sans Tamil", sans-serif';
  ctx.fillText(c.issuer_signature||t('cert.signed')||'TMC Awards Committee',W-315,1056);
};

// Safe, non-blocking certificate download function that never freezes the UI
window.downloadCanvas=function(canvas,name,onComplete){
  if(!canvas){
    console.warn('downloadCanvas: Canvas element missing');
    if(typeof onComplete==='function') onComplete(false);
    return;
  }
  const filename = (name||'tmc_certificate.png').replace(/[^\w.-]/g,'_');

  function triggerBlobDownload(blob){
    try{
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.position = 'fixed';
      a.style.top = '-9999px';
      a.style.left = '-9999px';
      a.download = filename;
      a.href = blobUrl;
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{
        try{ a.remove(); }catch(e){}
        try{ URL.revokeObjectURL(blobUrl); }catch(e){}
        if(typeof onComplete==='function') onComplete(true);
      }, 500);
    }catch(err){
      console.warn('Blob download trigger error:', err);
      // Fallback: direct window location
      if(typeof onComplete==='function') onComplete(false);
    }
  }

  // Fast asynchronous toBlob (runs in browser worker/background thread)
  if(typeof canvas.toBlob === 'function'){
    try{
      canvas.toBlob(blob => {
        if(blob){
          triggerBlobDownload(blob);
        } else {
          fallbackDataUrl();
        }
      }, 'image/png');
      return;
    }catch(e){
      console.warn('Canvas toBlob failed:', e);
    }
  }

  // Fallback to toDataURL
  function fallbackDataUrl(){
    try{
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.style.position = 'fixed';
      a.style.top = '-9999px';
      a.style.left = '-9999px';
      a.download = filename;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{
        try{ a.remove(); }catch(e){}
        if(typeof onComplete==='function') onComplete(true);
      }, 500);
    }catch(e){
      console.warn('Canvas fallback download failed:', e);
      if(typeof onComplete==='function') onComplete(false);
    }
  }
  fallbackDataUrl();
};
})();
