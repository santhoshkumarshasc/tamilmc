(function(){
'use strict';
const I18N={
en:{
'doc.title':'Tamil Minecraft Creators Showcase',
'nav.showcase':'Showcase','nav.profile':'My profile','nav.verify':'Verify',
'auth.in':'Sign in','auth.out':'Sign out','auth.up':'Create account',
'hero.tag':'Tamil Minecraft creators','hero.t1':'Your Tamil Minecraft channel,','hero.t2':'your own profile',
'hero.p':'Create an account, design your public profile, and appear in the showcase right away. Win an award and claim your certificate with a token.',
'hero.cta1':'Create my profile','hero.cta1b':'Edit my profile','hero.cta2':'Browse creators',
'stat.creators':'Creators','stat.certs':'Certificates claimed',
'show.h':'Creator showcase','show.p':'Open a card to see the full profile. Sign in to like your favourites.','show.search':'Search creators','all':'All',
'cat.Builds':'Builds','cat.Survival':'Survival','cat.Redstone':'Redstone','cat.PvP':'PvP','cat.Roleplay':'Roleplay','cat.Shorts':'Shorts',
'empty.grid':'No creators here yet. Create your profile to be the first.',
'dash.h':'My profile','dash.p':'Changes go live as soon as you save. No review needed.',
'f.handle':'Handle (cannot change later)','f.name':'Your name','f.channel':'Channel name','f.url':'Channel link','f.cat':'Content type',
'f.bio':'About you','f.bio.ph':'Tell viewers what you make','f.icon':'Icon','f.accent':'Accent colour','f.custom':'Custom colour','f.style':'Card style',
'style.raised':'Glass','style.flat':'Solid','style.outline':'Neon outline','f.links':'Links (up to 4)','f.label':'Label',
'f.public':'Show my profile in the showcase','f.save':'Save profile','f.delete':'Delete account','f.preview':'Live preview',
'claim.h':'Claim a certificate','claim.token':'Token from the admin','claim.btn':'Redeem token',
'certs.h':'My certificates','certs.style':'Style','certs.dl':'Download PNG','certs.prev':'Preview','certs.none':'No certificates yet. Redeem a token above when you receive one.',
'theme.emerald':'Emerald','theme.gold':'Gold','theme.diamond':'Diamond','theme.netherite':'Netherite',
'ver.h':'Verify a certificate','ver.p':'Enter the Certificate ID printed on a certificate to check that it is genuine.','ver.id':'Certificate ID','ver.btn':'Verify',
'a.email':'Email','a.pass':'Password (10+ characters)','a.forgot':'Forgot password','a.close':'Close',
'foot':'Made by the Tamil Minecraft community. Fan project, not affiliated with Mojang or Microsoft.',
'p.visit':'Visit channel','p.by':'by','p.cert':'Certified',
'm.name2':'Add your name and channel name (at least 2 characters).','m.url':'The channel link must start with https://',
'm.link':'Each extra link needs a label and an address starting with https://','m.handle':'Handle: 3 to 24 characters, lowercase letters, numbers, and underscores.',
'm.saved':'Saved. Your profile is live.','m.save_err':'Could not save. Check your details and try again.','m.taken':'That handle is taken. Try another.',
'm.del_confirm':'Delete your account and profile permanently? Certificates you redeemed will stay verifiable.','m.del_err':'Could not delete the account. Try again.',
'm.token':'Enter the token the admin sent you.','m.tok_bad':'This token is not valid or was already used. Check it and try again.',
'm.locked':'Too many wrong attempts. Try again in an hour.','m.signin':'Sign in first.','m.redeemed':'Redeemed. Your certificate is ready below.','m.wrong':'Something went wrong. Try again.',
'm.v_enter':'Enter a Certificate ID.','m.v_err':'Could not check right now. Try again.','m.v_none':'No claimed certificate found with this ID.',
'm.v_revoked':'This certificate was revoked by the admin.','m.v_ok':'Genuine. Issued to {n} for {a}.',
'm.a_email':'Enter a valid email address.','m.a_pass':'Use a password with at least 10 characters.','m.a_up_ok':'Check your email and confirm your address, then sign in.',
'm.a_up_err':'Could not create the account. Try a different email or a stronger password.','m.a_in_err':'Email or password is incorrect, or the email is not confirmed yet.',
'm.reset_ok':'If that email has an account, a reset link is on its way.','m.reset_email':'Enter your email first.',
'cert.org':'TAMIL MINECRAFT CREATORS SHOWCASE','cert.ta':'சிறப்புச் சான்றிதழ்','cert.title':'Certificate of Achievement','cert.presented':'This certificate is proudly presented to',
'cert.for':'for outstanding work with the channel','cert.content':'Content:','cert.issued':'Issued:','cert.id':'Certificate ID:','cert.signed':'Showcase Admin',
'cert.sample.n':'Your Name','cert.sample.c':'Your Channel','cert.sample.a':'Best Builder','cert.sample.m':'Redeem a token to see your real certificate.',
'award.Best Builder':'Best Builder','award.Redstone Genius':'Redstone Genius','award.Rising Star':'Rising Star','award.Best Storyteller':'Best Storyteller','award.Community Hero':'Community Hero','award.Top Shorts Creator':'Top Shorts Creator','award.Survival Legend':'Survival Legend','award.Best Tutorial':'Best Tutorial','award.Participation':'Participation',
/* admin */
'ad.title':'Showcase admin','ad.signin':'Admin sign in','ad.continue':'Continue','ad.fail':'Sign in failed. Check your details.','ad.mfa.h':'Two-step check',
'ad.mfa.scan':'Scan this code with an authenticator app (Google Authenticator, Authy, 1Password), then enter the 6-digit code.','ad.mfa.manual':'Or enter this key manually:',
'ad.code':'6-digit code','ad.verify':'Verify','ad.mfa.bad':'That code is not correct. Try again.','ad.mfa.fmt':'Enter the 6-digit code.','ad.mfa.start':'Could not start two-step setup. Try again.',
'ad.tab.certs':'Certificates','ad.tab.creators':'Creators','ad.create':'Create certificate','ad.pick':'Pick a creator (optional)','ad.manual':'Type details manually',
'ad.cname':'Name on certificate','ad.cchannel':'Channel name','ad.award':'Award','ad.custom':'Or custom award','ad.custom.ph':'Leave empty to use the list',
'ad.ctitle':'Content title (optional)','ad.curl':'Content link (optional)','ad.cmsg':'Message (optional)','ad.ctheme':'Certificate style','ad.make':'Generate token',
'ad.once':'Shown once. Copy it now and send it to the creator. If lost, use Re-issue in the table.','ad.copy':'Copy token','ad.copied':'Token copied.','ad.copyfail':'Copy failed. Select the token and copy it manually.',
'ad.dlprev':'Download preview PNG','ad.all':'All certificates','ad.th.id':'ID','ad.th.rec':'Recipient','ad.th.award':'Award','ad.th.status':'Status','ad.th.by':'Claimed by',
'st.unused':'unused','st.redeemed':'redeemed','st.revoked':'revoked',
'ad.prev':'Preview','ad.reissue':'Re-issue','ad.revoke':'Revoke','ad.delete':'Delete','ad.nocerts':'No certificates yet.',
'ad.fields':'Add the creator name and channel name.','ad.urlbad':'The content link must start with https://','ad.createfail':'Could not create the certificate. Check the fields and your session.',
'ad.created':'Created. Certificate ID: {c}','ad.reissued':'New token created. The old one no longer works.','ad.reissuefail':'Could not re-issue this token.',
'ad.confirm.revoke':'Revoke this certificate? The token stops working.','ad.confirm.delete':'Delete this certificate permanently?',
'ad.accounts':'Creator accounts','ad.edit':'Edit','ad.hide':'Hide','ad.unhide':'Unhide','ad.hiddenby':'Hidden by admin','ad.public':'Public','ad.private':'Private','ad.likes':'likes',
'ad.nousers':'No creator accounts yet.','ad.confirm.user':'Delete {n} and their account permanently?','ad.edit.h':'Edit creator','ad.name':'Name','ad.chan':'Channel','ad.bio':'Bio',
'ad.hidecheck':'Hide from the public showcase','ad.save':'Save changes','ad.savefail':'Could not save. Check the fields.','ad.sample.n':'Creator Name','ad.sample.c':'Channel','ad.sample.a':'Award',
'ad.tab.types':'Certificate types','ad.type':'Certificate type','ad.type.custom':'No type (custom)','ad.award_ta':'Award in Tamil (optional)',
'ad.types.h':'Certificate types','ad.types.p':'Create the kinds of certificates you give out. Each type sets the heading, default award, style and icon.',
'ad.type.new':'New type','ad.type.edit':'Edit type','ad.type.name':'Type name','ad.type.name_ta':'Type name in Tamil (optional)','ad.type.heading':'Heading on certificate','ad.type.heading_ta':'Heading in Tamil (optional)',
'ad.type.award':'Default award','ad.type.award_ta':'Default award in Tamil (optional)','ad.type.theme':'Default style','ad.type.icon':'Icon','ad.type.msg':'Default message (optional)',
'ad.type.active':'Active (shown when creating certificates)','ad.type.save':'Save type','ad.type.saved':'Type saved.','ad.type.err':'Could not save the type. Check the fields (names must be unique).',
'ad.type.confirm':'Delete the type {n}? Certificates already issued keep their own copy.','ad.type.none':'No types yet. Create one to get started.','ad.type.off':'inactive',
'icon.star':'Star','icon.trophy':'Trophy','icon.shield':'Shield','icon.heart':'Heart','icon.gem':'Gem','ad.th.type':'Type'

},
ta:{
'doc.title':'தமிழ் மைன்கிராஃப்ட் படைப்பாளர் காட்சியகம்',
'nav.showcase':'படைப்பாளர்கள்','nav.profile':'என் சுயவிவரம்','nav.verify':'சரிபார்',
'auth.in':'உள்நுழை','auth.out':'வெளியேறு','auth.up':'கணக்கு உருவாக்கு',
'hero.tag':'தமிழ் மைன்கிராஃப்ட் படைப்பாளர்கள்','hero.t1':'உங்கள் தமிழ் மைன்கிராஃப்ட் சேனல்,','hero.t2':'உங்களுக்கே உரிய சுயவிவரம்',
'hero.p':'கணக்கை உருவாக்கி, உங்கள் பொது சுயவிவரத்தை வடிவமைத்து, உடனே காட்சியகத்தில் இடம்பெறுங்கள். விருது வென்றால் டோக்கன் மூலம் சான்றிதழைப் பெறுங்கள்.',
'hero.cta1':'என் சுயவிவரத்தை உருவாக்கு','hero.cta1b':'என் சுயவிவரத்தைத் திருத்து','hero.cta2':'படைப்பாளர்களைப் பார்',
'stat.creators':'படைப்பாளர்கள்','stat.certs':'பெற்ற சான்றிதழ்கள்',
'show.h':'படைப்பாளர் காட்சியகம்','show.p':'முழு சுயவிவரத்தைக் காண அட்டையைத் திறக்கவும். பிடித்தவற்றை விரும்ப உள்நுழையவும்.','show.search':'படைப்பாளர்களைத் தேடு','all':'அனைத்தும்',
'cat.Builds':'கட்டுமானம்','cat.Survival':'சர்வைவல்','cat.Redstone':'ரெட்ஸ்டோன்','cat.PvP':'PvP','cat.Roleplay':'ரோல்பிளே','cat.Shorts':'ஷார்ட்ஸ்',
'empty.grid':'இங்கே இன்னும் படைப்பாளர்கள் இல்லை. உங்கள் சுயவிவரத்தை உருவாக்கி முதலாவதாக இருங்கள்.',
'dash.h':'என் சுயவிவரம்','dash.p':'சேமித்தவுடன் மாற்றங்கள் உடனே வெளியாகும். மறுஆய்வு தேவையில்லை.',
'f.handle':'பயனர் பெயர் (பின்னர் மாற்ற முடியாது)','f.name':'உங்கள் பெயர்','f.channel':'சேனல் பெயர்','f.url':'சேனல் இணைப்பு','f.cat':'உள்ளடக்க வகை',
'f.bio':'உங்களைப் பற்றி','f.bio.ph':'நீங்கள் என்ன உருவாக்குகிறீர்கள் என்று சொல்லுங்கள்','f.icon':'சின்னம்','f.accent':'முதன்மை நிறம்','f.custom':'விருப்ப நிறம்','f.style':'அட்டை பாணி',
'style.raised':'கண்ணாடி','style.flat':'திட நிறம்','style.outline':'நியான் விளிம்பு','f.links':'இணைப்புகள் (அதிகபட்சம் 4)','f.label':'பெயர்',
'f.public':'என் சுயவிவரத்தை காட்சியகத்தில் காட்டு','f.save':'சுயவிவரத்தைச் சேமி','f.delete':'கணக்கை நீக்கு','f.preview':'நேரடி முன்னோட்டம்',
'claim.h':'சான்றிதழைப் பெறுங்கள்','claim.token':'நிர்வாகி வழங்கிய டோக்கன்','claim.btn':'டோக்கனைப் பயன்படுத்து',
'certs.h':'என் சான்றிதழ்கள்','certs.style':'பாணி','certs.dl':'PNG பதிவிறக்கு','certs.prev':'முன்னோட்டம்','certs.none':'இன்னும் சான்றிதழ்கள் இல்லை. டோக்கன் கிடைத்ததும் மேலே பயன்படுத்துங்கள்.',
'theme.emerald':'மரகதம்','theme.gold':'தங்கம்','theme.diamond':'வைரம்','theme.netherite':'நெதரைட்',
'ver.h':'சான்றிதழைச் சரிபார்','ver.p':'சான்றிதழில் அச்சிடப்பட்ட அடையாள எண்ணை உள்ளிட்டு, அது உண்மையானதா எனப் பாருங்கள்.','ver.id':'சான்றிதழ் அடையாள எண்','ver.btn':'சரிபார்',
'a.email':'மின்னஞ்சல்','a.pass':'கடவுச்சொல் (குறைந்தது 10 எழுத்துகள்)','a.forgot':'கடவுச்சொல் மறந்துவிட்டதா','a.close':'மூடு',
'foot':'தமிழ் மைன்கிராஃப்ட் சமூகத்தால் உருவாக்கப்பட்டது. இது ரசிகர் திட்டம்; Mojang அல்லது Microsoft உடன் தொடர்புடையது அல்ல.',
'p.visit':'சேனலைப் பார்','p.by':'படைப்பாளர்:','p.cert':'சான்றிதழ் பெற்றவர்',
'm.name2':'உங்கள் பெயரையும் சேனல் பெயரையும் உள்ளிடுங்கள் (குறைந்தது 2 எழுத்துகள்).','m.url':'சேனல் இணைப்பு https:// என்று தொடங்க வேண்டும்.',
'm.link':'ஒவ்வொரு கூடுதல் இணைப்புக்கும் பெயரும், https:// என்று தொடங்கும் முகவரியும் தேவை.','m.handle':'பயனர் பெயர்: 3 முதல் 24 எழுத்துகள்; சிறிய ஆங்கில எழுத்துகள், எண்கள், அடிக்கோடு மட்டும்.',
'm.saved':'சேமிக்கப்பட்டது. உங்கள் சுயவிவரம் இப்போது நேரலையில் உள்ளது.','m.save_err':'சேமிக்க முடியவில்லை. விவரங்களைச் சரிபார்த்து மீண்டும் முயலுங்கள்.','m.taken':'இந்தப் பயனர் பெயர் ஏற்கனவே உள்ளது. வேறு ஒன்றை முயலுங்கள்.',
'm.del_confirm':'உங்கள் கணக்கையும் சுயவிவரத்தையும் நிரந்தரமாக நீக்கவா? நீங்கள் பெற்ற சான்றிதழ்கள் தொடர்ந்து சரிபார்க்கக்கூடியவையாக இருக்கும்.','m.del_err':'கணக்கை நீக்க முடியவில்லை. மீண்டும் முயலுங்கள்.',
'm.token':'நிர்வாகி அனுப்பிய டோக்கனை உள்ளிடுங்கள்.','m.tok_bad':'இந்த டோக்கன் செல்லாதது அல்லது ஏற்கனவே பயன்படுத்தப்பட்டது. சரிபார்த்து மீண்டும் முயலுங்கள்.',
'm.locked':'பலமுறை தவறாக முயன்றுவிட்டீர்கள். ஒரு மணி நேரம் கழித்து முயலுங்கள்.','m.signin':'முதலில் உள்நுழையுங்கள்.','m.redeemed':'டோக்கன் ஏற்கப்பட்டது. உங்கள் சான்றிதழ் கீழே தயாராக உள்ளது.','m.wrong':'ஏதோ தவறு நடந்தது. மீண்டும் முயலுங்கள்.',
'm.v_enter':'சான்றிதழ் அடையாள எண்ணை உள்ளிடுங்கள்.','m.v_err':'இப்போது சரிபார்க்க முடியவில்லை. மீண்டும் முயலுங்கள்.','m.v_none':'இந்த எண்ணுடன் பெறப்பட்ட சான்றிதழ் எதுவும் இல்லை.',
'm.v_revoked':'இந்தச் சான்றிதழை நிர்வாகி ரத்து செய்துள்ளார்.','m.v_ok':'உண்மையானது. {n} அவர்களுக்கு {a} விருதுக்காக வழங்கப்பட்டது.',
'm.a_email':'சரியான மின்னஞ்சல் முகவரியை உள்ளிடுங்கள்.','m.a_pass':'குறைந்தது 10 எழுத்துகள் கொண்ட கடவுச்சொல்லைப் பயன்படுத்துங்கள்.','m.a_up_ok':'உங்கள் மின்னஞ்சலைச் சரிபார்த்து முகவரியை உறுதிசெய்து, பிறகு உள்நுழையுங்கள்.',
'm.a_up_err':'கணக்கை உருவாக்க முடியவில்லை. வேறு மின்னஞ்சல் அல்லது வலுவான கடவுச்சொல்லை முயலுங்கள்.','m.a_in_err':'மின்னஞ்சல் அல்லது கடவுச்சொல் தவறு, அல்லது மின்னஞ்சல் இன்னும் உறுதிசெய்யப்படவில்லை.',
'm.reset_ok':'அந்த மின்னஞ்சலுக்குக் கணக்கு இருந்தால், மீட்டமைப்பு இணைப்பு அனுப்பப்படும்.','m.reset_email':'முதலில் உங்கள் மின்னஞ்சலை உள்ளிடுங்கள்.',
'cert.org':'தமிழ் மைன்கிராஃப்ட் படைப்பாளர் காட்சியகம்','cert.ta':'சிறப்புச் சான்றிதழ்','cert.title':'சாதனைச் சான்றிதழ்','cert.presented':'இந்தச் சான்றிதழ் பெருமையுடன் வழங்கப்படுகிறது',
'cert.for':'சிறப்பான பணிக்காக, சேனல்','cert.content':'உள்ளடக்கம்:','cert.issued':'வழங்கிய நாள்:','cert.id':'சான்றிதழ் எண்:','cert.signed':'காட்சியக நிர்வாகி',
'cert.sample.n':'உங்கள் பெயர்','cert.sample.c':'உங்கள் சேனல்','cert.sample.a':'சிறந்த கட்டுநர்','cert.sample.m':'உங்கள் உண்மையான சான்றிதழைக் காண டோக்கனைப் பயன்படுத்துங்கள்.',
'award.Best Builder':'சிறந்த கட்டுநர்','award.Redstone Genius':'ரெட்ஸ்டோன் மேதை','award.Rising Star':'வளரும் நட்சத்திரம்','award.Best Storyteller':'சிறந்த கதை சொல்லி','award.Community Hero':'சமூக நாயகன்','award.Top Shorts Creator':'சிறந்த ஷார்ட்ஸ் படைப்பாளர்','award.Survival Legend':'சர்வைவல் புராணம்','award.Best Tutorial':'சிறந்த பயிற்சி வீடியோ','award.Participation':'பங்கேற்பு',
'ad.title':'காட்சியக நிர்வாகம்','ad.signin':'நிர்வாகி உள்நுழைவு','ad.continue':'தொடர்','ad.fail':'உள்நுழைய முடியவில்லை. விவரங்களைச் சரிபார்க்கவும்.','ad.mfa.h':'இரண்டு-படி சரிபார்ப்பு',
'ad.mfa.scan':'இந்தக் குறியீட்டை அங்கீகார செயலியில் (Google Authenticator, Authy, 1Password) ஸ்கேன் செய்து, 6 இலக்கக் குறியீட்டை உள்ளிடுங்கள்.','ad.mfa.manual':'அல்லது இந்த விசையை கைமுறையாக உள்ளிடுங்கள்:',
'ad.code':'6 இலக்கக் குறியீடு','ad.verify':'சரிபார்','ad.mfa.bad':'அந்தக் குறியீடு சரியல்ல. மீண்டும் முயலுங்கள்.','ad.mfa.fmt':'6 இலக்கக் குறியீட்டை உள்ளிடுங்கள்.','ad.mfa.start':'இரண்டு-படி அமைப்பைத் தொடங்க முடியவில்லை. மீண்டும் முயலுங்கள்.',
'ad.tab.certs':'சான்றிதழ்கள்','ad.tab.creators':'படைப்பாளர்கள்','ad.create':'சான்றிதழ் உருவாக்கு','ad.pick':'படைப்பாளரைத் தேர்ந்தெடு (விருப்பம்)','ad.manual':'விவரங்களை கைமுறையாக உள்ளிடு',
'ad.cname':'சான்றிதழில் உள்ள பெயர்','ad.cchannel':'சேனல் பெயர்','ad.award':'விருது','ad.custom':'அல்லது தனிப்பயன் விருது','ad.custom.ph':'பட்டியலைப் பயன்படுத்த காலியாக விடுங்கள்',
'ad.ctitle':'உள்ளடக்கத் தலைப்பு (விருப்பம்)','ad.curl':'உள்ளடக்க இணைப்பு (விருப்பம்)','ad.cmsg':'செய்தி (விருப்பம்)','ad.ctheme':'சான்றிதழ் பாணி','ad.make':'டோக்கன் உருவாக்கு',
'ad.once':'ஒருமுறை மட்டுமே காட்டப்படும். இப்போதே நகலெடுத்து படைப்பாளருக்கு அனுப்புங்கள். தொலைந்தால் அட்டவணையில் "மீண்டும் வழங்கு" பயன்படுத்துங்கள்.','ad.copy':'டோக்கனை நகலெடு','ad.copied':'டோக்கன் நகலெடுக்கப்பட்டது.','ad.copyfail':'நகலெடுக்க முடியவில்லை. டோக்கனைத் தேர்ந்து கைமுறையாக நகலெடுக்கவும்.',
'ad.dlprev':'முன்னோட்ட PNG பதிவிறக்கு','ad.all':'அனைத்து சான்றிதழ்கள்','ad.th.id':'எண்','ad.th.rec':'பெறுநர்','ad.th.award':'விருது','ad.th.status':'நிலை','ad.th.by':'பெற்றவர்',
'st.unused':'பயன்படுத்தப்படவில்லை','st.redeemed':'பெறப்பட்டது','st.revoked':'ரத்து',
'ad.prev':'முன்னோட்டம்','ad.reissue':'மீண்டும் வழங்கு','ad.revoke':'ரத்து செய்','ad.delete':'நீக்கு','ad.nocerts':'இன்னும் சான்றிதழ்கள் இல்லை.',
'ad.fields':'படைப்பாளர் பெயரையும் சேனல் பெயரையும் சேர்க்கவும்.','ad.urlbad':'உள்ளடக்க இணைப்பு https:// என்று தொடங்க வேண்டும்.','ad.createfail':'சான்றிதழை உருவாக்க முடியவில்லை. புலங்களையும் உங்கள் அமர்வையும் சரிபார்க்கவும்.',
'ad.created':'உருவாக்கப்பட்டது. சான்றிதழ் எண்: {c}','ad.reissued':'புதிய டோக்கன் உருவாக்கப்பட்டது. பழையது இனி வேலை செய்யாது.','ad.reissuefail':'இந்த டோக்கனை மீண்டும் வழங்க முடியவில்லை.',
'ad.confirm.revoke':'இந்தச் சான்றிதழை ரத்து செய்யவா? டோக்கன் வேலை செய்யாது.','ad.confirm.delete':'இந்தச் சான்றிதழை நிரந்தரமாக நீக்கவா?',
'ad.accounts':'படைப்பாளர் கணக்குகள்','ad.edit':'திருத்து','ad.hide':'மறை','ad.unhide':'காட்டு','ad.hiddenby':'நிர்வாகியால் மறைக்கப்பட்டது','ad.public':'பொது','ad.private':'தனிப்பட்டது','ad.likes':'விருப்பங்கள்',
'ad.nousers':'இன்னும் படைப்பாளர் கணக்குகள் இல்லை.','ad.confirm.user':'{n} மற்றும் அவர்களின் கணக்கை நிரந்தரமாக நீக்கவா?','ad.edit.h':'படைப்பாளரைத் திருத்து','ad.name':'பெயர்','ad.chan':'சேனல்','ad.bio':'அறிமுகம்',
'ad.hidecheck':'பொது காட்சியகத்திலிருந்து மறை','ad.save':'மாற்றங்களைச் சேமி','ad.savefail':'சேமிக்க முடியவில்லை. புலங்களைச் சரிபார்க்கவும்.','ad.sample.n':'படைப்பாளர் பெயர்','ad.sample.c':'சேனல்','ad.sample.a':'விருது',
'ad.tab.types':'சான்றிதழ் வகைகள்','ad.type':'சான்றிதழ் வகை','ad.type.custom':'வகை இல்லை (தனிப்பயன்)','ad.award_ta':'தமிழில் விருது (விருப்பம்)',
'ad.types.h':'சான்றிதழ் வகைகள்','ad.types.p':'நீங்கள் வழங்கும் சான்றிதழ் வகைகளை உருவாக்குங்கள். ஒவ்வொரு வகையும் தலைப்பு, இயல்பு விருது, பாணி, சின்னம் ஆகியவற்றை அமைக்கும்.',
'ad.type.new':'புதிய வகை','ad.type.edit':'வகையைத் திருத்து','ad.type.name':'வகையின் பெயர்','ad.type.name_ta':'தமிழில் வகையின் பெயர் (விருப்பம்)','ad.type.heading':'சான்றிதழில் உள்ள தலைப்பு','ad.type.heading_ta':'தமிழில் தலைப்பு (விருப்பம்)',
'ad.type.award':'இயல்பு விருது','ad.type.award_ta':'தமிழில் இயல்பு விருது (விருப்பம்)','ad.type.theme':'இயல்பு பாணி','ad.type.icon':'சின்னம்','ad.type.msg':'இயல்பு செய்தி (விருப்பம்)',
'ad.type.active':'செயலில் (சான்றிதழ் உருவாக்கும்போது காட்டப்படும்)','ad.type.save':'வகையைச் சேமி','ad.type.saved':'வகை சேமிக்கப்பட்டது.','ad.type.err':'வகையைச் சேமிக்க முடியவில்லை. புலங்களைச் சரிபார்க்கவும் (பெயர்கள் தனித்துவமாக இருக்க வேண்டும்).',
'ad.type.confirm':'{n} வகையை நீக்கவா? ஏற்கனவே வழங்கிய சான்றிதழ்கள் தங்கள் சொந்த நகலை வைத்திருக்கும்.','ad.type.none':'இன்னும் வகைகள் இல்லை. தொடங்க ஒன்றை உருவாக்குங்கள்.','ad.type.off':'செயலில் இல்லை',
'icon.star':'நட்சத்திரம்','icon.trophy':'கோப்பை','icon.shield':'கேடயம்','icon.heart':'இதயம்','icon.gem':'ரத்தினம்','ad.th.type':'வகை'

}};
let LANG='en';
try{const s=localStorage.getItem('tmc_lang');LANG=s||((navigator.language||'').toLowerCase().startsWith('ta')?'ta':'en')}catch(e){}
window.I18N=I18N;
window.lang=()=>LANG;
window.t=(k,v)=>{let s=(I18N[LANG]&&I18N[LANG][k])||I18N.en[k]||k;if(v)for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s};
function apply(){
  document.documentElement.lang=LANG;
  document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));
  document.querySelectorAll('[data-i18n-ph]').forEach(e=>e.placeholder=t(e.dataset.i18nPh));
  document.querySelectorAll('[data-i18n-label]').forEach(e=>e.setAttribute('aria-label',t(e.dataset.i18nLabel)));
  document.title=t(document.body.dataset.title||'doc.title');
  const b=document.getElementById('langBtn');if(b)b.textContent=LANG==='en'?'தமிழ்':'EN';
}
window.applyLang=apply;
window.setLang=l=>{LANG=l;try{localStorage.setItem('tmc_lang',l)}catch(e){}apply();document.dispatchEvent(new Event('langchange'))};
document.addEventListener('DOMContentLoaded',()=>{
  const b=document.getElementById('langBtn');if(b)b.onclick=()=>setLang(LANG==='en'?'ta':'en');
  apply();
});
})();
