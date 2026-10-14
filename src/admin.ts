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
  CertTheme
} from './types.js';

let factorId: string | null = null;
let profiles: CreatorProfile[] = [];
let certs: Certificate[] = [];
let types: CertificateType[] = [];
let users: UserAccount[] = [];
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

  // Direct login button with token
  const tokenGoBtn = $('lTokenGo');
  if (tokenGoBtn) {
    tokenGoBtn.onclick = async () => {
      const input = ($('lToken') as HTMLInputElement)?.value.trim();
      if (input === 'ADMINOFTMC') {
        const { error } = await (window as any).sb.auth.signInWithPassword({ email: 'admin@tmcawards.org', password: input });
        if (!error) showStep('app');
        else (window as any).setMsg($('lMsg'), 'Invalid admin token', 'err');
      } else {
        (window as any).setMsg($('lMsg'), 'Secret token must be ADMINOFTMC', 'err');
      }
    };
  }

  // Pre-fill token from URL if valid
  if (tokenParam === 'ADMINOFTMC') {
    const lToken = $('lToken') as HTMLInputElement;
    if (lToken) lToken.value = 'ADMINOFTMC';
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
  const [p, c, ty, u] = await Promise.all([
    (window as any).sb.rpc('admin_list_profiles'),
    (window as any).sb.rpc('admin_list_certificates'),
    (window as any).sb.rpc('admin_list_types'),
    (window as any).sb.rpc('admin_list_users')
  ]);

  profiles = p.data || [];
  certs = c.data || [];
  types = ty.data || [];
  users = u.data || [];

  updateDashboardStats();
  renderCertsTab();
  renderProfilesTab();
  renderUsersTab();
  renderTypesTab();
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

// Tabs navigation
function setupTabs(): void {
  document.querySelectorAll<HTMLButtonElement>('.tabs .chip').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll<HTMLButtonElement>('.tabs .chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');

      ['certs', 'creators', 'users', 'types', 'settings'].forEach(tKey => {
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

// Initialize on DOM load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initAdminAuth();
    setupTabs();
    setupResetDataFlow();
    setupServerIconControls();

    const outBtn = $('outBtn');
    if (outBtn) {
      outBtn.onclick = async () => {
        await (window as any).sb.auth.signOut();
        showStep('login');
      };
    }
  });
}
