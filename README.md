# Tamil Minecraft Creators Showcase

Creators sign up, build and publish their own profile instantly (no review). The admin creates
certificates, generates one-time redeem tokens, and manages every account from a separate admin page.

## Files
- `public/index.html` + `app.js`: public site, creator accounts, profile customiser, redeem and verify
- `public/i18n.js`: all English and Tamil text (edit here to change wording)
- `public/fx.js` + `styles.css`: animations and the dark neon look (all motion turns off for people who prefer reduced motion)
- `public/admin.html` + `admin.js`: separate admin page (sign in + authenticator code)
- `supabase.sql`: database, access rules, and secure functions
- `vercel.json`: security headers (CSP, HSTS, no framing)

## Setup (about 15 minutes)
1. Create a free project at supabase.com.
2. SQL Editor > paste all of `supabase.sql` > Run.
3. Authentication settings:
   - Sign In / Providers > Email: turn on **Confirm email**, set minimum password length to **10**.
   - Attack Protection: turn on **CAPTCHA** (Cloudflare Turnstile or hCaptcha) for sign-ups and sign-ins.
   - Multi-Factor: make sure **TOTP** is enabled.
   - URL Configuration: set Site URL to your Vercel domain.
4. Settings > API: copy the **Project URL** and **anon public** key into `public/config.js`.
   Never use the `service_role` key anywhere in this project.
5. Push this folder to GitHub and import it in Vercel (no build command; output folder `public`).
6. Open your site, create an account with your own email, confirm it.
7. In Supabase SQL Editor run (use your email):
   `insert into public.admins(user_id) select id from auth.users where email = 'you@example.com';`
8. Open `/admin.html`, sign in, scan the QR code with an authenticator app. From then on every admin
   sign-in needs the 6-digit code.

## Certificate types
Admin page > **Certificate types**: create as many types as you like (Winner, Participation, Appreciation, Rising Star...).
Each type sets the heading, default award, style, pixel icon and message, in English and Tamil. When you create a
certificate you pick a type, and can still change the award, style or message for that one certificate.
Issued certificates keep their own copy, so editing or deleting a type never changes them. Five starter types are
added by `supabase.sql`.

## How security works
- **Database rules, not hiding pages.** Every table has Row Level Security. Creators can only read and
  edit their own profile, and cannot touch `is_hidden`, `likes` or any certificate field.
- **Admin needs MFA.** Admin functions check the admin list AND an authenticator-verified session.
  A stolen password alone cannot create or delete anything.
- **Tokens are hashed.** Only a SHA-256 hash is stored. The real token is shown once at creation;
  use Re-issue if it is lost. A leaked database does not leak usable tokens.
- **Token guessing is blocked.** Redeeming needs a signed-in account, and 5 wrong tries locks that
  account for an hour. Each token works once.
- **Public Certificate ID is separate from the secret token.** Anyone can verify an ID, but it cannot
  be used to claim a certificate.
- **Safe output.** All user text is escaped, links must be `https://`, colours are validated, and the
  CSP blocks inline scripts.
- **Admin session** signs out after 15 minutes of inactivity.

## Good habits
- Self-host the Supabase script (download into `public/`) if you want zero third-party scripts.
- Rename `admin.html` to something less guessable. It is protected anyway, this just reduces noise.
- Turn on Supabase backups and keep at least two admins listed so you cannot lock yourself out.
