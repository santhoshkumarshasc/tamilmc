/**
 * TMC Awards - Admin Dashboard
 * Strictly accessible via /admin?token=ADMINOFTMC.
 * Includes Factory Reset Data workflow, Certificate issuance,
 * Profile moderations, and Type configurations.
 */

import {
  CreatorProfile,
  Certificate,
  CertificateType,
  UserAccount,
  AdminUser,
  CertTheme
} from './types.js';

let factorId: string | null = null;
let profiles: CreatorProfile[] = [];
let certs: Certificate[] = [];
let types: CertificateType[] = [];
let users: UserAccount[] = [];
let admins: AdminUser[] = [];
let editingType: CertificateType | null = null;
let editing: CreatorProfile | null = null;
let currentCert: Certificate | null = null;

const $ = (id: string): HTMLElement | null => document.getElementById(id);
const esc = (s: any): string => (window as any).esc ? (window as any).esc(s) : String(s || '');
const t = (k: string, vars?: any): string => (window as any).t ? (window as any).t(k, vars) : k;

function showStep(name: 'login' | 'mfa' | 'app'): void {
  const sLogin = $('stepLogin');
  const sMfa = $('stepMfa');
  const sApp = $('app');
  if (sLogin) sLogin.classList.toggle('hide', name !== 'login');
  if (sMfa) sMfa.classList.toggle('hide', name !== 'mfa');
  if (sApp) sApp.classList.toggle('hide', name !== 'app');

  const outBtn = $('outBtn');
  const admSessionTimer = $('admSessionTimer');
  const admResetTopBtn = $('admResetTopBtn');

  if (outBtn) outBtn.classList.toggle('hide', name !== 'app');
  if (admSessionTimer) admSessionTimer.classList.toggle('hide', name !== 'app');
  if (admResetTopBtn) admResetTopBtn.classList.toggle('hide', name !== 'app');

  if (name === 'app') {
    startSessionTimer();
    loadAll();
  } else {
    stopSessionTimer();
  }
}

/* 5-MINUTE AUTO-LOGOUT SESSION TIMER */
let sessionInterval: number | null = null;
let sessionSecondsRemaining = 300;

function startSessionTimer(): void {
  stopSessionTimer();
  sessionSecondsRemaining = 300;
  updateTimerDisplay();

  sessionInterval = window.setInterval(() => {
    sessionSecondsRemaining--;
    updateTimerDisplay();
    if (sessionSecondsRemaining <= 0) {
      stopSessionTimer();
      alert('Your 5-minute admin session has expired. Please sign in again.');
      (window as any).sb.auth.signOut();
      showStep('login');
    }
  }, 1000);
}

function stopSessionTimer(): void {
  if (sessionInterval !== null) {
    clearInterval(sessionInterval);
    sessionInterval = null;
  }
}

function updateTimerDisplay(): void {
  const el = $('admTimeLeft');
  if (!el) return;
  const m = Math.floor(sessionSecondsRemaining / 60);
  const s = sessionSecondsRemaining % 60;
  el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* AUTHENTICATION */
async function initAdminAuth(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const tokenParam = params.get('token');

  // Direct login button with security key
  const tokenGoBtn = $('lTokenGo');
  if (tokenGoBtn) {
    tokenGoBtn.onclick = async () => {
      const input = ($('lToken') as HTMLInputElement)?.value.trim();
      if (input === 'ADMINOFTMC') {
        const { error } = await (window as any).sb.auth.signInWithPassword({ email: 'admin@tmcawards.org', password: input });
        if (!error) showStep('app');
        else (window as any).setMsg($('lMsg'), (window as any).t('ad.fail') || 'Authentication failed. Please check credentials.', 'err');
      } else {
        (window as any).setMsg($('lMsg'), (window as any).t('ad.fail') || 'Invalid administrator security key. Please verify credentials.', 'err');
      }
    };
  }

  // Auto-login from authorized token URL
  if (tokenParam === 'ADMINOFTMC') {
    const { error } = await (window as any).sb.auth.signInWithPassword({ email: 'admin@tmcawards.org', password: 'ADMINOFTMC' });
    if (!error) {
      showStep('app');
      return;
    }
  }

  // Check existing session
  const { data: sessData } = await (window as any).sb.auth.getSession();
  if (sessData && sessData.session && sessData.session.user && sessData.session.user.is_admin) {
    showStep('app');
  } else {
    showStep('login');
  }
}

/* DATA LOADING */
async function loadAll(): Promise<void> {
  const [p, c, ty, u, adm] = await Promise.all([
    (window as any).sb.rpc('admin_list_profiles'),
    (window as any).sb.rpc('admin_list_certificates'),
    (window as any).sb.rpc('admin_list_types'),
    (window as any).sb.rpc('admin_list_users'),
    (window as any).sb.rpc('admin_list_admins')
  ]);

  profiles = p.data || [];
  certs = c.data || [];
  types = ty.data || [];
  users = u.data || [];
  admins = (adm && adm.data) || [];

  updateDashboardStats();
  renderCertsTab();
  renderProfilesTab();
  renderUsersTab();
  renderTypesTab();
  renderAdminsTab();
}

function updateDashboardStats(): void {
  const sp = $('adStatProfiles');
  const sc = $('adStatCerts');
  const sv = $('adStatVotes');
  const su = $('adStatUsers');

  let totalVotes = 0;
  profiles.forEach(pr => { totalVotes += pr.votes || 0; });

  if (sp) sp.textContent = String(profiles.length);
  if (sc) sc.textContent = String(certs.length);
  if (sv) sv.textContent = String(totalVotes);
  if (su) su.textContent = String(users.length);
}

/* RESET DATA WORKFLOW */
export function setupResetDataFlow(): void {
  const openResetDlg = () => {
    const dlg = $('resetConfirmDlg') as HTMLDialogElement;
    const inp = $('resetConfirmInput') as HTMLInputElement;
    const execBtn = $('resetExecuteBtn') as HTMLButtonElement;
    if (inp) inp.value = '';
    if (execBtn) execBtn.disabled = false;
    if (dlg) {
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    }
  };

  const closeResetDlg = () => {
    const dlg = $('resetConfirmDlg') as HTMLDialogElement;
    if (dlg) {
      if (typeof dlg.close === 'function') dlg.close();
      else dlg.removeAttribute('open');
    }
  };

  // Top nav reset button
  const admResetTopBtn = $('admResetTopBtn');
  if (admResetTopBtn) {
    admResetTopBtn.onclick = openResetDlg;
  }

  // Tab 5 Danger zone reset button
  const adResetDataBtn = $('adResetDataBtn');
  if (adResetDataBtn) {
    adResetDataBtn.onclick = openResetDlg;
  }

  const resetDlgClose = $('resetDlgClose');
  if (resetDlgClose) resetDlgClose.onclick = closeResetDlg;

  const resetCancelBtn = $('resetCancelBtn');
  if (resetCancelBtn) resetCancelBtn.onclick = closeResetDlg;

  const resetExecuteBtn = $('resetExecuteBtn') as HTMLButtonElement;
  if (resetExecuteBtn) {
    resetExecuteBtn.onclick = async () => {
      resetExecuteBtn.disabled = true;
      resetExecuteBtn.textContent = 'Resetting Data...';

      const { data, error } = await (window as any).sb.rpc('admin_reset_all_data');
      if (error) {
        alert('Failed to reset data: ' + error.message);
        resetExecuteBtn.disabled = false;
        resetExecuteBtn.textContent = 'Reset Everything';
        return;
      }

      closeResetDlg();
      resetExecuteBtn.textContent = 'Reset Everything';
      resetExecuteBtn.disabled = false;

      // Reload admin views
      await loadAll();

      // Trigger confetti and celebration
      if ((window as any).confetti) (window as any).confetti();

      alert(t('ad.reset_success') || '✅ Community database successfully reset to factory defaults!');
    };
  }
}

/* TAB RENDERING: CERTIFICATES */
function renderCertsTab(): void {
  const cPick = $('cPick') as HTMLSelectElement;
  if (cPick) {
    cPick.innerHTML = `<option value="">${esc(t('ad.manual'))}</option>` +
      profiles.map(x => `<option value="${esc(x.id)}">${esc(x.channel_name)} (@${esc(x.handle)})</option>`).join('');
    
    cPick.onchange = (e) => {
      const p = profiles.find(x => x.id === (e.target as HTMLSelectElement).value);
      if (p) {
        const cName = $('cName') as HTMLInputElement;
        const cChannel = $('cChannel') as HTMLInputElement;
        if (cName) cName.value = p.display_name;
        if (cChannel) cChannel.value = p.channel_name;
      }
    };
  }

  const cType = $('cType') as HTMLSelectElement;
  if (cType) {
    cType.innerHTML = `<option value="">${esc(t('ad.type.custom'))}</option>` +
      types.filter(x => x.is_active).map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
  }

  const cTheme = $('cTheme') as HTMLSelectElement;
  if (cTheme) {
    cTheme.innerHTML = Object.entries((window as any).THEMES || {}).map(([k, v]: [string, any]) => 
      `<option value="${esc(k)}">${esc(v.label)}</option>`
    ).join('');
  }

  // Cert Table
  const tb = $('cTableBody');
  if (tb) {
    tb.innerHTML = certs.map(c => `
      <tr>
        <td><code>${esc(c.cert_code)}</code></td>
        <td><b>${esc(c.recipient_name)}</b><br><small style="color:var(--muted)">${esc(c.channel_name)}</small></td>
        <td>${esc(c.award)}</td>
        <td><span class="st-${esc(c.status)}">${esc(c.status)}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn small" onclick="window.previewCert('${esc(c.id)}')">👁️</button>
            <button class="btn small" onclick="window.reissueCert('${esc(c.id)}')">🔄</button>
            <button class="btn small danger" onclick="window.deleteCert('${esc(c.id)}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

/* TAB RENDERING: PROFILES */
function renderProfilesTab(): void {
  const uList = $('uList');
  if (!uList) return;

  uList.innerHTML = profiles.length ? profiles.map(p => `
    <div class="list-item" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-bottom:1px solid var(--line-subtle)">
      <div>
        <b>${esc(p.display_name)}</b> <small style="color:var(--muted)">(@${esc(p.handle)})</small>
        <div style="font-size:13px;color:var(--muted)">
          ${esc(p.channel_name)} • ❤️ ${p.likes || 0} • 🗳️ ${p.votes || 0} votes
          ${p.is_hidden ? '<span class="tag-pill" style="color:var(--danger)">Hidden</span>' : ''}
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn small" onclick="window.toggleHideProfile('${esc(p.id)}')">${p.is_hidden ? 'Unhide' : 'Hide'}</button>
        <button class="btn small danger" onclick="window.deleteProfile('${esc(p.id)}')">Delete</button>
      </div>
    </div>
  `).join('') : '<p class="note">No creator profiles found.</p>';
}

/* TAB RENDERING: USERS */
function renderUsersTab(): void {
  const accList = $('accList');
  if (!accList) return;
  accList.innerHTML = users.length ? users.map(u => `
    <div class="list-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid var(--line-subtle)">
      <div>
        <b>${esc(u.email)}</b>
        <div style="font-size:12px;color:var(--muted)">Joined: ${esc(u.created_at?.slice(0, 10))}</div>
      </div>
      <button class="btn small danger" onclick="window.deleteUser('${esc(u.id)}')">Delete</button>
    </div>
  `).join('') : '<p class="note">No user accounts registered yet.</p>';
}

/* TAB RENDERING: TYPES */
function renderTypesTab(): void {
  const typeList = $('typeList');
  if (!typeList) return;
  typeList.innerHTML = types.map(ty => `
    <div style="padding:10px;border-bottom:1px solid var(--line-subtle);display:flex;justify-content:space-between;align-items:center">
      <div>
        <b>${esc(ty.name)}</b> <small style="color:var(--muted)">(${esc(ty.name_ta)})</small>
        <div style="font-size:12px;color:var(--muted)">Award: ${esc(ty.award)} • Theme: ${esc(ty.theme)}</div>
      </div>
      <button class="btn small danger" onclick="window.deleteType('${esc(ty.id)}')">Delete</button>
    </div>
  `).join('');
}

/* TAB RENDERING: ADMINISTRATORS */
function renderAdminsTab(): void {
  const tb = $('admTableBody');
  if (tb) {
    tb.innerHTML = admins.length ? admins.map(a => `
      <tr>
        <td><b>${esc(a.name)}</b></td>
        <td><code>${esc(a.email)}</code></td>
        <td><span class="tag-pill">${esc(a.role)}</span></td>
        <td><small style="color:var(--muted)">${esc(a.created_at?.slice(0, 10))}</small></td>
        <td>
          <button class="btn small danger" onclick="window.deleteAdmin('${esc(a.id)}')">Delete</button>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="5" class="empty">No administrators configured.</td></tr>';
  }

  const createBtn = $('admCreateBtn') as HTMLButtonElement | null;
  if (createBtn) {
    createBtn.onclick = async () => {
      const name = ($('admNewName') as HTMLInputElement)?.value.trim();
      const email = ($('admNewEmail') as HTMLInputElement)?.value.trim();
      const role = ($('admNewRole') as HTMLSelectElement)?.value || 'moderator';
      const notes = ($('admNewNotes') as HTMLInputElement)?.value.trim();
      const msgEl = $('admOutMsg');

      if (!name || name.length < 2 || !email || !email.includes('@')) {
        if (msgEl) (window as any).setMsg?.(msgEl, 'Valid name and email are required.', 'err');
        return;
      }

      createBtn.disabled = true;
      const { error } = await (window as any).sb.rpc('admin_create_admin', { name, email, role, notes });
      createBtn.disabled = false;

      if (error) {
        if (msgEl) (window as any).setMsg?.(msgEl, error.message || 'Failed to create admin.', 'err');
      } else {
        if (msgEl) (window as any).setMsg?.(msgEl, 'Administrator added successfully!', 'ok');
        const inpName = $('admNewName') as HTMLInputElement;
        const inpEmail = $('admNewEmail') as HTMLInputElement;
        const inpNotes = $('admNewNotes') as HTMLInputElement;
        if (inpName) inpName.value = '';
        if (inpEmail) inpEmail.value = '';
        if (inpNotes) inpNotes.value = '';
        await loadAll();
      }
    };
  }
}

// Global actions for inline button clicks
declare global {
  interface Window {
    previewCert: (id: string) => void;
    reissueCert: (id: string) => void;
    deleteCert: (id: string) => void;
    toggleHideProfile: (id: string) => void;
    deleteProfile: (id: string) => void;
    deleteUser: (id: string) => void;
    deleteType: (id: string) => void;
    deleteAdmin: (id: string) => void;
  }
}

window.previewCert = (id: string) => {
  const cert = certs.find(c => c.id === id);
  if (!cert) return;
  const cv = $('tCert') as HTMLCanvasElement;
  if (cv && (window as any).drawCert) {
    (window as any).drawCert(cv, cert, cert.theme);
  }
};

window.reissueCert = async (id: string) => {
  if (!confirm('Re-issue a new token for this certificate? The old token will stop working.')) return;
  const { data, error } = await (window as any).sb.rpc('admin_reissue_certificate', { p_id: id });
  if (!error) {
    alert('New token created: ' + data.token);
    loadAll();
  }
};

window.deleteCert = async (id: string) => {
  if (!confirm('Permanently delete this certificate?')) return;
  await (window as any).sb.rpc('admin_delete_certificate', { p_id: id });
  loadAll();
};

window.toggleHideProfile = async (id: string) => {
  await (window as any).sb.rpc('admin_toggle_hide', { p_id: id });
  loadAll();
};

window.deleteProfile = async (id: string) => {
  if (!confirm('Permanently delete this creator profile?')) return;
  await (window as any).sb.rpc('admin_delete_profile', { p_id: id });
  loadAll();
};

window.deleteUser = async (id: string) => {
  if (!confirm('Permanently delete this user account?')) return;
  await (window as any).sb.rpc('admin_delete_user', { p_id: id });
  loadAll();
};

window.deleteType = async (id: string) => {
  if (!confirm('Delete this certificate type?')) return;
  await (window as any).sb.rpc('admin_delete_type', { p_id: id });
  loadAll();
};

window.deleteAdmin = async (id: string) => {
  if (!confirm('Permanently delete this administrator account?')) return;
  const { error } = await (window as any).sb.rpc('admin_delete_admin', { p_id: id });
  if (error) {
    alert(error.message || 'Failed to delete administrator');
  } else {
    loadAll();
  }
};

// Tabs navigation
function setupTabs(): void {
  document.querySelectorAll<HTMLButtonElement>('.tabs .chip').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll<HTMLButtonElement>('.tabs .chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');

      ['certs', 'creators', 'users', 'types', 'admins', 'settings'].forEach(tKey => {
        const pane = $(`tab-${tKey}`);
        if (pane) pane.classList.toggle('hide', tKey !== tab);
      });
    };
  });
}

// Server icon setup
function setupServerIconControls(): void {
  const saveBtn = $('adIconSave');
  const resetBtn = $('adIconReset');

  if (saveBtn) {
    saveBtn.onclick = async () => {
      const fileInp = $('adIconFile') as HTMLInputElement;
      const urlInp = $('adIconUrl') as HTMLInputElement;
      let iconVal: string | null = null;

      if (fileInp && fileInp.files && fileInp.files[0]) {
        const file = fileInp.files[0];
        const reader = new FileReader();
        reader.onload = async () => {
          iconVal = String(reader.result);
          await (window as any).sb.rpc('admin_set_server_icon', { icon: iconVal });
          alert('Server icon updated successfully!');
        };
        reader.readAsDataURL(file);
        return;
      } else if (urlInp && urlInp.value.trim()) {
        iconVal = urlInp.value.trim();
        await (window as any).sb.rpc('admin_set_server_icon', { icon: iconVal });
        alert('Server icon updated successfully!');
      }
    };
  }

  if (resetBtn) {
    resetBtn.onclick = async () => {
      await (window as any).sb.rpc('admin_set_server_icon', { icon: null });
      alert('Server icon reset to default.');
    };
  }
}

// Supabase controls
function setupSupabaseControls(): void {
  const urlInp = $('sbProjectUrl') as HTMLInputElement;
  const saveBtn = $('btnSaveSbUrl');
  const testBtn = $('btnTestSbConn');
  const badge = $('supabaseStatusBadge');
  const msg = $('sbMsg');

  // Load existing config from server
  fetch('/api/supabase/config')
    .then(r => r.json())
    .then(cfg => {
      if (cfg && cfg.url && urlInp && !urlInp.value) {
        urlInp.value = cfg.url;
      }
      if (badge && cfg.configured) {
        badge.textContent = '● Connected';
        badge.style.background = 'rgba(30,167,99,0.18)';
        badge.style.color = '#10b981';
      }
    })
    .catch(() => {});

  if (saveBtn) {
    saveBtn.onclick = async () => {
      const url = (urlInp?.value || '').trim();
      if (!url) {
        if (msg) (window as any).setMsg(msg, 'Please enter a Supabase Project URL', 'err');
        return;
      }
      try {
        const res = await fetch('/api/supabase/set-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (data.success) {
          if (msg) (window as any).setMsg(msg, '✓ Project URL saved and connected successfully!', 'ok');
          if (badge) {
            badge.textContent = data.status?.connected ? '● Live & Connected' : '● URL Saved';
            badge.style.color = data.status?.connected ? '#10b981' : '#f59e0b';
          }
        } else {
          if (msg) (window as any).setMsg(msg, data.error || 'Failed to update URL', 'err');
        }
      } catch (err: any) {
        if (msg) (window as any).setMsg(msg, err?.message || 'Error saving URL', 'err');
      }
    };
  }

  if (testBtn) {
    testBtn.onclick = async () => {
      if (msg) (window as any).setMsg(msg, 'Testing Supabase connection...', 'note');
      try {
        const res = await fetch('/api/supabase/status');
        const status = await res.json();
        if (status.connected) {
          if (msg) (window as any).setMsg(msg, '✓ Supabase connection active and responding!', 'ok');
          if (badge) {
            badge.textContent = '● Live & Connected';
            badge.style.color = '#10b981';
          }
        } else {
          if (msg) (window as any).setMsg(msg, status.error || 'Connection failed: Check Project URL or RLS policies', 'err');
          if (badge) {
            badge.textContent = '● Not Connected';
            badge.style.color = '#ef4444';
          }
        }
      } catch (err: any) {
        if (msg) (window as any).setMsg(msg, err?.message || 'Test failed', 'err');
      }
    };
  }

  const copySqlBtn = $('btnCopySql');
  if (copySqlBtn) {
    copySqlBtn.onclick = async () => {
      try {
        const res = await fetch('/api/supabase/sql');
        const sqlText = await res.text();
        await navigator.clipboard.writeText(sqlText);
        if (msg) (window as any).setMsg(msg, '✓ Complete Supabase SQL copied to clipboard! Paste and Run in Supabase SQL Editor.', 'ok');
      } catch (err) {
        window.open('/api/supabase/sql', '_blank');
      }
    };
  }
}


// Initialize on DOM load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initAdminAuth();
    setupTabs();
    setupResetDataFlow();
    setupServerIconControls();
    setupSupabaseControls();

    const outBtn = $('outBtn');
    if (outBtn) {
      outBtn.onclick = async () => {
        await (window as any).sb.auth.signOut();
        showStep('login');
      };
    }
  });
}

