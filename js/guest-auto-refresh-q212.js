/* Admin-controlled background RSVP checks. */
let guestSendWritesQ212 = 0;
let guestSendRevisionQ212 = 0;
let guestAutoRefreshConfigQ212 = {enabled: false, intervalSeconds: 30};
let guestAutoRefreshTimerQ212 = null;
let guestAutoRefreshRunningQ212 = false;

function guestAutoRefreshReadyQ212_() {
  return !!state.session && ['Admin', 'EventManager'].includes(state.session.role) &&
    !!state.activeEventId && currentPage === 'guests' && !document.hidden &&
    !document.querySelector('#modal.show') &&
    !document.querySelector('.seating-confirm-shade-v171, #waInterruptedQ22');
}

function guestAutoRefreshSettingsHtmlQ212_(rows) {
  const saved = (rows || []).find(row => row.key === 'GUEST_RSVP_AUTO_REFRESH');
  let config = {enabled: false, intervalSeconds: 30};
  try {
    if (saved && isTrue(saved.active, true)) config = JSON.parse(saved.value);
  } catch (error) { console.warn('Guest refresh settings could not be read', error); }
  return `<section class="guest-auto-settings-q212" aria-label="עדכון אישורי הגעה">
    <h3>עדכון אישורי הגעה</h3>
    <form id="guestAutoRefreshFormQ212" class="system-value-card-z53">
      <label class="guest-auto-switch-q212">
        <span>עדכון אוטומטי של אישורי הגעה</span>
        <input id="guestAutoEnabledQ212" type="checkbox" role="switch" ${config.enabled ? 'checked' : ''}>
        <span class="guest-auto-track-q212" aria-hidden="true"></span>
        <strong id="guestAutoStateQ212">${config.enabled ? 'פעיל' : 'כבוי'}</strong>
      </label>
      <label class="system-number-field-q20">תדירות בדיקה בשניות
        <input id="guestAutoIntervalQ212" type="number" min="15" max="30" step="1"
          required value="${esc(config.intervalSeconds)}" ${config.enabled ? '' : 'disabled'}>
      </label>
      <p class="muted">הבדיקה פועלת במסך מוזמנים כשהוא גלוי. הרשימה והמונים מתעדכנים רק כשיש שינוי. ההגדרה חלה על כל המשתמשים.</p>
      <div class="actions"><button type="submit" class="primary">שמירה</button>
      <span id="guestAutoSaveQ212" role="status" aria-live="polite"></span></div>
    </form>
  </section>`;
}

document.addEventListener('change', event => {
  if (event.target.id !== 'guestAutoEnabledQ212') return;
  const enabled = event.target.checked;
  document.getElementById('guestAutoIntervalQ212').disabled = !enabled;
  document.getElementById('guestAutoStateQ212').textContent = enabled ? 'פעיל' : 'כבוי';
  document.getElementById('guestAutoSaveQ212').textContent = 'השינוי טרם נשמר';
});

document.addEventListener('submit', async event => {
  if (event.target.id !== 'guestAutoRefreshFormQ212') return;
  event.preventDefault();
  const form = event.target;
  if (form.dataset.saving === 'true') return;
  const toggle = form.querySelector('#guestAutoEnabledQ212');
  const interval = form.querySelector('#guestAutoIntervalQ212');
  const enabled = toggle.checked;
  const intervalSeconds = Number(interval.value);
  const status = form.querySelector('#guestAutoSaveQ212');
  if (!Number.isInteger(intervalSeconds) || intervalSeconds < 15 || intervalSeconds > 30) {
    status.textContent = 'יש להזין מספר שלם בין 15 ל־30 שניות';
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  const config = {enabled, intervalSeconds};
  form.dataset.saving = 'true';
  toggle.disabled = interval.disabled = true;
  setAdminButtonBusyZ53B6_(button, true, 'שומר…');
  status.textContent = 'שומר…';
  try {
    await API.request('saveSystemSettingZ53', {setting: {
      key: 'GUEST_RSVP_AUTO_REFRESH', group: 'GUESTS',
      label: 'עדכון אוטומטי של אישורי הגעה',
      value: JSON.stringify(config), active: true
    }});
    guestAutoRefreshConfigQ212 = config;
    status.textContent = 'ההגדרות נשמרו. השינוי יחול במסכים פתוחים בתוך כדקה.';
  } catch (error) {
    status.textContent = 'השמירה נכשלה: ' + (error.message || String(error));
  } finally {
    form.dataset.saving = 'false';
    toggle.disabled = false;
    interval.disabled = !toggle.checked;
    setAdminButtonBusyZ53B6_(button, false);
  }
});

async function guestAutoRefreshTickQ212_() {
  if (guestAutoRefreshRunningQ212) return;
  clearTimeout(guestAutoRefreshTimerQ212);
  guestAutoRefreshRunningQ212 = true;
  try {
    if (guestAutoRefreshReadyQ212_() && !rsvpRefreshBusyV1189A4_) {
      await refreshGuestsAfterRsvpV1189A4_(false, false, true);
    }
  } finally {
    guestAutoRefreshRunningQ212 = false;
    const seconds = guestAutoRefreshReadyQ212_()
      ? (guestAutoRefreshConfigQ212.enabled ? guestAutoRefreshConfigQ212.intervalSeconds : 60)
      : 5;
    guestAutoRefreshTimerQ212 = setTimeout(guestAutoRefreshTickQ212_, seconds * 1000);
  }
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void guestAutoRefreshTickQ212_();
});
void guestAutoRefreshTickQ212_();
