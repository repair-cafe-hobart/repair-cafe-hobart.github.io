(function () {
  'use strict';
  const container = document.getElementById('repair-statistics');
  if (!container) return;
  const status = document.getElementById('repair-stats-status');
  let busy = false;
  function period() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'Australia/Hobart', year:'numeric',month:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
    return {month:parts.year+'-'+parts.month,year:parts.year};
  }
  function unavailable() {
    container.querySelectorAll('[data-repair-stat]').forEach(el=>{el.textContent='—';});
    status.textContent='Statistics are temporarily unavailable. Please check back shortly.';
  }
  async function refresh() {
    if (busy) return;
    busy = true;
    let script, timer;
    try {
      const response = await fetch('repair-stats-config.json', {cache:'no-store',signal:AbortSignal.timeout(15000)});
      if (!response.ok) throw Error('Configuration unavailable');
      const config = await response.json();
      const url = new URL(config.url);
      if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)) throw Error('Invalid feed URL');
      const data = await new Promise((resolve,reject)=>{
        window.rchStatsReceive = resolve;
        script = document.createElement('script');
        url.searchParams.set('callback','rchStatsReceive');
        url.searchParams.set('_',Date.now());
        script.src=url.href;
        script.onerror=()=>reject(Error('Feed unavailable'));
        timer=setTimeout(()=>reject(Error('Feed timeout')),25000);
        document.head.append(script);
      });
      const current = period();
      if (!data || data.error || data.monthKey!==current.month || data.yearKey!==current.year ||
          !['month','year','all'].every(key=>Number.isSafeInteger(data[key])&&data[key]>=0) ||
          data.month>data.year || data.year>data.all || !/^\d{4}-\d{2}-\d{2}$/.test(data.asOf||'')) throw Error('Invalid totals');
      container.querySelectorAll('[data-repair-stat]').forEach(el=>{el.textContent=data[el.dataset.repairStat].toLocaleString('en-AU');});
      const date = new Date(data.asOf+'T12:00:00Z');
      status.textContent='Recorded repairs through '+date.toLocaleDateString('en-AU',{timeZone:'Australia/Hobart',day:'numeric',month:'long',year:'numeric'})+'. Totals update automatically.';
    } catch (error) {
      unavailable();
    } finally {
      clearTimeout(timer);
      if (script) script.remove();
      window.rchStatsReceive=()=>{};
      busy=false;
    }
  }
  refresh();
  setInterval(refresh,300000);
  document.addEventListener('visibilitychange',()=>{if (!document.hidden) refresh();});
})();