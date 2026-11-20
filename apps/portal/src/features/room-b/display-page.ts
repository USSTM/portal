// Standalone HTML avoids depending on the portal bundle or modern Tailwind
// features on BrightSign players running older Chromium versions.
export const roomBDisplayScript = String.raw`
(function () {
  var snapshot = null, failed = false, stopped = false, pending = false;
  var retryTimer, timeoutTimer, controller;
  var cacheKey = 'usstm-room-b-display-v1';
  var dateFormat = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'});
  var clockFormat = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Toronto',hour:'numeric',minute:'2-digit'});
  var dayFormat = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Toronto',weekday:'long',month:'long',day:'numeric'});
  var hourFormat = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Toronto',hour:'2-digit',hourCycle:'h23'});
  function node(id) { return document.getElementById(id); }
  function text(id, value) { node(id).textContent = value; }
  function validReservation(row) {
    return row && typeof row.ownerLabel === 'string' && typeof row.date === 'string' &&
      Number.isFinite(Date.parse(row.startAt)) && Number.isFinite(Date.parse(row.endAt)) && Date.parse(row.endAt) > Date.parse(row.startAt);
  }
  function valid(data) {
    return data && /^\d{4}-\d{2}-\d{2}$/.test(data.date) && Number.isFinite(Date.parse(data.updatedAt)) &&
      Array.isArray(data.reservations) && data.reservations.length <= 14 && data.reservations.every(validReservation) &&
      (data.nextReservation === null || validReservation(data.nextReservation));
  }
  function times(row) { return clockFormat.format(new Date(row.startAt)) + ' – ' + clockFormat.format(new Date(row.endAt)); }
  function render() {
    var now = new Date(), today = dateFormat.format(now), stamp = now.getTime();
    text('clock', clockFormat.format(now)); text('date', dayFormat.format(now));
    var stale = failed || !snapshot || stamp - Date.parse(snapshot.updatedAt) > 210000;
    node('warning').hidden = !stale;
    text('warning', snapshot ? 'Connection warning · Showing the last loaded schedule. Updates retry automatically.' : 'Schedule unavailable · Connecting and retrying automatically.');
    text('updated', snapshot ? 'Last updated ' + dayFormat.format(new Date(snapshot.updatedAt)) + ', ' + clockFormat.format(new Date(snapshot.updatedAt)) : 'Waiting for the first update');
    var weekday = new Date(today + 'T12:00:00Z').getUTCDay();
    var hour = Number(hourFormat.format(now));
    var open = weekday !== 0 && weekday !== 6 && hour >= 8 && hour < 22;
    var matchesToday = snapshot && snapshot.date === today;
    var rows = matchesToday ? snapshot.reservations : [];
    var current = rows.find(function (row) { return Date.parse(row.startAt) <= stamp && Date.parse(row.endAt) > stamp; });
    var candidates = rows.concat(snapshot && snapshot.nextReservation ? [snapshot.nextReservation] : []);
    var next = candidates.filter(function (row) { return Date.parse(row.startAt) > stamp; }).sort(function (a,b) {return Date.parse(a.startAt)-Date.parse(b.startAt);})[0];
    var status = !open ? 'Outside booking hours' : !matchesToday ? 'Schedule unavailable' : current ? 'Currently reserved' : 'Available now';
    text('status', status + (open && matchesToday && stale ? ' · Last known' : ''));
    node('status-card').className = !open ? 'status closed' : !matchesToday || stale ? 'status uncertain' : current ? 'status reserved' : 'status available';
    text('current', current ? current.ownerLabel : !open ? 'Monday–Friday · 8 AM–10 PM' : matchesToday ? 'EPH 442B' : 'Waiting for today’s schedule');
    text('until', current ? 'Until ' + clockFormat.format(new Date(current.endAt)) : '');
    text('next-name', next ? next.ownerLabel : 'No upcoming reservation loaded');
    text('next-time', next ? (next.date !== today ? dayFormat.format(new Date(next.startAt)) + ' · ' : '') + times(next) : '');
    text('schedule-title', matchesToday ? 'Today’s schedule' : snapshot ? 'Last loaded schedule · ' + snapshot.date : 'Today’s schedule');
    var list = node('reservations');
    while (list.firstChild) list.removeChild(list.firstChild);
    var displayed = snapshot ? snapshot.reservations : [];
    if (!displayed.length) {
      var empty = document.createElement('p'); empty.className = 'empty';
      empty.textContent = matchesToday ? 'No bookings today' : snapshot ? 'No bookings in the last loaded schedule' : 'Loading schedule…'; list.appendChild(empty);
    }
    displayed.forEach(function (row) {
      var item = document.createElement('div'); item.className = 'reservation' + (matchesToday && Date.parse(row.startAt) <= stamp && Date.parse(row.endAt) > stamp ? ' active' : '');
      var time = document.createElement('span'); time.className = 'time'; time.textContent = times(row);
      var name = document.createElement('span'); name.className = 'name'; name.textContent = row.ownerLabel;
      item.appendChild(time); item.appendChild(name); list.appendChild(item);
    });
  }
  function refresh() {
    if (pending || stopped) return;
    clearTimeout(retryTimer); pending = true; controller = new AbortController();
    timeoutTimer = setTimeout(function () { controller.abort(); }, 20000);
    fetch('/api/v1/room-b/display', {cache:'no-store',credentials:'omit',signal:controller.signal})
      .then(function (response) { if (!response.ok) throw new Error('Refresh failed'); return response.json(); })
      .then(function (data) {
        if (stopped) return;
        if (!valid(data)) throw new Error('Invalid schedule');
        snapshot = data; failed = false;
        try { localStorage.setItem(cacheKey, JSON.stringify(snapshot)); } catch (ignored) {}
      })
      .catch(function () { if (!stopped) failed = true; })
      .then(function () {
        clearTimeout(timeoutTimer); pending = false;
        if (!stopped) { render(); retryTimer = setTimeout(refresh, 180000); }
      });
  }
  try { var cached = JSON.parse(localStorage.getItem(cacheKey)); if (valid(cached)) { snapshot = cached; failed = true; } } catch (ignored) {}
  render(); refresh();
  var lastDate = dateFormat.format(new Date());
  var clockTimer = setInterval(function () {
    render();
    var currentDate = dateFormat.format(new Date());
    if (currentDate !== lastDate) { lastDate = currentDate; refresh(); }
  }, 10000);
  window.addEventListener('online', refresh);
  return function () { stopped = true; clearTimeout(retryTimer); clearTimeout(timeoutTimer); clearInterval(clockTimer); if (controller) controller.abort(); window.removeEventListener('online', refresh); };
})()
`

export const roomBDisplayHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EPH 442B · Room Schedule</title>
<style>
/* Match the portal light theme using colors supported by older Chromium. */
:root{--background:#ffffff;--foreground:#0a0a0a;--primary:#002956;--secondary:#f5f5f5;--muted-foreground:#737373;--border:#e5e5e5;--primary-soft:rgba(0,41,86,.05);--destructive:#e7000b}
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:var(--background);color:var(--foreground);font-family:Arial,Helvetica,sans-serif}body{display:flex;align-items:center;justify-content:center}
.screen{width:100vw;height:56.25vw;max-height:100vh;max-width:177.7778vh;padding:2.5vw;display:flex;flex-direction:column;overflow:hidden}header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5vw}h1{font-size:2.8vw;margin:0;color:var(--primary)}h2{font-size:1.6vw;margin:0 0 1vw}.eyebrow{font-size:1.1vw;color:var(--muted-foreground);letter-spacing:.1em;margin-bottom:.4vw}#clock{font-size:3vw;text-align:right;font-weight:bold}#date{font-size:1.2vw;color:var(--muted-foreground)}.content{display:flex;flex:1;min-height:0;gap:2vw}.summary{width:37%;display:flex;flex-direction:column;gap:1.5vw}.status,.next{padding:2vw;border-radius:1vw;background:var(--secondary)}.status{border-left:.6vw solid var(--border);min-height:16vw}.available{border-color:var(--muted-foreground)}.reserved{border-color:var(--primary);background:var(--primary-soft)}.uncertain{border-color:var(--destructive)}.status h2{font-size:2.5vw;margin-bottom:1.5vw}#current{font-size:2vw;overflow-wrap:break-word}#until,#next-time{font-size:1.3vw;color:var(--muted-foreground);margin-top:1vw}#next-name{font-size:1.8vw;overflow-wrap:break-word}.schedule{flex:1;min-width:0;padding:1.5vw;background:var(--secondary);border-radius:1vw;display:flex;flex-direction:column}#reservations{display:flex;flex-direction:column;flex:1;min-height:0}.reservation{display:flex;align-items:center;gap:1vw;padding:.45vw .7vw;flex:1;min-height:0;border-bottom:1px solid var(--border);font-size:1.15vw}.reservation.active{background:var(--primary-soft);color:var(--primary);border-radius:.3vw}.time{width:14vw;flex-shrink:0;color:var(--muted-foreground)}.name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.empty{font-size:2vw;color:var(--muted-foreground);margin:auto}footer{font-size:1vw;color:var(--muted-foreground);margin-top:1vw;display:flex;flex-direction:column;gap:.5vw}#warning{color:var(--destructive)} [hidden]{display:none!important}
</style></head><body><main class="screen">
<header><div><div class="eyebrow">USSTM · ROOM BOOKING</div><h1>EPH 442B</h1></div><div><div id="clock"></div><div id="date"></div></div></header>
<div class="content"><div class="summary"><section id="status-card" class="status"><h2 id="status">Loading schedule…</h2><div id="current"></div><div id="until"></div></section><section class="next"><h2>Next reservation</h2><div id="next-name"></div><div id="next-time"></div></section></div><section class="schedule"><h2 id="schedule-title">Today’s schedule</h2><div id="reservations"></div></section></div>
<footer><div id="warning" role="status">Connecting to schedule…</div><div id="updated">Waiting for the first update</div><div>All times Toronto · Schedule refreshes every three minutes</div></footer>
</main><script>${roomBDisplayScript}</script></body></html>`
