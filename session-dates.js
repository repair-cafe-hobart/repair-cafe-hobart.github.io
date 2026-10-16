(function (root) {
  'use strict';
  const ZONE = 'Australia/Hobart';
  const dayFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  });
  function hobartDate(now) {
    const p = Object.fromEntries(dayFormat.formatToParts(now).map(x => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day}`;
  }
  function validSession(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s.date)) return false;
    const d = new Date(`${s.date}T12:00:00Z`);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s.date &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(s.start) &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(s.end) && s.end > s.start &&
      s.status === 'scheduled';
  }
  function nextSession(sessions, now = new Date()) {
    const today = hobartDate(now);
    return sessions.filter(validSession).filter(s => s.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))[0] || null;
  }
  // Google Sheets CSV can contain quoted commas, quotes and newlines.
  function parseCsv(text) {
    const rows = []; let row = [], value = '', quoted = false;
    text = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') { value += '"'; i++; }
        else quoted = !quoted;
      } else if (c === ',' && !quoted) { row.push(value); value = ''; }
      else if ((c === '\n' || c === '\r') && !quoted) {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(value); rows.push(row); row = []; value = '';
      } else value += c;
    }
    if (quoted) throw new Error('Unclosed CSV quote');
    if (value || row.length) { row.push(value); rows.push(row); }
    const headers = (rows.shift() || []).map(x => x.trim().toLowerCase());
    if (!['date', 'start', 'end', 'status'].every(h => headers.includes(h))) {
      throw new Error('Schedule headers must be date, start, end, status');
    }
    return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || '').trim()])));
  }
  function displayParts(session) {
    const date = new Date(`${session.date}T12:00:00Z`);
    const fmt = options => new Intl.DateTimeFormat('en-AU', {timeZone: 'UTC', ...options}).format(date);
    const time = value => {
      const [h, m] = value.split(':').map(Number);
      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
    };
    return {date: fmt({weekday:'long',day:'numeric',month:'long',year:'numeric'}),
      month: fmt({month:'short'}).toUpperCase(), day: fmt({day:'numeric'}),
      weekday: fmt({weekday:'long'}).toUpperCase(), time: `${time(session.start)} – ${time(session.end)}`};
  }
  function render(doc, session) {
    const parts = session ? displayParts(session) : {
      date:'Next session date to be confirmed',month:'TBC',day:'—',weekday:'',time:'Time to be confirmed'
    };
    for (const [key, text] of Object.entries(parts)) {
      doc.querySelectorAll(`[data-session="${key}"]`).forEach(el => { el.textContent = text; });
    }
  }
  async function start(doc) {
    let sessions = [];
    let loading = false;
    async function refresh() {
      if (loading) return;
      loading = true;
      try {
        const response = await fetch('sessions.json', {cache:'no-store',signal:AbortSignal.timeout(10000)});
        if (!response.ok) throw new Error('Schedule unavailable');
        const config = await response.json();
        if (!Array.isArray(config.sessions)) throw new Error('Invalid schedule');
        sessions = config.sessions;
        if (config.sourceCsvUrl) {
          const url = new URL(config.sourceCsvUrl);
          if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com') throw new Error('Invalid schedule URL');
          const csv = await fetch(url, {cache:'no-store',signal:AbortSignal.timeout(10000)});
          if (!csv.ok) throw new Error('Schedule unavailable');
          sessions = parseCsv(await csv.text());
        }
      } catch (error) {
        sessions = [];
        console.warn('Session dates could not be loaded.', error.message);
      } finally { loading = false; render(doc, nextSession(sessions)); }
    }
    await refresh();
    // Refresh open pages too, including across Sunday midnight and after sleep.
    root.setInterval(() => { render(doc, nextSession(sessions)); }, 15000);
    root.setInterval(refresh, 5 * 60 * 1000);
    doc.addEventListener('visibilitychange', () => { if (!doc.hidden) { render(doc, nextSession(sessions)); refresh(); } });
  }
  const api = {hobartDate,validSession,nextSession,parseCsv,displayParts,render};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) start(root.document);
})(typeof window === 'undefined' ? globalThis : window);
