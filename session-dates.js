(function () {
  'use strict';

  const TIME_ZONE = 'Australia/Hobart';
  let sessions = [];
  let loading = false;

  function todayInHobart() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());

    const values = Object.fromEntries(
      parts.map(part => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
  }

  function validSession(session) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(session.date || '')) {
      return false;
    }

    const date = new Date(`${session.date}T12:00:00Z`);
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    return Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === session.date &&
      timePattern.test(session.start) &&
      timePattern.test(session.end) &&
      session.end > session.start &&
      session.status === 'scheduled';
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = '';
    let quoted = false;

    text = text.replace(/^\uFEFF/, '');

    for (let i = 0; i < text.length; i++) {
      const character = text[i];

      if (character === '"') {
        if (quoted && text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (character === ',' && !quoted) {
        row.push(value);
        value = '';
      } else if (
        (character === '\n' || character === '\r') &&
        !quoted
      ) {
        if (character === '\r' && text[i + 1] === '\n') {
          i++;
        }
        row.push(value);
        rows.push(row);
        row = [];
        value = '';
      } else {
        value += character;
      }
    }

    if (quoted) throw new Error('Incomplete CSV data');

    if (value || row.length) {
      row.push(value);
      rows.push(row);
    }

    const headers = (rows.shift() || []).map(
      heading => heading.trim().toLowerCase()
    );

    if (!['date', 'start', 'end', 'status'].every(
      heading => headers.includes(heading)
    )) {
      throw new Error('Missing schedule columns');
    }

    return rows.map(values => Object.fromEntries(
      headers.map((heading, index) => [
        heading,
        (values[index] || '').trim()
      ])
    ));
  }

  function formatTime(value) {
    const [hour, minute] = value.split(':').map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${
      hour < 12 ? 'am' : 'pm'
    }`;
  }

  function updateDisplay() {
    const today = todayInHobart();

    const next = sessions
      .filter(validSession)
      .filter(session => session.date >= today)
      .sort((a, b) =>
        a.date.localeCompare(b.date) ||
        a.start.localeCompare(b.start)
      )[0];

    let display = {
      date: 'Next session date to be confirmed',
      month: 'TBC',
      day: '—',
      weekday: '',
      time: 'Time to be confirmed'
    };

    if (next) {
      const date = new Date(`${next.date}T12:00:00Z`);
      const format = options =>
        new Intl.DateTimeFormat('en-AU', {
          timeZone: 'UTC',
          ...options
        }).format(date);

      display = {
        date: format({
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        month: format({ month: 'short' }).toUpperCase(),
        day: format({ day: 'numeric' }),
        weekday: format({ weekday: 'long' }).toUpperCase(),
        time: `${formatTime(next.start)} – ${formatTime(next.end)}`
      };
    }

    Object.entries(display).forEach(([field, text]) => {
      document.querySelectorAll(
        `[data-session="${field}"]`
      ).forEach(element => {
        element.textContent = text;
      });
    });
  }

  async function loadSchedule() {
    if (loading) return;
    loading = true;

    try {
      const response = await fetch('sessions.json', {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) throw new Error('Schedule  loadSchedule();

  // Keep an open page current across midnight on Saturday.
  setInterval(updateDisplay, 15000);

  // Pick up changes made to the Google Sheet.
  setInterval(loadSchedule, 5 * 60 * 1000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateDisplay();
      loadSchedule();
    }
  });
})(); unavailable');

      const config = await response.json();

      if (!Array.isArray(config.sessions)) {
        throw new Error('Invalid schedule configuration');
      }

      let updatedSessions = config.sessions;

      if (config.sourceCsvUrl) {
        const url = new URL(config.sourceCsvUrl);

        if (
          url.protocol !== 'https:' ||
          url.hostname !== 'docs.google.com'
        ) {
          throw new Error('Invalid schedule address');
        }

        const csvResponse = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.timeout(10000)
        });

        if (!csvResponse.ok) {
          throw new Error('Published schedule unavailable');
        }

        updatedSessions = parseCsv(await csvResponse.text());
      }

      sessions = updatedSessions;
    } catch (error) {
      sessions = [];
      console.warn('Could not load session dates:', error.message);
    } finally {
      loading = false;
      updateDisplay();
    }
  }
  loadSchedule();

  // Keep an open page current across midnight on Saturday.
  setInterval(updateDisplay, 15000);

  // Pick up changes made to the Google Sheet.
  setInterval(loadSchedule, 5 * 60 * 1000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateDisplay();
      loadSchedule();
    }
  });
})();
