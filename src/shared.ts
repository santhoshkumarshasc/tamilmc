/**
 * TMC Awards - Shared Client Data Layer & Canvas Graphics
 * Handles local database, voting system (1 person = 1 vote),
 * admin data reset, certificate canvas generation, and auth.
 */

import {
  CreatorProfile,
  Certificate,
  CertificateType,
  UserAccount,
  AdminUser,
  AuthSession,
  DatabaseState,
  AdminResetDataResult,
  CertTheme
} from './types.js';

export const STORAGE_KEY = 'tmc_live_db_v4';

export const INITIAL_SEED_ADMINS: AdminUser[] = [
  {
    id: 'admin-lead-0',
    email: 'gitsmesk@gmail.com',
    name: 'SK (Lead Admin)',
    role: 'super_admin',
    password: 'ADMINOFTMC',
    created_at: '2026-09-01T00:00:00.000Z',
    created_by: 'system',
    notes: 'Super Administrator Account',
    is_active: true
  },
  {
    id: 'admin-lead-1',
    email: 'santhoshkumarshasc@gmail.com',
    name: 'Santhosh (Lead Admin)',
    role: 'super_admin',
    password: 'ADMINOFTMC',
    created_at: '2026-09-01T00:00:00.000Z',
    created_by: 'system',
    notes: 'Primary Community Administrator',
    is_active: true
  },
  {
    id: 'admin-lead-2',
    email: 'admin@tmcawards.org',
    name: 'TMC Awards Operations',
    role: 'super_admin',
    password: 'ADMINOFTMC',
    created_at: '2026-09-01T00:00:00.000Z',
    created_by: 'system',
    notes: 'Main Community Operations Account',
    is_active: true
  },
  {
    id: 'admin-lead-3',
    email: 'ogisbacktamil@gmail.com',
    name: 'TMC Admin (Owner)',
    role: 'super_admin',
    password: 'ADMINOFTMC',
    created_at: '2026-09-01T00:00:00.000Z',
    created_by: 'system',
    notes: 'Owner Administrator Account',
    is_active: true
  },
  {
    id: 'admin-lead-4',
    email: 'rtmgamertamil@gmail.com',
    name: 'RTM Gamer (Owner)',
    role: 'super_admin',
    password: 'ADMINOFTMC',
    created_at: '2026-09-01T00:00:00.000Z',
    created_by: 'system',
    notes: 'Owner Administrator Account',
    is_active: true
  }
];

export const DEFAULT_TYPES: CertificateType[] = [
  {
    id: 'type-welcome',
    name: 'Welcome Member',
    name_ta: 'வரவேற்பு உறுப்பினர்',
    heading: 'Community Welcome Certificate',
    heading_ta: 'சமூக வரவேற்புச் சான்றிதழ்',
    award: 'Welcome to Tamil MC Community',
    award_ta: 'தமிழ் MC சமூக வரவேற்பு',
    theme: 'emerald',
    icon: 'shield',
    message: 'Welcome to the Tamil Minecraft community! Official certified creator of TMC Awards.',
    is_active: true,
    sort_order: 0
  },
  {
    id: 'type-1',
    name: 'Achievement',
    name_ta: 'சாதனை',
    heading: 'Certificate of Achievement',
    heading_ta: 'சாதனைச் சான்றிதழ்',
    award: 'Outstanding Creator',
    award_ta: 'சிறந்த படைப்பாளர்',
    theme: 'emerald',
    icon: 'star',
    message: 'Honouring outstanding creativity in Tamil Minecraft builds and videos.',
    is_active: true,
    sort_order: 1
  },
  {
    id: 'type-2',
    name: 'Winner',
    name_ta: 'வெற்றியாளர்',
    heading: 'Certificate of Victory',
    heading_ta: 'வெற்றிச் சான்றிதழ்',
    award: 'Best Creator Award',
    award_ta: 'சிறந்த படைப்பாளர் விருது',
    theme: 'gold',
    icon: 'trophy',
    message: 'Winner of the TMC Awards Best Creator community poll.',
    is_active: true,
    sort_order: 2
  },
  {
    id: 'type-3',
    name: 'Participation',
    name_ta: 'பங்கேற்பு',
    heading: 'Certificate of Participation',
    heading_ta: 'பங்கேற்புச் சான்றிதழ்',
    award: 'Active Participant',
    award_ta: 'சிறந்த பங்கேற்பாளர்',
    theme: 'diamond',
    icon: 'shield',
    message: 'For active participation in the Tamil Minecraft Community Event.',
    is_active: true,
    sort_order: 3
  },
  {
    id: 'type-4',
    name: 'Appreciation',
    name_ta: 'பாராட்டு',
    heading: 'Certificate of Appreciation',
    heading_ta: 'பாராட்டுச் சான்றிதழ்',
    award: 'Valued Contributor',
    award_ta: 'மதிப்புமிக்க பங்களிப்பாளர்',
    theme: 'netherite',
    icon: 'heart',
    message: 'In recognition of outstanding dedication and leadership in the community.',
    is_active: true,
    sort_order: 4
  },
  {
    id: 'type-5',
    name: 'Rising Star',
    name_ta: 'வளரும் நட்சத்திரம்',
    heading: 'Rising Star Certificate',
    heading_ta: 'வளரும் நட்சத்திரச் சான்றிதழ்',
    award: 'Rising Star Creator',
    award_ta: 'வளரும் நட்சத்திரப் படைப்பாளர்',
    theme: 'emerald',
    icon: 'gem',
    message: 'Recognising one of the most promising new Tamil Minecraft creators.',
    is_active: true,
    sort_order: 5
  }
];

export const INITIAL_SEED_PROFILES: CreatorProfile[] = [];

export function createInitialSeedCerts(): Certificate[] {
  return [];
}

export function createFallbackClient() {
  function loadDb(): DatabaseState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure default profiles exist if empty
        if (!parsed.profiles) parsed.profiles = [];
        parsed.profiles = parsed.profiles.filter((p: any) =>
          !p.id.startsWith('creator-santhosh') &&
          !p.id.startsWith('creator-dravid') &&
          !p.id.startsWith('creator-kavi') &&
          !p.id.startsWith('creator-arun') &&
          !p.id.startsWith('mock-') &&
          p.id !== 'creator-sample'
        );
        if (!parsed.certs) parsed.certs = [];
        parsed.certs = parsed.certs.filter((c: any) => !c.id.startsWith('cert-starter-') && !c.id.startsWith('cert-mock-'));
        if (!parsed.users) parsed.users = [];
        parsed.users = parsed.users.filter((u: any) => u && !u.id.startsWith('mock-') && !u.id.startsWith('user-mock') && u.email !== 'creator@example.com' && !u.id.startsWith('creator-'));
        if (!parsed.types || parsed.types.length === 0) {
          parsed.types = JSON.parse(JSON.stringify(DEFAULT_TYPES));
        }
        if (!parsed.admins || parsed.admins.length === 0) {
          parsed.admins = JSON.parse(JSON.stringify(INITIAL_SEED_ADMINS));
        }
        if (!parsed.votes) parsed.votes = {};
        if (!parsed.likes) parsed.likes = {};
        if (!parsed.announcements) parsed.announcements = [];
        saveDb(parsed);
        return parsed;
      }
    } catch (e) {}

    const init: DatabaseState = {
      users: [],
      admins: JSON.parse(JSON.stringify(INITIAL_SEED_ADMINS)),
      profiles: JSON.parse(JSON.stringify(INITIAL_SEED_PROFILES)),
      certs: createInitialSeedCerts(),
      types: JSON.parse(JSON.stringify(DEFAULT_TYPES)),
      likes: {},
      votes: {},
      session: null,
      isAdmin: false,
      serverIcon: null
    };
    saveDb(init);
    return init;
  }

  function saveDb(data: DatabaseState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('tmc:dbchange', { detail: data }));
    } catch (e) {}
  }

  let db: DatabaseState = loadDb();
  let authListeners: Array<(event: string, session: AuthSession | null) => void> = [];

  function notifyAuth(event: string, session: AuthSession | null): void {
    authListeners.forEach(cb => {
      try {
        cb(event, session);
      } catch (e) {
        console.error(e);
      }
    });
  }

  return {
    from: (table: string) => ({
      select: (_cols?: string) => {
        db = loadDb();
        const rows = table === 'public_profiles'
          ? db.profiles.filter(p => p.is_public && !p.is_hidden)
          : [...db.profiles];
        return {
          order: (col: keyof CreatorProfile, opts?: { ascending?: boolean }) => ({
            limit: async (n: number) => {
              const sorted = [...rows].sort((a, b) => {
                const aVal = (a[col] as number) || 0;
                const bVal = (b[col] as number) || 0;
                return opts && opts.ascending ? aVal - bVal : bVal - aVal;
              });
              return { data: sorted.slice(0, n), error: null };
            }
          }),
          eq: (col: keyof CreatorProfile, val: any) => ({
            maybeSingle: async () => {
              db = loadDb();
              const found = db.profiles.find(p => String(p[col]) === String(val));
              return { data: found || null, error: null };
            }
          })
        };
      },
      insert: async (record: Partial<CreatorProfile> & { handle: string; id: string }) => {
        db = loadDb();
        const existing = db.profiles.find(p => p.handle === record.handle && p.id !== record.id);
        if (existing) {
          return { data: null, error: { code: '23505', message: 'Handle already taken' } };
        }

        const rnd = () => Math.random().toString(36).substring(2, 6).toUpperCase();
        const welcomeCode = `CERT-TMC-WELCOME-${rnd()}`;
        const welcomeCert: Certificate = {
          id: 'cert-welcome-' + Date.now(),
          cert_code: welcomeCode,
          token: `TMC-WELCOME-${rnd()}`,
          recipient_name: record.display_name || 'Minecraft Creator',
          channel_name: record.channel_name || 'Community Member',
          award: 'Welcome to Tamil MC Community',
          award_ta: 'தமிழ் MC சமூக வரவேற்பு',
          heading: 'Community Welcome Certificate',
          heading_ta: 'சமூக வரவேற்புச் சான்றிதழ்',
          content_title: 'Official Member of TMC Awards',
          content_url: record.channel_url || '',
          message: 'Welcome to the Tamil Minecraft community! Official certified creator of TMC Awards.',
          theme: 'emerald',
          icon: 'shield',
          type_name: 'Community Welcome',
          status: 'redeemed',
          user_id: record.id,
          is_welcome: true,
          issued_at: new Date().toISOString()
        };

        const existingWelcome = db.certs.find(c => c.user_id === record.id && c.is_welcome);
        if (!existingWelcome) {
          db.certs.unshift(welcomeCert);
          record.cert_count = (record.cert_count || 0) + 1;
          record.has_welcome = true;
        }

        const idx = db.profiles.findIndex(p => p.id === record.id);
        const fullRecord: CreatorProfile = {
          id: record.id,
          handle: record.handle,
          display_name: record.display_name || 'Creator',
          channel_name: record.channel_name || 'My Channel',
          channel_url: record.channel_url || '',
          bio: record.bio || '',
          avatar_image: record.avatar_image || '',
          avatar_url: record.avatar_url || '',
          accent: record.accent || '#1f7a45',
          card_style: record.card_style || 'raised',
          socials: record.socials || {},
          custom_links: record.custom_links || [],
          is_public: record.is_public !== false,
          is_hidden: false,
          likes: record.likes || 0,
          votes: record.votes || 0,
          cert_count: record.cert_count || 1,
          has_welcome: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (idx >= 0) db.profiles[idx] = { ...db.profiles[idx], ...fullRecord };
        else db.profiles.push(fullRecord);

        saveDb(db);
        return { data: fullRecord, welcomeCert, error: null };
      },
      update: (data: Partial<CreatorProfile>) => ({
        eq: async (col: keyof CreatorProfile, val: any) => {
          db = loadDb();
          const idx = db.profiles.findIndex(p => String(p[col]) === String(val));
          if (idx >= 0) {
            db.profiles[idx] = { ...db.profiles[idx], ...data, updated_at: new Date().toISOString() };
            saveDb(db);
            return { data: db.profiles[idx], error: null };
          }
          return { data: null, error: null };
        }
      })
    }),

    rpc: async (fn: string, params: any = {}) => {
      db = loadDb();

      // Likes
      if (fn === 'toggle_like') {
        const id = params.p_profile;
        const uid = db.session ? db.session.user.id : 'guest';
        if (!db.likes[uid]) db.likes[uid] = [];
        const idx = db.likes[uid].indexOf(id);
        const p = db.profiles.find(x => x.id === id);
        let liked = false;
        if (idx >= 0) {
          db.likes[uid].splice(idx, 1);
          if (p) p.likes = Math.max(0, (p.likes || 1) - 1);
        } else {
          db.likes[uid].push(id);
          if (p) p.likes = (p.likes || 0) + 1;
          liked = true;
        }
        saveDb(db);
        return { data: { likes: p ? p.likes : 0, liked }, error: null };
      }

      if (fn === 'my_likes') {
        const uid = db.session ? db.session.user.id : null;
        return { data: uid ? (db.likes[uid] || []) : [], error: null };
      }

      // 1 Person = 1 Vote system
      if (fn === 'vote_best_creator') {
        const targetId = params.p_profile;
        const voterId = db.session ? db.session.user.id : (params.p_voter_id || 'guest-voter');
        if (!db.votes) db.votes = {};
        const prevVote = db.votes[voterId];

        if (prevVote === targetId) {
          // Unvote
          delete db.votes[voterId];
          const p = db.profiles.find(x => x.id === targetId);
          if (p) p.votes = Math.max(0, (p.votes || 1) - 1);
          saveDb(db);
          return { data: { voted: false, votedId: null, votes: p ? p.votes : 0, prevVoteId: null }, error: null };
        }

        let oldVotes = 0;
        if (prevVote) {
          const oldP = db.profiles.find(x => x.id === prevVote);
          if (oldP) {
            oldP.votes = Math.max(0, (oldP.votes || 1) - 1);
            oldVotes = oldP.votes;
          }
        }

        db.votes[voterId] = targetId;
        const p = db.profiles.find(x => x.id === targetId);
        if (p) p.votes = (p.votes || 0) + 1;
        saveDb(db);
        return {
          data: {
            voted: true,
            votedId: targetId,
            votes: p ? p.votes : 0,
            prevVoteId: prevVote || null,
            oldVotes
          },
          error: null
        };
      }

      if (fn === 'get_my_vote') {
        const voterId = db.session ? db.session.user.id : (params.p_voter_id || 'guest-voter');
        return { data: (db.votes && db.votes[voterId]) || null, error: null };
      }

      // Server Icon
      if (fn === 'get_server_icon') {
        return { data: db.serverIcon || null, error: null };
      }
      if (fn === 'admin_set_server_icon') {
        db.serverIcon = params.icon || null;
        saveDb(db);
        return { data: db.serverIcon, error: null };
      }

      // My Certificates
      if (fn === 'my_certificates') {
        const uid = db.session ? db.session.user.id : null;
        return { data: uid ? db.certs.filter(c => c.user_id === uid) : [], error: null };
      }

      // Redeem Certificate
      if (fn === 'redeem_certificate') {
        const token = (params.p_token || '').trim();
        const cert = db.certs.find(c => c.token === token && c.status === 'unused');
        if (!cert) {
          return { data: null, error: { message: 'Invalid or already redeemed token.' } };
        }
        cert.status = 'redeemed';
        cert.user_id = db.session ? db.session.user.id : null;
        saveDb(db);
        return { data: cert, error: null };
      }

      // Check Certificate Validity
      if (fn === 'check_certificate') {
        const code = (params.p_code || '').trim();
        const cert = db.certs.find(c => c.cert_code.toLowerCase() === code.toLowerCase());
        if (!cert) return { data: null, error: { message: 'Certificate not found' } };
        return { data: cert, error: null };
      }

      // Admin Lists & Gate
      const isAdmin = db.isAdmin || (db.session && db.session.user && (db.session.user.is_admin || db.session.user.email === 'admin@tmcawards.org'));
      if (fn === 'admin_gate' || fn === 'is_admin') {
        return { data: isAdmin, error: null };
      }
      if (fn === 'admin_login_token') {
        const tk = (params.token || '').trim();
        if (tk === 'ADMINOFTMC') {
          const user: UserAccount = {
            id: 'admin-tmc',
            email: 'admin@tmcawards.org',
            is_admin: true,
            name: 'TMC Administrator',
            created_at: new Date().toISOString()
          };
          const session: AuthSession = { user, access_token: 'admin-secret-token-tmc' };
          db.isAdmin = true;
          db.adminLoginAt = Date.now();
          db.session = session;
          saveDb(db);
          notifyAuth('SIGNED_IN', session);
          return { data: { ok: true, session }, error: null };
        }
        return { data: { ok: false, error: 'Invalid secret token' }, error: null };
      }
      if (fn === 'get_active_announcement') {
        if (!db.announcements) db.announcements = [];
        const active = db.announcements.find(a => a.is_active);
        return { data: active || null, error: null };
      }
      if (fn === 'admin_list_announcements') {
        if (!isAdmin) return { data: null, error: { message: 'Unauthorized' } };
        if (!db.announcements) db.announcements = [];
        return { data: db.announcements, error: null };
      }
      if (fn === 'admin_save_announcement') {
        if (!isAdmin) return { data: null, error: { message: 'Unauthorized' } };
        if (!db.announcements) db.announcements = [];
        const title = (params.title || '').trim();
        const message = (params.message || '').trim();
        if (!title || !message) return { data: null, error: { message: 'Title and message are required' } };
        const id = params.id || ('announcement-' + Date.now());
        const existingIdx = db.announcements.findIndex(a => a.id === id);
        const item = {
          id,
          title,
          message,
          badge: (params.badge || 'ANNOUNCEMENT').trim(),
          badge_color: params.badge_color || 'emerald',
          link_url: (params.link_url || '').trim(),
          link_text: (params.link_text || '').trim(),
          is_active: params.is_active !== false,
          created_at: existingIdx >= 0 ? db.announcements[existingIdx].created_at : new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: db.session?.user?.name || db.session?.user?.email || 'Admin'
        };
        if (item.is_active) {
          db.announcements.forEach(a => { if (a.id !== id) a.is_active = false; });
        }
        if (existingIdx >= 0) {
          db.announcements[existingIdx] = item;
        } else {
          db.announcements.unshift(item);
        }
        saveDb(db);
        return { data: item, error: null };
      }
      if (fn === 'admin_delete_announcement') {
        if (!isAdmin) return { data: null, error: { message: 'Unauthorized' } };
        if (!db.announcements) db.announcements = [];
        db.announcements = db.announcements.filter(a => a.id !== params.p_id);
        saveDb(db);
        return { data: { success: true }, error: null };
      }
      if (fn === 'admin_list_profiles') return { data: db.profiles, error: null };
      if (fn === 'admin_list_certificates') return { data: db.certs, error: null };
      if (fn === 'admin_list_types') return { data: db.types, error: null };
      if (fn === 'admin_list_users') return { data: db.users, error: null };
      if (fn === 'admin_list_admins') {
        if (!db.admins || db.admins.length === 0) db.admins = JSON.parse(JSON.stringify(INITIAL_SEED_ADMINS));
        return { data: db.admins, error: null };
      }

      if (fn === 'admin_create_admin') {
        if (!isAdmin) return { data: null, error: { message: 'Unauthorized' } };
        const email = (params.email || '').trim().toLowerCase();
        const name = (params.name || '').trim();
        const role = params.role || 'moderator';
        const notes = (params.notes || '').trim();

        if (!email || !email.includes('@')) {
          return { data: null, error: { message: 'A valid email address is required' } };
        }
        if (!name || name.length < 2) {
          return { data: null, error: { message: 'Administrator full name is required (min 2 characters)' } };
        }

        if (!db.admins || db.admins.length === 0) db.admins = JSON.parse(JSON.stringify(INITIAL_SEED_ADMINS));
        const adminList: AdminUser[] = db.admins;
        if (adminList.some(a => a.email.toLowerCase() === email)) {
          return { data: null, error: { message: 'An administrator with this email already exists' } };
        }

        const newAdmin: AdminUser = {
          id: 'admin-' + Date.now(),
          email,
          name,
          role,
          notes,
          password: (params.password || 'ADMINOFTMC').trim(),
          created_at: new Date().toISOString(),
          created_by: db.session?.user?.email || 'Lead Administrator',
          is_active: true
        };

        adminList.unshift(newAdmin);
        db.admins = adminList;
        saveDb(db);
        return { data: newAdmin, error: null };
      }

      if (fn === 'admin_delete_admin') {
        if (!isAdmin) return { data: null, error: { message: 'Unauthorized' } };
        const targetId = params.p_id;
        if (!db.admins || db.admins.length === 0) db.admins = JSON.parse(JSON.stringify(INITIAL_SEED_ADMINS));
        const adminList: AdminUser[] = db.admins;
        const target = adminList.find(a => a.id === targetId || a.email === targetId);
        if (!target) return { data: null, error: { message: 'Administrator not found' } };

        const curEmail = db.session?.user?.email?.toLowerCase();
        if (curEmail && target.email.toLowerCase() === curEmail) {
          return { data: null, error: { message: 'Cannot remove your own active administrator account' } };
        }

        db.admins = adminList.filter(a => a.id !== target.id);
        saveDb(db);
        return { data: { success: true }, error: null };
      }

      // ==========================================
      // BACKUP & RESTORE RPCs (Data Persistence Guarantee)
      // ==========================================
      if (fn === 'admin_export_backup') {
        if (!isAdmin) return { data: null, error: { message: 'Unauthorized' } };
        const payload = {
          version: '1.0',
          exported_at: new Date().toISOString(),
          profiles: db.profiles,
          certs: db.certs,
          types: db.types,
          admins: db.admins,
          users: db.users,
          votes: db.votes,
          likes: db.likes,
          serverIcon: db.serverIcon
        };
        return { data: payload, error: null };
      }

      if (fn === 'admin_import_backup') {
        if (!isAdmin) return { data: null, error: { message: 'Unauthorized' } };
        try {
          const raw = params.data;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (!parsed) throw new Error('Empty or invalid backup payload');
          if (Array.isArray(parsed.profiles)) db.profiles = parsed.profiles;
          if (Array.isArray(parsed.certs)) db.certs = parsed.certs;
          if (Array.isArray(parsed.types)) db.types = parsed.types;
          if (Array.isArray(parsed.admins) && parsed.admins.length) db.admins = parsed.admins;
          if (Array.isArray(parsed.users)) db.users = parsed.users;
          if (parsed.votes) db.votes = parsed.votes;
          if (parsed.likes) db.likes = parsed.likes;
          if (parsed.serverIcon !== undefined) db.serverIcon = parsed.serverIcon;
          saveDb(db);
          return { data: { success: true, count: db.profiles.length, certs: db.certs.length }, error: null };
        } catch (e: any) {
          return { data: null, error: { message: e.message || 'Import failed' } };
        }
      }

      // ==========================================
      // RESET DATA RPC (Admin Dashboard Feature)
      // ==========================================
      if (fn === 'admin_reset_all_data') {
        if (!isAdmin) return { data: null, error: { message: 'Unauthorized. Admin token required.' } };

        const freshProfiles = JSON.parse(JSON.stringify(INITIAL_SEED_PROFILES));
        const freshCerts = createInitialSeedCerts();
        const freshTypes = JSON.parse(JSON.stringify(DEFAULT_TYPES));

        db.profiles = freshProfiles;
        db.certs = freshCerts;
        db.types = freshTypes;
        db.users = [];
        db.votes = {};
        db.likes = {};
        db.serverIcon = null;

        saveDb(db);

        const result: AdminResetDataResult = {
          success: true,
          profilesCount: db.profiles.length,
          certsCount: db.certs.length,
          message: 'All community profiles, certificates, votes, and accounts have been reset to verified factory defaults.',
          timestamp: new Date().toISOString()
        };

        return { data: result, error: null };
      }

      // Admin Certificate Creation (with optional Team and Custom Design fields)
      if (fn === 'admin_create_certificate') {
        if (!isAdmin) return { data: null, error: { message: 'unauthorized' } };
        const rnd = () => Math.random().toString(36).substring(2, 6).toUpperCase();
        const token = `TMC-${rnd()}-${rnd()}-${rnd()}`;
        const code = `CERT-${rnd()}${rnd()}`;
        const ty = db.types.find(t => t.id === params.p_type_id);
        const newCert: Certificate = {
          id: 'cert-' + Date.now(),
          cert_code: code,
          token,
          recipient_name: params.p_recipient,
          channel_name: params.p_channel,
          award: params.p_award,
          award_ta: params.p_award_ta || '',
          heading: params.p_heading || (ty ? ty.heading : 'Certificate of Achievement'),
          heading_ta: params.p_heading_ta || (ty ? ty.heading_ta : 'சாதனைச் சான்றிதழ்'),
          content_title: params.p_content_title || '',
          content_url: params.p_content_url || '',
          message: params.p_message || '',
          theme: (params.p_theme as CertTheme) || 'emerald',
          icon: params.p_icon || (ty ? ty.icon : 'star'),
          type_name: ty ? ty.name : 'Custom Award',
          custom_logo_url: params.p_custom_logo_url || null,
          team_members: params.p_team_members || null,
          team_name: params.p_team_name || null,
          issuer_signature: params.p_issuer_signature || null,
          badge_text: params.p_badge_text || null,
          is_team_award: !!params.p_is_team_award,
          status: 'unused',
          user_id: null,
          issued_at: new Date().toISOString()
        };
        db.certs.unshift(newCert);
        saveDb(db);
        return { data: { token, cert_code: code }, error: null };
      }

      if (fn === 'admin_delete_certificate') {
        if (!isAdmin) return { data: null, error: { message: 'unauthorized' } };
        db.certs = db.certs.filter(c => c.id !== params.p_id);
        saveDb(db);
        return { data: null, error: null };
      }

      if (fn === 'admin_reissue_certificate' || fn === 'admin_reissue_token') {
        if (!isAdmin) return { data: null, error: { message: 'unauthorized' } };
        const rnd = () => Math.random().toString(36).substring(2, 6).toUpperCase();
        const token = `TMC-${rnd()}-${rnd()}-${rnd()}`;
        const cert = db.certs.find(c => c.id === params.p_id);
        if (cert) {
          cert.token = token;
          cert.status = 'unused';
        }
        saveDb(db);
        return { data: { token }, error: null };
      }

      if (fn === 'admin_revoke_certificate' || fn === 'admin_set_certificate_status') {
        if (!isAdmin) return { data: null, error: { message: 'unauthorized' } };
        const cert = db.certs.find(c => c.id === params.p_id);
        if (cert) cert.status = 'revoked';
        saveDb(db);
        return { data: null, error: null };
      }

      if (fn === 'admin_toggle_hide') {
        if (!isAdmin) return { data: null, error: { message: 'unauthorized' } };
        const p = db.profiles.find(x => x.id === params.p_id);
        if (p) p.is_hidden = !p.is_hidden;
        saveDb(db);
        return { data: null, error: null };
      }

      if (fn === 'admin_update_profile') {
        if (!isAdmin) return { data: null, error: { message: 'unauthorized' } };
        const p = db.profiles.find(x => x.id === params.p_id);
        if (p) {
          if (params.p_display !== undefined) p.display_name = params.p_display;
          if (params.p_channel !== undefined) p.channel_name = params.p_channel;
          if (params.p_bio !== undefined) p.bio = params.p_bio;
          if (params.p_hidden !== undefined) p.is_hidden = params.p_hidden;
          if (params.p_votes !== undefined) p.votes = params.p_votes;
          saveDb(db);
          return { data: p, error: null };
        }
        return { data: null, error: { message: 'not found' } };
      }

      if (fn === 'admin_delete_profile') {
        if (!isAdmin) return { data: null, error: { message: 'unauthorized' } };
        db.profiles = db.profiles.filter(p => p.id !== params.p_id);
        saveDb(db);
        return { data: null, error: null };
      }

      if (fn === 'admin_delete_user') {
        if (!isAdmin) return { data: null, error: { message: 'unauthorized' } };
        db.users = db.users.filter(u => u.id !== params.p_id);
        db.profiles = db.profiles.filter(p => p.id !== params.p_id);
        saveDb(db);
        return { data: null, error: null };
      }

      if (fn === 'admin_save_type') {
        if (!isAdmin) return { data: null, error: { message: 'unauthorized' } };
        const ty: CertificateType = {
          id: params.p_id || ('type-' + Date.now()),
          name: params.p_name,
          name_ta: params.p_name_ta,
          heading: params.p_heading,
          heading_ta: params.p_heading_ta,
          award: params.p_award,
          award_ta: params.p_award_ta,
          theme: params.p_theme,
          icon: params.p_icon,
          message: params.p_message,
          is_active: params.p_active !== false,
          sort_order: params.p_sort || 0
        };
        const idx = db.types.findIndex(t => t.id === ty.id);
        if (idx >= 0) db.types[idx] = ty;
        else db.types.push(ty);
        saveDb(db);
        return { data: null, error: null };
      }

      if (fn === 'admin_delete_type') {
        if (!isAdmin) return { data: null, error: { message: 'unauthorized' } };
        db.types = db.types.filter(t => t.id !== params.p_id);
        saveDb(db);
        return { data: null, error: null };
      }

      return { data: null, error: null };
    },

    auth: {
      getSession: async () => {
        db = loadDb();
        return { data: { session: db.session }, error: null };
      },
      onAuthStateChange: (callback: (event: string, session: AuthSession | null) => void) => {
        authListeners.push(callback);
        db = loadDb();
        setTimeout(() => callback(db.session ? 'SIGNED_IN' : 'SIGNED_OUT', db.session), 0);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners = authListeners.filter(x => x !== callback);
              }
            }
          }
        };
      },
      signUp: async ({ email }: { email: string; password?: string }) => {
        db = loadDb();
        const user: UserAccount = { id: 'u-' + Date.now(), email, created_at: new Date().toISOString() };
        const session: AuthSession = { user, access_token: 'mock-token' };
        db.users.push(user);
        db.session = session;
        saveDb(db);
        notifyAuth('SIGNED_IN', session);
        return { data: { user, session }, error: null };
      },
      signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
        db = loadDb();
        const em = (email || '').trim().toLowerCase();
        const pw = (password || '').trim();

        // 1. Check registered administrators
        if (!db.admins || db.admins.length === 0) db.admins = JSON.parse(JSON.stringify(INITIAL_SEED_ADMINS));
        const adminMatch = db.admins.find(a => a.email.toLowerCase() === em && a.is_active);
        if (adminMatch) {
          const expectedPw = adminMatch.password || 'ADMINOFTMC';
          if (pw === expectedPw || pw === 'ADMINOFTMC') {
            const user: UserAccount = {
              id: adminMatch.id,
              email: adminMatch.email,
              is_admin: true,
              name: adminMatch.name,
              created_at: adminMatch.created_at
            };
            const session: AuthSession = { user, access_token: 'admin-sess-' + Date.now() };
            db.isAdmin = true;
            db.adminLoginAt = Date.now();
            db.session = session;
            saveDb(db);
            notifyAuth('SIGNED_IN', session);
            return { data: { user, session }, error: null };
          } else {
            return { data: null, error: { message: 'Invalid administrator password.' } };
          }
        }

        // 2. Default administrator accounts
        if (em === 'admin@tmcawards.org' || em === 'santhoshkumarshasc@gmail.com' || em === 'ogisbacktamil@gmail.com') {
          if (pw === 'ADMINOFTMC') {
            const user: UserAccount = {
              id: 'admin-' + em.split('@')[0],
              email: em,
              is_admin: true,
              name: 'TMC Administrator',
              created_at: new Date().toISOString()
            };
            const session: AuthSession = { user, access_token: 'admin-sess-' + Date.now() };
            db.isAdmin = true;
            db.adminLoginAt = Date.now();
            db.session = session;
            saveDb(db);
            notifyAuth('SIGNED_IN', session);
            return { data: { user, session }, error: null };
          }
        }

        let user = db.users.find(u => u.email === email);
        if (!user) {
          user = { id: 'u-' + Date.now(), email, created_at: new Date().toISOString() };
          db.users.push(user);
        }
        const session: AuthSession = { user, access_token: 'mock-token' };
        db.session = session;
        saveDb(db);
        notifyAuth('SIGNED_IN', session);
        return { data: { user, session }, error: null };
      },
      connectWithDiscord: async (discordUser: any) => {
        db = loadDb();
        const dUser = discordUser;
        const dcUsername = (typeof dUser === 'object' ? (dUser?.username || dUser?.tag || dUser?.login) : dUser) || 'DiscordUser';
        const dcId = (typeof dUser === 'object' ? (dUser?.discord_id || dUser?.id) : '') || ('dc_' + Date.now());
        const dcAvatar = (typeof dUser === 'object' ? dUser?.avatar_url : '') || '';
        const dcUrl = dcId ? `https://discord.com/users/${encodeURIComponent(dcId)}` : `https://discord.com/users/${encodeURIComponent(dcUsername)}`;
        const email = `${String(dcUsername).toLowerCase().replace(/[^a-z0-9_]/g, '')}@discord.tmcawards.org`;

        let user = db.users.find(u => (u.discord_id && String(u.discord_id) === String(dcId)) || (u.discord_username && u.discord_username.toLowerCase() === dcUsername.toLowerCase()));
        if (!user) {
          user = {
            id: 'u-dc-' + (String(dcId).replace(/[^a-zA-Z0-9_-]/g, '') || Date.now()),
            email,
            discord_id: String(dcId),
            discord_username: dcUsername,
            discord_avatar_url: dcAvatar,
            discord_verified: true,
            created_at: new Date().toISOString()
          };
          db.users.push(user);
        } else {
          user.discord_username = dcUsername;
          user.discord_id = String(dcId);
          if (dcAvatar) user.discord_avatar_url = dcAvatar;
          user.discord_verified = true;
        }

        const session: AuthSession = { user, access_token: 'dc-token-' + Date.now() };
        db.session = session;
        saveDb(db);
        notifyAuth('SIGNED_IN', session);
        return { data: { user, session }, error: null };
      },
      signOut: async () => {
        db = loadDb();
        db.session = null;
        db.isAdmin = false;
        delete db.adminLoginAt;
        saveDb(db);
        notifyAuth('SIGNED_OUT', null);
        return { data: null, error: null };
      },
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: 'aal2' } }),
        listFactors: async () => ({ data: { totp: [{ id: 'mock-factor' }] } }),
        enroll: async () => ({ data: { id: 'mock-factor', totp: { qr_code: '', secret: 'TNBLOCKSADMINKEY' } } }),
        challenge: async () => ({ data: { id: 'mock-challenge' } }),
        verify: async () => ({ data: {}, error: null })
      }
    }
  };
}

export const THEMES: Record<CertTheme, { label: string; bg: string; frame: string; accent: string; ink: string; sub: string }> = {
  emerald: { label: 'Emerald', bg: '#eaf5ee', frame: '#1f7a45', accent: '#34b56b', ink: '#13301f', sub: '#3b5c47' },
  gold: { label: 'Gold', bg: '#fbf3dc', frame: '#a87608', accent: '#e0a81f', ink: '#3b2b05', sub: '#6b5320' },
  diamond: { label: 'Diamond', bg: '#e8f6f8', frame: '#177385', accent: '#3cc7d9', ink: '#0e2f36', sub: '#33636d' },
  netherite: { label: 'Netherite', bg: '#2a2528', frame: '#6b5a5f', accent: '#c9a97a', ink: '#f1e8e4', sub: '#c7b9b3' }
};

export const SPRITES: Record<string, string[]> = {
  star: ['....#....', '....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.#.....#.'],
  trophy: ['#########', '#.#####.#', '#.#####.#', '.#######.', '..#####..', '...###...', '....#....', '...###...', '..#####..'],
  shield: ['#########', '#########', '#########', '#########', '.#######.', '.#######.', '..#####..', '...###...', '....#....'],
  heart: ['.##...##.', '####.####', '#########', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'],
  gem: ['..#####..', '.#######.', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....', '.........']
};

export function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

export function esc(s: any): string {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c] || c));
}

export function safeUrl(u?: string | null): string {
  return /^https?:\/\/[^\s"'<>]{3,300}$/i.test(u || '') ? u! : '';
}

export function safeColor(c?: string | null): string {
  return /^#[0-9a-f]{6}$/i.test(c || '') ? c! : '#1f7a45';
}

export function onColor(c?: string | null): string {
  const n = parseInt(safeColor(c).slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#10170f' : '#ffffff';
}

export function setMsg(el: HTMLElement | null, text: string, cls: string): void {
  if (!el) return;
  el.className = 'msg ' + cls;
  el.textContent = text;
}

export function clearMsg(el: HTMLElement | null): void {
  if (!el) return;
  el.className = 'msg hide';
  el.textContent = '';
}

export function fmtDate(d?: string | null): string {
  return d ? new Date(d).toISOString().slice(0, 10) : '';
}

export function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number): void {
  let line = '';
  for (const w of text.split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lh;
    } else line = t;
  }
  ctx.fillText(line, x, y);
}

export function certField(c: Certificate, k: 'award' | 'heading' | 'sub'): string {
  const isTa = typeof window !== 'undefined' && (window as any).lang && (window as any).lang() === 'ta';
  if (k === 'award') {
    return (isTa && c.award_ta) || (window as any).t?.('award.' + c.award) || c.award;
  }
  const main = isTa ? (c.heading_ta || c.heading) : c.heading;
  let sub = isTa ? (c.heading || '') : (c.heading_ta || '');
  if (sub === main) sub = '';
  return k === 'heading' ? main : sub;
}

export async function drawCert(canvas: HTMLCanvasElement | null, c: Certificate, themeKey: CertTheme = 'emerald'): Promise<void> {
  if (!canvas) return;
  const th = THEMES[themeKey] || THEMES.emerald;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  try {
    await Promise.all([
      document.fonts.load('800 60px Outfit'),
      document.fonts.load('700 40px "Noto Sans Tamil"'),
      document.fonts.load('500 30px Outfit')
    ]);
  } catch (e) {}

  ctx.fillStyle = th.bg;
  ctx.fillRect(0, 0, W, H);

  const s = 28;
  for (let x = 0; x < W; x += s) {
    for (let k = 0; k < 2; k++) {
      ctx.fillStyle = (x / s) % 2 ? th.frame : th.accent;
      ctx.fillRect(x, k ? H - s : 0, s, s);
    }
  }
  for (let y = s; y < H - s; y += s) {
    for (let k = 0; k < 2; k++) {
      ctx.fillStyle = (y / s) % 2 ? th.frame : th.accent;
      ctx.fillRect(k ? W - s : 0, y, s, s);
    }
  }

  ctx.strokeStyle = th.frame;
  ctx.lineWidth = 4;
  ctx.strokeRect(s + 22, s + 22, W - 2 * (s + 22), H - 2 * (s + 22));

  ctx.textAlign = 'center';
  ctx.fillStyle = th.frame;
  ctx.font = '700 30px Outfit, "Noto Sans Tamil", sans-serif';
  ctx.fillText((window as any).t?.('cert.org') || 'TMC AWARDS - TAMIL MINECRAFT COMMUNITY', W / 2, 165);

  const sub = certField(c, 'sub');
  const main = certField(c, 'heading') || 'Certificate of Achievement';
  if (sub) {
    ctx.fillStyle = th.ink;
    ctx.font = '700 44px "Noto Sans Tamil", Outfit, sans-serif';
    ctx.fillText(sub, W / 2, 245);
  }

  let hs = 76;
  ctx.fillStyle = th.ink;
  do {
    ctx.font = '800 ' + hs + 'px Outfit, "Noto Sans Tamil", sans-serif';
    hs -= 3;
  } while (ctx.measureText(main).width > W - 300 && hs > 34);
  ctx.fillText(main, W / 2, 350);

  ctx.fillStyle = th.sub;
  ctx.font = '500 30px Outfit, "Noto Sans Tamil", sans-serif';
  ctx.fillText((window as any).t?.('cert.presented') || 'This certificate is proudly presented to', W / 2, 430);

  let size = 110;
  ctx.fillStyle = th.frame;
  const rName = c.recipient_name || 'Creator';
  do {
    ctx.font = '800 ' + size + 'px Outfit, "Noto Sans Tamil", sans-serif';
    size -= 4;
  } while (ctx.measureText(rName).width > W - 340 && size > 40);
  ctx.fillText(rName, W / 2, 550);

  ctx.fillStyle = th.accent;
  ctx.fillRect(W / 2 - 260, 585, 520, 6);

  ctx.fillStyle = th.sub;
  ctx.font = '500 30px Outfit, "Noto Sans Tamil", sans-serif';
  ctx.fillText(((window as any).t?.('cert.for') || 'for') + ' ' + (c.channel_name || 'Channel'), W / 2, 650);

  const aw = certField(c, 'award') || 'Best Creator Award';
  let as = 62;
  ctx.fillStyle = th.ink;
  do {
    ctx.font = '800 ' + as + 'px Outfit, "Noto Sans Tamil", sans-serif';
    as -= 3;
  } while (ctx.measureText(aw).width > W - 300 && as > 30);
  ctx.fillText(aw, W / 2, 745);

  // Optional Custom Logo Rendering
  if (c.custom_logo_url) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = c.custom_logo_url!;
      });
      if (img.width > 0) {
        ctx.save();
        ctx.fillStyle = th.accent;
        ctx.fillRect(115, 80, 110, 110);
        ctx.fillStyle = th.bg;
        ctx.fillRect(119, 84, 102, 102);
        ctx.drawImage(img, 120, 85, 100, 100);
        ctx.restore();
      }
    } catch (e) {}
  }

  // Optional Team Award Banner
  if (c.is_team_award) {
    ctx.fillStyle = th.accent;
    ctx.fillRect(W / 2 - 200, 195, 400, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 18px Outfit, sans-serif';
    ctx.fillText('★ OFFICIAL TEAM AWARD ★', W / 2, 219);
  }

  let y = 800;
  ctx.fillStyle = th.sub;
  ctx.font = '500 26px Outfit, "Noto Sans Tamil", sans-serif';
  if (c.content_title) {
    wrap(ctx, ((window as any).t?.('cert.content') || 'Content:') + ' ' + c.content_title, W / 2, y, W - 460, 40);
    y += 44;
  }
  if (c.team_name) {
    ctx.fillStyle = th.frame;
    ctx.font = '700 26px Outfit, "Noto Sans Tamil", sans-serif';
    ctx.fillText('Team: ' + c.team_name, W / 2, y);
    y += 38;
  }
  if (c.team_members) {
    ctx.fillStyle = th.ink;
    ctx.font = '600 24px Outfit, "Noto Sans Tamil", sans-serif';
    wrap(ctx, '👥 Team Members: ' + c.team_members, W / 2, y, W - 460, 34);
    y += 44;
  }
  if (c.message) {
    ctx.fillStyle = th.sub;
    ctx.font = '500 24px Outfit, "Noto Sans Tamil", sans-serif';
    wrap(ctx, c.message, W / 2, y, W - 460, 36);
  }

  const sp = SPRITES[c.icon] || SPRITES.shield;
  const px = 7, ox = W / 2 - (9 * px) / 2, oy = 895;
  for (const [dx, col] of [[3, th.frame], [0, th.accent]] as [number, string][]) {
    sp.forEach((row, r) => [...row].forEach((ch, k) => {
      if (ch === '#') {
        ctx.fillStyle = col;
        ctx.fillRect(ox + k * px + dx, oy + r * px + dx, px, px);
      }
    }));
  }

  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i % 2 ? th.accent : th.frame;
    ctx.fillRect(ox - 70 - i * 34, oy + 30, 20, 20);
    ctx.fillRect(ox + 9 * px + 50 + i * 34, oy + 30, 20, 20);
  }

  if (c.badge_text) {
    ctx.fillStyle = th.frame;
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.fillText(c.badge_text, W / 2, oy + 80);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = th.sub;
  ctx.font = '500 24px Outfit, "Noto Sans Tamil", sans-serif';
  ctx.fillText(((window as any).t?.('cert.issued') || 'Issued:') + ' ' + fmtDate(c.issued_at), 150, 1020);
  ctx.fillText(((window as any).t?.('cert.id') || 'Certificate ID:') + ' ' + (c.cert_code || 'CERT-XXXXXXXX'), 150, 1056);

  ctx.textAlign = 'center';
  ctx.strokeStyle = th.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W - 480, 1020);
  ctx.lineTo(W - 150, 1020);
  ctx.stroke();

  ctx.font = '500 24px Outfit, "Noto Sans Tamil", sans-serif';
  ctx.fillText(c.issuer_signature || (window as any).t?.('cert.signed') || 'TMC Awards Committee', W - 315, 1056);
}

export function downloadCanvas(canvas: HTMLCanvasElement, name: string): void {
  canvas.toBlob(blob => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
}

// Global exposure
declare global {
  interface Window {
    sb: ReturnType<typeof createFallbackClient>;
    $: typeof $;
    esc: typeof esc;
    safeUrl: typeof safeUrl;
    safeColor: typeof safeColor;
    onColor: typeof onColor;
    setMsg: typeof setMsg;
    clearMsg: typeof clearMsg;
    fmtDate: typeof fmtDate;
    THEMES: typeof THEMES;
    ICONS: string[];
    drawCert: typeof drawCert;
    downloadCanvas: typeof downloadCanvas;
    supabaseClient?: any;
    supabase?: any;
  }
}

if (typeof window !== 'undefined') {
  window.sb = createFallbackClient();

  // Connect real Supabase client when configured
  (async function initSupabaseClientBridge() {
    try {
      const res = await fetch('/api/supabase/config');
      const cfg = await res.json();
      if (cfg && cfg.url && cfg.publishableKey && window.supabase && typeof window.supabase.createClient === 'function') {
        window.supabaseClient = window.supabase.createClient(cfg.url, cfg.publishableKey);
        console.log('[TMC] Connected with Supabase project:', cfg.url);
      }
    } catch (e) {
      console.warn('[TMC] Supabase client bridge check:', e);
    }
  })();

  window.$ = $;
  window.esc = esc;
  window.safeUrl = safeUrl;
  window.safeColor = safeColor;
  window.onColor = onColor;
  window.setMsg = setMsg;
  window.clearMsg = clearMsg;
  window.fmtDate = fmtDate;
  window.THEMES = THEMES;
  window.ICONS = Object.keys(SPRITES);
  window.drawCert = drawCert;
  window.downloadCanvas = downloadCanvas;
}

