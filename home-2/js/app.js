/*
  Johns Malta - homepage prototype interactions.
  Mock pricing and availability stand in for the codevlabs API.
*/
(function () {
  'use strict';

  const D = window.JM;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const icon = (id, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const euro = (n) => '€' + Math.round(n).toLocaleString('en-GB');
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ħ]/g, 'h').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

  /* ---------- dates ---------- */
  const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (n, from) => { const d = from ? new Date(from) : new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
  const parseISO = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1, 12); };
  const fmtDate = (s, withYear) => s ? parseISO(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined }) : '';
  const fmtTime = (t) => t || '';

  function initDates() {
    const todayIso = isoLocal(new Date());
    $$('[data-date]').forEach((input) => {
      const off = Number(input.dataset.offset || 1);
      input.min = todayIso;
      if (!input.value) {
        let d = addDays(off);
        if (off >= 90) while (d.getDay() !== 6) d = addDays(1, d); // wedding dates default to a Saturday
        input.value = isoLocal(d);
      }
    });
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('[data-toast]');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  /* ==========================================================================
     Places + pricing
     ========================================================================== */
  const vehicleById = Object.fromEntries(D.vehicles.map((v) => [v.id, v]));
  const hourlyVehicles = D.vehicles.filter((v) => v.id !== 'economy');
  const routeByNorm = new Map(D.routes.map((r) => [norm(r.name), r]));

  const suggestions = [
    { label: D.AIRPORT, sub: 'Luqa · Meet & greet in arrivals', icon: 'i-plane', kind: 'airport' },
    ...D.routes.map((r) => ({ label: r.name, sub: `${r.mins} min from the airport`, icon: r.name.includes('Port') || r.name.includes('ferry') ? 'i-route' : 'i-pin', kind: 'locality', route: r })),
    ...D.places.filter((p) => !p.airport).map((p) => ({ label: p.name, sub: `Hotel · ${p.area}`, icon: 'i-pin', kind: 'hotel', area: p.area }))
  ];

  function resolvePlace(label) {
    const n = norm(label);
    if (!n) return null;
    if (n === norm(D.AIRPORT) || /\b(airport|mla|luqa)\b/.test(n)) return 'airport';
    if (routeByNorm.has(n)) return routeByNorm.get(n);
    const place = D.places.find((p) => norm(p.name) === n);
    if (place) return routeByNorm.get(norm(place.area)) || null;
    // fuzzy: free text containing a locality name ("Triq il-Kbira, Sliema")
    const hit = D.routes.find((r) => n.includes(norm(r.name).split(' ')[0]) && norm(r.name).split(' ')[0].length > 3);
    return hit || null;
  }

  function transferBase(from, to) {
    const a = resolvePlace(from);
    const b = resolvePlace(to);
    if (!a || !b || (a === 'airport' && b === 'airport')) return null;
    if (a === 'airport') return { price: b.price, mins: b.mins, airport: 'pickup' };
    if (b === 'airport') return { price: a.price, mins: a.mins, airport: 'dropoff' };
    if (a === b) return { price: 15, mins: 10, airport: null };
    return { price: Math.max(15, Math.round(Math.max(a.price, b.price) * 0.9)), mins: Math.max(12, Math.round(Math.abs(a.mins - b.mins) + 12)), airport: null };
  }
  const vehiclePrice = (base, vid) => Math.round(base * vehicleById[vid].mult);

  /* ==========================================================================
     State
     ========================================================================== */
  const S = {
    service: 'transfer',
    mode: 'book',
    step: 0,
    transfer: { from: D.AIRPORT, to: '', date: '', time: '12:00', ret: false, retDate: '', retTime: '10:00', adults: 2, children: 0, bags: 2, vehicle: 'economy', extras: { childSeat: 0, booster: 0, stop: 0, sport: 0 }, flight: '', flightLater: false, meet: true },
    hourly: { from: '', date: '', time: '09:00', hours: 3, vehicle: 'executive', plan: '' },
    tour: { id: D.tours[0].id, date: '', guests: 2, pickup: '', lang: 'English' },
    wedding: { date: '', carId: D.cars[0].id, hours: 3, champagne: false, ceremony: '', reception: '', pay: 'deposit' },
    contact: { name: '', email: '', cc: '+356', phone: '', notes: '', invoice: false, company: '', vat: '', marketing: false },
    payMethod: 'card',
    code: ''
  };

  /* ==========================================================================
     Steppers (delegated)
     ========================================================================== */
  function stepperValue(el) { return Number($('output', el).textContent); }
  function setStepper(el, value) {
    const min = Number(el.dataset.min), max = Number(el.dataset.max);
    const v = Math.min(max, Math.max(min, value));
    $('output', el).textContent = v;
    const [dec, inc] = $$('button', el);
    dec.disabled = v <= min;
    inc.disabled = v >= max;
    return v;
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-step]');
    if (!btn) return;
    const el = btn.closest('[data-stepper]');
    const v = setStepper(el, stepperValue(el) + Number(btn.dataset.step));
    onStepper(el.dataset.stepper, v, el);
  });

  function onStepper(name, v, el) {
    switch (name) {
      case 'adults': case 'children': case 'bags':
        S.transfer[name] = v; updatePaxSummary(); updateHints(); break;
      case 'hours': S.hourly.hours = v; updateHints(); break;
      case 'guests': S.tour.guests = v; updateHints(); break;
      case 'calcHours': calc.hours = v; renderCalc(); break;
      case 'sheetHours': S.hourly.hours = v; renderSummary(); break;
      case 'sheetGuests': S.tour.guests = v; renderSheet(); break;
      case 'weddingHours': S.wedding.hours = v; renderSummary(); break;
      default:
        if (name.startsWith('extra:')) { S.transfer.extras[name.slice(6)] = v; renderSummary(); }
    }
  }

  /* ==========================================================================
     Combobox (location autocomplete)
     ========================================================================== */
  function setupCombo(field) {
    if (field.dataset.ready) return;
    field.dataset.ready = '1';
    const input = $('input', field);
    const list = $('.combo-list', field);
    const clear = $('.field-clear', field);
    let items = [];
    let active = -1;

    const sync = () => field.classList.toggle('has-value', !!input.value);
    sync();

    function otherValue() {
      if (input.id === 'tfFrom') return $('#tfTo').value;
      if (input.id === 'tfTo') return $('#tfFrom').value;
      return '';
    }

    function build() {
      const q = norm(input.value);
      const isChosen = input.value && input.dataset.chosen === input.value;
      const other = otherValue();
      const otherIsAirport = resolvePlace(other) === 'airport';
      let out = [];
      if (!q || isChosen) {
        out.push({ head: 'Popular' });
        if (resolvePlace(other) !== 'airport') out.push(suggestions[0]);
        out.push(...suggestions.filter((s) => s.kind === 'locality' && s.route.top).slice(0, 6));
      } else {
        const scored = suggestions
          .map((s) => {
            const l = norm(s.label);
            const score = l.startsWith(q) ? 0 : l.includes(' ' + q) ? 1 : l.includes(q) ? 2 : norm(s.sub).includes(q) ? 3 : -1;
            return { s, score };
          })
          .filter((x) => x.score >= 0)
          .sort((a, b) => a.score - b.score)
          .slice(0, 8)
          .map((x) => x.s);
        out = scored.length ? scored : [{ empty: true }];
      }
      items = out;
      active = -1;
      list.innerHTML = out.map((s, i) => {
        if (s.head) return `<li class="cl-head" role="presentation">${s.head}</li>`;
        if (s.empty) return `<li class="cl-empty" role="presentation">No match. Keep typing your full address, we will confirm the fare.</li>`;
        const route = s.route || (s.area && routeByNorm.get(norm(s.area)));
        const price = otherIsAirport && route && input.id !== 'hrFrom' ? `<span class="cl-price">${euro(route.price)}</span>` : '';
        const thumb = s.route && s.route.img ? `<span class="cl-ic cl-img"><img src="${s.route.img}" alt="" loading="lazy" width="34" height="34"></span>` : `<span class="cl-ic">${icon(s.icon)}</span>`;
        return `<li role="option" id="${input.id}-opt-${i}" data-i="${i}" aria-selected="false">${thumb}<span class="cl-text"><strong>${esc(s.label)}</strong><small>${esc(s.sub)}</small></span>${price}</li>`;
      }).join('');
    }

    function open() { build(); list.hidden = false; input.setAttribute('aria-expanded', 'true'); }
    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
    function choose(i) {
      const s = items[i];
      if (!s || s.head || s.empty) return;
      input.value = s.label;
      input.dataset.chosen = s.label;
      sync();
      close();
      field.classList.remove('is-invalid');
      const err = field.nextElementSibling;
      if (err && err.classList.contains('field-error')) err.remove();
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function move(dir) {
      const opts = items.map((s, i) => (s.head || s.empty ? -1 : i)).filter((i) => i >= 0);
      if (!opts.length) return;
      let idx = opts.indexOf(active);
      idx = idx === -1 ? (dir > 0 ? 0 : opts.length - 1) : (idx + dir + opts.length) % opts.length;
      active = opts[idx];
      $$('li[role="option"]', list).forEach((li) => li.setAttribute('aria-selected', String(Number(li.dataset.i) === active)));
      const li = $(`[data-i="${active}"]`, list);
      if (li) { li.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', li.id); }
    }

    input.addEventListener('focus', () => { open(); });
    input.addEventListener('input', () => { delete input.dataset.chosen; sync(); open(); updateHints(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) open(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { if (!list.hidden && active >= 0) { e.preventDefault(); choose(active); } }
      else if (e.key === 'Escape') { close(); }
    });
    input.addEventListener('blur', () => setTimeout(close, 120));
    list.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) choose(Number(li.dataset.i)); });
    if (clear) clear.addEventListener('mousedown', (e) => { e.preventDefault(); input.value = ''; delete input.dataset.chosen; sync(); open(); updateHints(); });
  }

  /* ==========================================================================
     Booker (hero)
     ========================================================================== */
  const booker = $('#booker');
  const tabs = $$('.bk-tab', booker);

  function selectTab(name, focus) {
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
    updateHints();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t.dataset.tab));
    t.addEventListener('keydown', (e) => {
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectTab(tabs[j].dataset.tab, true); }
    });
  });

  // trip type
  $$('input[name="tripType"]').forEach((r) => r.addEventListener('change', () => {
    S.transfer.ret = $('input[name="tripType"]:checked').value === 'return';
    $('.return-row').hidden = !S.transfer.ret;
    updateHints();
  }));

  // swap
  $('[data-swap]').addEventListener('click', (e) => {
    const a = $('#tfFrom'), b = $('#tfTo');
    [a.value, b.value] = [b.value, a.value];
    a.dataset.chosen = a.value;
    b.dataset.chosen = b.value;
    a.closest('.combo').classList.toggle('has-value', !!a.value);
    b.closest('.combo').classList.toggle('has-value', !!b.value);
    $('.field-ic use', a.closest('.field')).setAttribute('href', resolvePlace(a.value) === 'airport' ? '#i-plane' : '#i-pin');
    $('.field-ic use', b.closest('.field')).setAttribute('href', resolvePlace(b.value) === 'airport' ? '#i-plane' : '#i-pin');
    e.currentTarget.classList.toggle('is-spun');
    updateHints();
  });
  ['#tfFrom', '#tfTo'].forEach((sel) => $(sel).addEventListener('change', (e) => {
    $('.field-ic use', e.target.closest('.field')).setAttribute('href', resolvePlace(e.target.value) === 'airport' ? '#i-plane' : '#i-pin');
    updateHints();
  }));

  // passengers popover
  const paxWrap = $('[data-pax]');
  const paxToggle = $('.pax-toggle', paxWrap);
  const paxPop = $('.pax-pop', paxWrap);
  function setPax(open) { paxPop.hidden = !open; paxToggle.setAttribute('aria-expanded', String(open)); }
  paxToggle.addEventListener('click', () => setPax(paxPop.hidden));
  $('[data-pax-done]').addEventListener('click', () => { setPax(false); paxToggle.focus(); });
  document.addEventListener('click', (e) => { if (!paxPop.hidden && !paxWrap.contains(e.target)) setPax(false); });
  paxWrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setPax(false); paxToggle.focus(); } });
  function updatePaxSummary() {
    const t = S.transfer;
    const pax = t.adults + t.children;
    $('[data-pax-summary]').textContent = `${pax} passenger${pax > 1 ? 's' : ''} · ${t.bags} bag${t.bags === 1 ? '' : 's'}`;
  }

  // hourly vehicle chips
  const hrChips = $('[data-chip-group="hrVehicle"]');
  hrChips.setAttribute('role', 'radiogroup');
  hrChips.setAttribute('aria-label', 'Vehicle class');
  hrChips.innerHTML = hourlyVehicles.map((v) => `<button class="chip" type="button" role="radio" aria-checked="${v.id === S.hourly.vehicle}" data-v="${v.id}">${v.name} <small>${euro(v.hourly)}/h</small></button>`).join('');
  hrChips.addEventListener('click', (e) => {
    const c = e.target.closest('[data-v]');
    if (!c) return;
    S.hourly.vehicle = c.dataset.v;
    $$('[data-v]', hrChips).forEach((x) => x.setAttribute('aria-checked', String(x === c)));
    updateHints();
  });

  // tour & wedding selects
  const tourSel = $('#trTour');
  tourSel.innerHTML = D.tours.map((t) => `<option value="${t.id}">${esc(t.name)} · ${t.hours}h</option>`).join('');
  tourSel.addEventListener('change', () => { S.tour.id = tourSel.value; updateHints(); });

  const carOptions = `<option value="any">Any available classic car</option>` + D.cars.map((c) => `<option value="${c.id}">${esc(c.name)} (${c.year})</option>`).join('');
  $('#wdCar').innerHTML = carOptions;
  $('#wdCar').addEventListener('change', updateHints);

  function updateHints() {
    // transfer
    const f = $('#tfFrom').value, to = $('#tfTo').value;
    const base = transferBase(f, to);
    const th = $('[data-hint="transfer"]');
    if (base) {
      const p = base.price * (S.transfer.ret ? 2 : 1);
      th.innerHTML = `<span>Fixed price from</span><strong>${euro(p)}</strong><span>${S.transfer.ret ? 'return' : 'one way'} · ~${base.mins} min</span><span class="ph-tag">${icon('i-check')}Free cancellation</span>`;
    } else {
      th.innerHTML = `<span>${icon('i-tag', 'ic ic-sm')} Enter your destination to see your fixed price</span>`;
    }
    // hourly
    const v = vehicleById[S.hourly.vehicle];
    $('[data-hint="hourly"]').innerHTML = `<strong>${euro(v.hourly * S.hourly.hours)}</strong><span>for ${S.hourly.hours} hours · ${v.name} at ${euro(v.hourly)}/h</span>`;
    // tour
    const tour = D.tours.find((t) => t.id === tourSel.value);
    const tq = tourPrice(tour, S.tour.guests);
    $('[data-hint="tour"]').innerHTML = `<strong>${euro(tq.total)}</strong><span>per vehicle · ${tq.vehicle.name} · ${tour.hours} hours</span>`;
    // wedding
    const carId = $('#wdCar').value;
    const car = D.cars.find((c) => c.id === carId);
    const from = car ? car.price : Math.min(...D.cars.map((c) => c.price));
    $('[data-hint="wedding"]').innerHTML = `<span>From</span><strong>${euro(from)}</strong><span>3 hours · €${D.wedding.deposit} deposit secures the date</span>`;
  }

  function tourPrice(tour, guests) {
    let vid = 'executive';
    if (guests > 3) vid = 'minivan';
    if (guests > 7) vid = 'carrier';
    const sur = vid === 'executive' ? 0 : D.tourSurcharge[tour.type][vid];
    return { base: tour.price, surcharge: sur, total: tour.price + sur, vehicle: vehicleById[vid] };
  }

  // validation helpers
  function fieldError(field, msg) {
    field.classList.add('is-invalid');
    let err = field.nextElementSibling;
    if (!err || !err.classList.contains('field-error')) {
      err = document.createElement('p');
      err.className = 'field-error';
      err.setAttribute('role', 'alert');
      field.insertAdjacentElement('afterend', err);
    }
    err.textContent = msg;
  }
  function clearErrors(scope) {
    $$('.is-invalid', scope).forEach((f) => f.classList.remove('is-invalid'));
    $$('.field-error', scope).forEach((e) => e.remove());
  }

  // hero submissions
  $$('.bk-panel').forEach((form) => form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(form);
    const type = form.dataset.form;
    if (type === 'transfer') {
      const from = $('#tfFrom'), to = $('#tfTo');
      let bad = null;
      if (!from.value.trim()) { fieldError($('.loc-stack'), 'Add a pickup location'); bad = from; }
      else if (!to.value.trim()) { fieldError($('.loc-stack'), 'Where are you going? Choose a hotel, address or locality'); bad = to; }
      else if (!transferBase(from.value, to.value)) { fieldError($('.loc-stack'), 'Choose a location from the list so we can show your fixed price'); bad = to; }
      if (bad) { bad.focus(); return; }
      Object.assign(S.transfer, { from: from.value, to: to.value, date: $('#tfDate').value, time: $('#tfTime').value, retDate: $('#tfRetDate').value, retTime: $('#tfRetTime').value });
      openBooking('transfer');
    } else if (type === 'hourly') {
      const from = $('#hrFrom');
      if (!from.value.trim()) { fieldError(from.closest('.field'), 'Add your pickup location'); from.focus(); return; }
      Object.assign(S.hourly, { from: from.value, date: $('#hrDate').value, time: $('#hrTime').value });
      openBooking('hourly');
    } else if (type === 'tour') {
      Object.assign(S.tour, { id: tourSel.value, date: $('#trDate').value });
      openBooking('tour');
    } else if (type === 'wedding') {
      showAvailability($('[data-avail-result="hero"]'), $('#wdDate').value, $('#wdCar').value);
    }
  }));

  /* ==========================================================================
     Routes list
     ========================================================================== */
  const routeList = $('[data-route-list]');
  const routeToggle = $('[data-routes-toggle]');
  const routeSearch = $('#routeSearch');
  let routeClass = 'economy', routesOpen = false;
  const slug = (s) => norm(s).replace(/ /g, '-');

  function renderRoutes() {
    const q = norm(routeSearch.value);
    let list = D.routes;
    if (q) list = list.filter((r) => norm(r.name).includes(q));
    else if (!routesOpen) list = list.filter((r) => r.top);
    const v = vehicleById[routeClass];
    routeList.innerHTML = list.length ? list.map((r) => `
      <li><a class="route-row" href="/airport-transfers/mla-to-${slug(r.name)}" data-route="${esc(r.name)}">
        <span class="rr-img">${r.img ? `<img src="${r.img}" alt="" loading="lazy" width="48" height="48">` : icon('i-plane')}</span>
        <span class="rr-text"><strong>${esc(r.name)}</strong><small>~${r.mins} min · ${v.seats} seats</small></span>
        <span class="rr-price"><b>${euro(vehiclePrice(r.price, routeClass))}</b><span>${v.name}</span></span>
        <span class="rr-go">${icon('i-arrow')}</span>
      </a></li>`).join('') : `<li class="route-empty">No fixed fare listed for “${esc(routeSearch.value)}”. Type it in the booking form and we will quote it instantly.</li>`;
    routeToggle.hidden = !!q;
    routeToggle.textContent = routesOpen ? 'Show popular destinations only' : `Show all ${D.routes.length} destinations`;
    routeToggle.setAttribute('aria-expanded', String(routesOpen));
  }
  routeSearch.addEventListener('input', renderRoutes);
  routeToggle.addEventListener('click', () => { routesOpen = !routesOpen; renderRoutes(); });
  $$('input[name="routeClass"]').forEach((r) => r.addEventListener('change', () => { routeClass = r.value; renderRoutes(); }));
  routeList.addEventListener('click', (e) => {
    const a = e.target.closest('[data-route]');
    if (!a) return;
    e.preventDefault();
    const tfTo = $('#tfTo'), tfFrom = $('#tfFrom');
    tfFrom.value = D.AIRPORT; tfFrom.dataset.chosen = D.AIRPORT;
    tfTo.value = a.dataset.route; tfTo.dataset.chosen = a.dataset.route;
    [tfFrom, tfTo].forEach((i) => i.closest('.combo').classList.add('has-value'));
    selectTab('transfer');
    Object.assign(S.transfer, { from: D.AIRPORT, to: a.dataset.route, date: $('#tfDate').value, time: $('#tfTime').value, vehicle: routeClass });
    openBooking('transfer', { keepVehicle: true });
  });

  // rail arrows (disabled at either end)
  const railButtons = $$('[data-rail-prev],[data-rail-next]');
  const syncRail = (rail) => {
    const max = rail.scrollWidth - rail.clientWidth - 2;
    railButtons.forEach((b) => {
      if ((b.dataset.railPrev || b.dataset.railNext) !== rail.id) return;
      b.disabled = b.dataset.railPrev ? rail.scrollLeft <= 2 : rail.scrollLeft >= max;
    });
  };
  railButtons.forEach((b) => {
    const rail = document.getElementById(b.dataset.railPrev || b.dataset.railNext);
    if (!rail) return;
    b.addEventListener('click', () => rail.scrollBy({ left: (b.dataset.railPrev ? -1 : 1) * rail.clientWidth * 0.8, behavior: reducedMotion ? 'auto' : 'smooth' }));
    if (rail.dataset.synced) return;
    rail.dataset.synced = '1';
    rail.addEventListener('scroll', () => syncRail(rail), { passive: true });
    window.addEventListener('resize', () => syncRail(rail));
    window.addEventListener('load', () => syncRail(rail));
  });

  /* ==========================================================================
     Hourly calculator
     ========================================================================== */
  const calc = { vehicle: 'executive', hours: 3 };
  const calcV = $('[data-calc-vehicles]');
  calcV.innerHTML = hourlyVehicles.map((v) => `
    <label class="cv-opt"><input type="radio" name="calcVehicle" value="${v.id}" ${v.id === calc.vehicle ? 'checked' : ''}>
      <span class="cv-card"><strong>${esc(v.name)}</strong><small>${v.seats} seats · ${esc(v.model.replace(' or similar', ''))}</small><b>${euro(v.hourly)}<span>/hour</span></b></span>
    </label>`).join('');
  calcV.addEventListener('change', (e) => { calc.vehicle = e.target.value; renderCalc(); });
  function renderCalc() {
    const v = vehicleById[calc.vehicle];
    $('[data-calc-sum]').innerHTML = `
      <div><dt>${esc(v.name)} chauffeur</dt><dd>${euro(v.hourly)} × ${calc.hours} h</dd></div>
      <div><dt>Fuel, parking, water &amp; Wi-Fi</dt><dd>Included</dd></div>
      <div><dt>Extra time if needed</dt><dd>${euro(v.hourly / 2)} per 30 min</dd></div>
      <div class="total"><dt>Total</dt><dd>${euro(v.hourly * calc.hours)}</dd></div>`;
    $('[data-calc-book]').textContent = `Book ${calc.hours} hours for ${euro(v.hourly * calc.hours)}`;
  }
  $('[data-calc-book]').addEventListener('click', () => {
    Object.assign(S.hourly, { vehicle: calc.vehicle, hours: calc.hours, from: $('#hrFrom').value, date: $('#hrDate').value, time: $('#hrTime').value });
    openBooking('hourly');
  });

  /* ==========================================================================
     Tours
     ========================================================================== */
  const tourGrid = $('[data-tour-grid]');
  function renderTours(filter) {
    const list = D.tours.filter((t) => filter === 'all' || t.type === filter);
    tourGrid.innerHTML = list.map((t) => `
      <article class="tour-card">
        <div class="tour-media">
          <img src="${t.img}" alt="${esc(t.name)}" loading="lazy" width="900" height="675">
          <span class="tour-tag">${icon('i-clock')}${t.type === 'half' ? 'Half day' : 'Full day'} · ${t.hours}h</span>
        </div>
        <div class="tour-body">
          <div class="tour-rating"><svg aria-hidden="true"><use href="#i-star"/></svg><b>${t.rating.toFixed(1)}</b> (${t.reviews} reviews)</div>
          <h3>${esc(t.name)}</h3>
          <ul class="tour-stops">${t.stops.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          <div class="tour-foot">
            <div class="tour-price"><small>Private, per vehicle</small><b>${euro(t.price)} <span>up to 3</span></b></div>
            <button class="btn btn-dark btn-sm" type="button" data-book-tour="${t.id}">Book</button>
          </div>
        </div>
      </article>`).join('') + `
      <article class="tour-card tour-custom">
        <div class="tour-body">
          <span class="tc-ic">${icon('i-sparkle')}</span>
          <h3>Build your own tour</h3>
          <p>Pick the places, the pace and the stops. A local expert sends a fixed price, usually within 2 hours.</p>
          <ul class="tc-list">
            <li>${icon('i-check')}Any mix of Malta, Gozo &amp; Comino</li>
            <li>${icon('i-check')}Half day, full day or several days</li>
            <li>${icon('i-check')}No payment until you approve</li>
          </ul>
          <button class="btn btn-gold" type="button" data-open-custom-tour>Request my tour</button>
        </div>
      </article>`;
  }
  $('[data-tour-filter]').addEventListener('click', (e) => {
    const c = e.target.closest('[data-filter]');
    if (!c) return;
    $$('[data-filter]').forEach((x) => { const on = x === c; x.classList.toggle('is-active', on); x.setAttribute('aria-checked', String(on)); });
    renderTours(c.dataset.filter);
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-book-tour]');
    if (!b) return;
    S.tour.id = b.dataset.bookTour;
    S.tour.date = $('#trDate').value;
    tourSel.value = S.tour.id;
    openBooking('tour');
  });

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
  function availability(date, carId) {
    const d = parseISO(date);
    const dow = d.getDay(), m = d.getMonth();
    const peak = m >= 4 && m <= 9;
    const pressure = (dow === 6 ? 45 : dow === 5 || dow === 0 ? 22 : 4) + (peak ? 25 : 0);
    const h = hash(date + carId) % 100;
    if (carId === 'any') return h < pressure / 3 ? 'limited' : 'ok';
    if (h < pressure * 0.55) return 'booked';
    if (h < pressure) return 'limited';
    return 'ok';
  }

  function showAvailability(box, date, carId) {
    if (!date) { toast('Choose your wedding date first'); return; }
    const status = availability(date, carId);
    const car = D.cars.find((c) => c.id === carId);
    const carName = car ? `${car.name} (${car.year})` : 'A classic car';
    const when = fmtDate(date, true);
    box.className = 'avail-result ' + status;
    box.hidden = false;
    const ctx = `data-date="${date}" data-car="${carId}"`;
    if (status === 'booked') {
      const alts = D.cars.filter((c) => c.id !== carId && availability(date, c.id) === 'ok').slice(0, 3);
      const near = [-7, 7, 14].map((n) => isoLocal(addDays(n, parseISO(date)))).filter((x) => x >= isoLocal(new Date()));
      box.innerHTML = `
        <div class="ar-head">${icon('i-x')}Booked on ${esc(when)}</div>
        <p>${esc(carName)} is already reserved that day.${alts.length ? ' These cars are still free:' : ''}</p>
        ${alts.length ? `<div class="ar-alt">${alts.map((c) => `<button class="chip" type="button" data-alt-car="${c.id}" data-date="${date}">${esc(c.name)} ${c.year}</button>`).join('')}</div>` : ''}
        <p style="margin-top:10px">Or try another date:</p>
        <div class="ar-alt">${near.map((n) => `<button class="chip" type="button" data-alt-date="${n}" data-car="${carId}">${esc(fmtDate(n))}</button>`).join('')}</div>`;
    } else {
      const price = car ? car.price : Math.min(...D.cars.map((c) => c.price));
      box.innerHTML = `
        <div class="ar-head">${icon(status === 'ok' ? 'i-check' : 'i-info')}${status === 'ok' ? 'Available' : 'Limited'} on ${esc(when)}</div>
        <p>${status === 'ok' ? `${esc(carName)} is free. From ${euro(price)} with 3 hours, ribbons and a chauffeur in livery.` : `${esc(carName)} is free for morning ceremonies only (before 13:00). Reserve now to hold it.`}</p>
        <div class="ar-actions">
          <button class="btn btn-dark btn-block" type="button" data-reserve ${ctx}>Reserve with €${D.wedding.deposit} deposit</button>
          <button class="btn btn-outline btn-block" type="button" data-enquire ${ctx}>Send an enquiry instead</button>
        </div>`;
    }
  }

  document.addEventListener('click', (e) => {
    const alt = e.target.closest('[data-alt-car],[data-alt-date]');
    if (alt) {
      const box = alt.closest('.avail-result');
      const date = alt.dataset.altDate || alt.dataset.date;
      const car = alt.dataset.altCar || alt.dataset.car;
      $('#wdDate').value = date;
      $('#wdCar').value = car;
      showAvailability(box, date, car);
      return;
    }
    const r = e.target.closest('[data-reserve],[data-enquire]');
    if (!r) return;
    const carId = r.dataset.car === 'any' ? D.cars[0].id : r.dataset.car;
    Object.assign(S.wedding, { date: r.dataset.date, carId });
    openBooking('wedding', { mode: r.hasAttribute('data-enquire') ? 'enquiry' : 'book' });
  });

  /* ==========================================================================
     Booking sheet
     ========================================================================== */
  const sheet = $('#bookingSheet');
  const body = $('[data-sheet-body]', sheet);
  const summary = $('[data-sheet-summary]', sheet);
  const nextBtn = $('[data-sheet-next]', sheet);
  const backBtn = $('[data-sheet-back]', sheet);
  const totalEl = $('[data-sheet-total]', sheet);
  const sumToggle = $('[data-summary-toggle]', sheet);

  const STEP = {
    vehicle: { label: 'Vehicle', title: 'Choose your vehicle' },
    extras: { label: 'Flight & extras', title: 'Flight details & extras' },
    hourly: { label: 'Chauffeur', title: 'Vehicle & duration' },
    tour: { label: 'Tour', title: 'Your private tour' },
    wedding: { label: 'Car & package', title: 'Your wedding car' },
    details: { label: 'Your details', title: 'Your contact details' },
    pay: { label: 'Payment', title: 'Review & pay' }
  };
  const KICKER = { transfer: 'Airport transfer', hourly: 'Chauffeur by the hour', tour: 'Private tour', wedding: 'Wedding & vintage car' };

  function flow() {
    if (S.service === 'transfer') return ['vehicle', 'extras', 'details', 'pay'];
    if (S.service === 'hourly') return ['hourly', 'details', 'pay'];
    if (S.service === 'tour') return ['tour', 'details', 'pay'];
    return S.mode === 'enquiry' ? ['wedding', 'details'] : ['wedding', 'details', 'pay'];
  }
  const isDone = () => S.step >= flow().length;

  function fits(v) {
    const t = S.transfer;
    return v.seats >= t.adults + t.children && v.bags >= t.bags;
  }

  function quote() {
    const lines = [];
    let total = 0, due = null;
    if (S.service === 'transfer') {
      const t = S.transfer;
      const base = transferBase(t.from, t.to) || { price: 15 };
      const one = vehiclePrice(base.price, t.vehicle);
      lines.push([`${vehicleById[t.vehicle].name}, one way`, one]);
      total += one;
      if (t.ret) { lines.push(['Return trip', one]); total += one; }
      D.extras.forEach((x) => {
        const q = t.extras[x.id];
        if (q) { const amt = q * x.price * (t.ret && x.id !== 'stop' ? 2 : 1); lines.push([`${x.name} × ${q}${t.ret && x.id !== 'stop' ? ' (both ways)' : ''}`, amt]); total += amt; }
      });
      if (base.airport === 'pickup' && t.meet) lines.push(['Meet & greet', 0]);
    } else if (S.service === 'hourly') {
      const v = vehicleById[S.hourly.vehicle];
      const amt = v.hourly * S.hourly.hours;
      lines.push([`${v.name} · ${S.hourly.hours} h × ${euro(v.hourly)}`, amt]);
      total += amt;
    } else if (S.service === 'tour') {
      const tour = D.tours.find((x) => x.id === S.tour.id);
      const q = tourPrice(tour, S.tour.guests);
      lines.push([`${tour.name}`, q.base]);
      if (q.surcharge) lines.push([`${q.vehicle.name} for ${S.tour.guests} guests`, q.surcharge]);
      if (tour.id === 'gozo') lines.push(['Ferry tickets', 0]);
      total += q.total;
    } else {
      const w = S.wedding;
      const car = D.cars.find((c) => c.id === w.carId);
      lines.push([`${car.name} · 3 hours`, car.price]);
      total += car.price;
      if (w.hours > 3) { const amt = (w.hours - 3) * D.wedding.extraHour; lines.push([`Extra ${w.hours - 3} h`, amt]); total += amt; }
      if (w.champagne) { lines.push(['Champagne on board', D.wedding.champagne]); total += D.wedding.champagne; }
      lines.push(['Ribbons & bows', 0]);
      if (S.mode === 'enquiry') due = 0;
      else due = w.pay === 'deposit' ? D.wedding.deposit : total;
    }
    return { lines, total, due: due == null ? total : due };
  }

  function openBooking(service, opts = {}) {
    S.service = service;
    S.mode = opts.mode || 'book';
    S.step = 0;
    if (service === 'transfer' && !opts.keepVehicle) {
      if (!fits(vehicleById[S.transfer.vehicle])) S.transfer.vehicle = (D.vehicles.find(fits) || D.vehicles[D.vehicles.length - 1]).id;
    }
    if (service === 'transfer' && !fits(vehicleById[S.transfer.vehicle])) S.transfer.vehicle = (D.vehicles.find(fits) || D.vehicles[0]).id;
    if (service === 'tour' && !S.tour.date) S.tour.date = $('#trDate').value;
    if (service === 'hourly' && !S.hourly.date) S.hourly.date = $('#hrDate').value;
    if (service === 'tour') S.tour.guests = stepperValue($('[data-stepper="guests"]'));
    sheet.classList.remove('show-summary');
    sumToggle.setAttribute('aria-expanded', 'false');
    renderSheet();
    if (!sheet.open) sheet.showModal();
    document.documentElement.style.overflow = 'hidden';
    body.scrollTop = 0;
    setTimeout(() => body.focus({ preventScroll: true }), 50);
  }

  sheet.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    if (isDone()) S.step = 0;
  });
  $('[data-sheet-close]', sheet).addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });
  backBtn.addEventListener('click', () => { if (S.step > 0 && !isDone()) { S.step--; renderSheet(); body.scrollTop = 0; } });
  sumToggle.addEventListener('click', () => {
    if (isDesktop()) return;
    const on = !sheet.classList.contains('show-summary');
    sheet.classList.toggle('show-summary', on);
    sumToggle.setAttribute('aria-expanded', String(on));
  });

  function renderSheet() {
    const steps = flow();
    const done = isDone();
    const id = steps[S.step];
    $('[data-sheet-kicker]', sheet).textContent = KICKER[S.service] + (S.mode === 'enquiry' ? ' enquiry' : '');
    $('[data-sheet-title]', sheet).textContent = done ? (S.mode === 'enquiry' ? 'Enquiry sent' : 'Booking confirmed') : (id === 'pay' && S.service === 'wedding' && S.wedding.pay === 'deposit' ? 'Pay your deposit' : STEP[id].title);
    $('[data-sheet-progress]', sheet).innerHTML = steps.map((s, i) => `<li class="${done || i < S.step ? 'done' : i === S.step ? 'current' : ''}" ${i === S.step && !done ? 'aria-current="step"' : ''}><span>${STEP[s].label}</span></li>`).join('');
    backBtn.hidden = S.step === 0 || done;
    $('[data-sheet-foot]', sheet).hidden = false;

    if (done) body.innerHTML = renderDone();
    else body.innerHTML = ({ vehicle: renderVehicleStep, extras: renderExtrasStep, hourly: renderHourlyStep, tour: renderTourStep, wedding: renderWeddingStep, details: renderDetailsStep, pay: renderPayStep })[id]();

    $$('[data-combo]', body).forEach(setupCombo);
    $$('[data-stepper]', body).forEach((el) => setStepper(el, stepperValue(el)));
    renderSummary();
  }

  function tripChip() {
    let line1 = '', line2 = '';
    if (S.service === 'transfer') {
      const t = S.transfer;
      line1 = `${short(t.from)} → ${short(t.to)}`;
      line2 = `${fmtDate(t.date)}, ${fmtTime(t.time)} · ${t.adults + t.children} pax · ${t.bags} bags${t.ret ? ' · Return' : ''}`;
    } else if (S.service === 'hourly') {
      line1 = S.hourly.from ? `From ${short(S.hourly.from)}` : 'Chauffeur by the hour';
      line2 = `${fmtDate(S.hourly.date)}, from ${S.hourly.time}`;
    }
    return `<div class="trip-chip">${icon(S.service === 'transfer' ? 'i-route' : 'i-clock')}<div class="tc-text"><strong>${esc(line1)}</strong><span>${esc(line2)}</span></div><button type="button" data-edit-trip>Edit</button></div>`;
  }
  const short = (s) => (s === D.AIRPORT ? 'Malta Airport' : s);

  function renderVehicleStep() {
    const t = S.transfer;
    const base = transferBase(t.from, t.to) || { price: 15 };
    return `${tripChip()}
      <div class="veh-list" role="radiogroup" aria-label="Vehicle class">
        ${D.vehicles.map((v) => {
          const ok = fits(v);
          const price = vehiclePrice(base.price, v.id) * (t.ret ? 2 : 1);
          const badge = v.id === 'economy' ? '<span class="veh-badge">Best value</span>' : v.id === 'executive' ? '<span class="veh-badge">Most booked</span>' : '';
          return `<label class="veh-opt"><input type="radio" name="vehicle" value="${v.id}" data-bind="transfer.vehicle" ${t.vehicle === v.id ? 'checked' : ''} ${ok ? '' : 'disabled'}>
            <span class="veh-card"><img src="${v.img}" alt="" loading="lazy" width="96" height="72">
              <span><strong>${esc(v.name)}${badge}</strong><span class="vc-model">${esc(v.model)}</span>
                <span class="vc-cap"><span>${icon('i-user')}${v.seats}</span><span>${icon('i-bag')}${v.bags}</span></span>
                ${ok ? '' : `<span class="vc-warn">Too small for ${t.adults + t.children} passengers and ${t.bags} bags</span>`}
              </span>
              <span class="vc-price"><b>${euro(price)}</b><small>${t.ret ? 'return' : 'one way'}</small></span>
            </span></label>`;
        }).join('')}
      </div>
      <div class="block">
        <h3 class="block-title" style="margin:0">Included with every transfer</h3>
        <ul class="included">
          ${base.airport === 'pickup' ? `<li>${icon('i-check')}Meet &amp; greet with name board in arrivals</li><li>${icon('i-check')}Flight tracking and 60 min free waiting</li>` : `<li>${icon('i-check')}15 min free waiting at pickup</li>`}
          <li>${icon('i-check')}Fixed price, VAT and tolls included</li>
          <li>${icon('i-check')}Free cancellation up to 24 hours before</li>
        </ul>
      </div>`;
  }

  function renderExtrasStep() {
    const t = S.transfer;
    const base = transferBase(t.from, t.to) || {};
    const airportPickup = base.airport === 'pickup';
    const childNote = t.children > 0 && t.extras.childSeat + t.extras.booster === 0
      ? `<p class="hint">${icon('i-info')}You are travelling with ${t.children} child${t.children > 1 ? 'ren' : ''}. Add the seats you need below.</p>` : '';
    return `
      ${airportPickup ? `
      <div class="block">
        <h3 class="block-title" style="margin:0">Your flight</h3>
        <div class="field field-boxed" data-flight-field>
          <label for="shFlight">Arrival flight number</label>
          <input id="shFlight" type="text" placeholder="e.g. EK 109 or FR 1234" autocapitalize="characters" autocomplete="off" data-bind="transfer.flight" value="${esc(t.flight)}">
        </div>
        <p class="hint">${icon('i-landing')}We track your flight and adjust pickup to the real landing time. First 60 minutes of waiting are free.</p>
        <label class="check"><input type="checkbox" data-bind="transfer.flightLater" ${t.flightLater ? 'checked' : ''}><span>I will add my flight number later in Manage booking</span></label>
        <div class="switch-row" style="border-top:1px solid var(--line);padding-top:12px">
          <div><strong>Meet &amp; greet with name board</strong><small>Your chauffeur waits inside arrivals · Free</small></div>
          <label class="switch"><input type="checkbox" data-bind="transfer.meet" ${t.meet ? 'checked' : ''} aria-label="Meet and greet"><span></span></label>
        </div>
      </div>` : `
      <div class="block">
        <h3 class="block-title" style="margin:0">Pickup details</h3>
        <div class="field field-boxed">
          <label for="shPickupNote">Departure flight or ship (optional)</label>
          <input id="shPickupNote" type="text" placeholder="Helps us plan your pickup time" data-bind="transfer.flight" value="${esc(t.flight)}">
        </div>
        <p class="hint">${icon('i-clock')}For departures we recommend pickup 2.5 hours before your flight.</p>
      </div>`}
      <div class="block">
        <h3 class="block-title" style="margin:0">Extras</h3>
        ${childNote}
        ${D.extras.map((x) => `
          <div class="extra-row">
            <span class="er-ic">${icon(x.icon)}</span>
            <div class="er-text"><strong>${x.name}</strong><small>${x.note} · ${euro(x.price)} each</small></div>
            <div class="stepper" data-stepper="extra:${x.id}" data-min="0" data-max="${x.max}">
              <button type="button" aria-label="Remove ${x.name}" data-step="-1">${icon('i-minus')}</button>
              <output aria-live="polite">${t.extras[x.id]}</output>
              <button type="button" aria-label="Add ${x.name}" data-step="1">${icon('i-plus')}</button>
            </div>
          </div>`).join('')}
      </div>
      <div class="block">
        <div class="switch-row">
          <div><strong>Add a return trip</strong><small>Same vehicle, booked together</small></div>
          <label class="switch"><input type="checkbox" data-bind="transfer.ret" data-rerender ${t.ret ? 'checked' : ''} aria-label="Add a return trip"><span></span></label>
        </div>
        ${t.ret ? `<div class="field-row">
          <div class="field field-boxed"><label for="shRetDate">Return date</label><input id="shRetDate" type="date" min="${t.date}" value="${t.retDate}" data-bind="transfer.retDate"></div>
          <div class="field field-boxed"><label for="shRetTime">Pickup time</label><input id="shRetTime" type="time" step="300" value="${t.retTime}" data-bind="transfer.retTime"></div>
        </div>` : ''}
      </div>`;
  }

  function renderHourlyStep() {
    const h = S.hourly;
    return `
      <div class="field combo" data-combo>
        ${icon('i-pin', 'ic field-ic')}
        <label for="shHrFrom">Pickup location</label>
        <input id="shHrFrom" type="text" placeholder="Hotel, address or locality" value="${esc(h.from)}" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="shHrFromList" data-bind="hourly.from" spellcheck="false">
        <button class="field-clear" type="button" aria-label="Clear pickup" tabindex="-1">${icon('i-x')}</button>
        <ul class="combo-list" id="shHrFromList" role="listbox" hidden></ul>
      </div>
      <div class="field-row">
        <div class="field field-boxed"><label for="shHrDate">Date</label><input id="shHrDate" type="date" min="${isoLocal(new Date())}" value="${h.date}" data-bind="hourly.date"></div>
        <div class="field field-boxed"><label for="shHrTime">Start time</label><input id="shHrTime" type="time" step="300" value="${h.time}" data-bind="hourly.time"></div>
      </div>
      <h3 class="block-title">Vehicle</h3>
      <div class="veh-list" role="radiogroup" aria-label="Vehicle class">
        ${hourlyVehicles.map((v) => `<label class="veh-opt"><input type="radio" name="hrv" value="${v.id}" data-bind="hourly.vehicle" ${h.vehicle === v.id ? 'checked' : ''}>
          <span class="veh-card"><img src="${v.img}" alt="" loading="lazy" width="96" height="72">
            <span><strong>${esc(v.name)}</strong><span class="vc-model">${esc(v.model)}</span><span class="vc-cap"><span>${icon('i-user')}${v.seats}</span><span>${icon('i-bag')}${v.bags}</span></span></span>
            <span class="vc-price"><b>${euro(v.hourly)}</b><small>per hour</small></span>
          </span></label>`).join('')}
      </div>
      <div class="block">
        <div class="switch-row">
          <div><strong>How many hours?</strong><small>Minimum ${D.hourlyMin} hours. Extra time billed per 30 min.</small></div>
          <div class="stepper" data-stepper="sheetHours" data-min="${D.hourlyMin}" data-max="${D.hourlyMax}">
            <button type="button" aria-label="Fewer hours" data-step="-1">${icon('i-minus')}</button>
            <output aria-live="polite">${h.hours}</output>
            <button type="button" aria-label="More hours" data-step="1">${icon('i-plus')}</button>
          </div>
        </div>
        <div class="field field-boxed"><label for="shPlan">Your plans (optional)</label><textarea id="shPlan" rows="2" placeholder="e.g. Meetings in Valletta, then dinner in Mdina" data-bind="hourly.plan">${esc(h.plan)}</textarea></div>
      </div>`;
  }

  function renderTourStep() {
    const tour = D.tours.find((x) => x.id === S.tour.id);
    const q = tourPrice(tour, S.tour.guests);
    return `
      <div class="block" style="padding:0;overflow:hidden">
        <img src="${tour.img}" alt="" style="width:100%;aspect-ratio:16/7;object-fit:cover">
        <div style="padding:0 16px 16px;display:grid;gap:6px">
          <h3 style="font-size:19px">${esc(tour.name)}</h3>
          <ul class="tour-stops">${tour.stops.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          <p class="hint">${icon('i-clock')}${tour.hours} hours · private · hotel pickup and drop-off</p>
        </div>
      </div>
      <div class="field-row">
        <div class="field field-boxed"><label for="shTrDate">Date</label><input id="shTrDate" type="date" min="${isoLocal(new Date())}" value="${S.tour.date}" data-bind="tour.date"></div>
        <div class="field field-boxed field-static"><span class="field-label">Guests</span>
          <div class="stepper stepper-inline" data-stepper="sheetGuests" data-min="1" data-max="8">
            <button type="button" aria-label="Fewer guests" data-step="-1">${icon('i-minus')}</button>
            <output aria-live="polite">${S.tour.guests}</output>
            <button type="button" aria-label="More guests" data-step="1">${icon('i-plus')}</button>
          </div>
        </div>
      </div>
      <div class="field combo" data-combo>
        ${icon('i-pin', 'ic field-ic')}
        <label for="shTrPickup">Pickup hotel or address</label>
        <input id="shTrPickup" type="text" placeholder="Where should we collect you?" value="${esc(S.tour.pickup)}" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="shTrPickupList" data-bind="tour.pickup" spellcheck="false">
        <button class="field-clear" type="button" aria-label="Clear pickup" tabindex="-1">${icon('i-x')}</button>
        <ul class="combo-list" id="shTrPickupList" role="listbox" hidden></ul>
      </div>
      <div class="block">
        <div class="switch-row">
          <div><strong>Your vehicle: ${esc(q.vehicle.name)}</strong><small>Matched to ${S.tour.guests} guest${S.tour.guests > 1 ? 's' : ''} · ${esc(q.vehicle.model)}</small></div>
          <img src="${q.vehicle.img}" alt="" width="72" height="54" style="width:72px;height:54px;object-fit:cover;border-radius:8px">
        </div>
        <div class="field field-boxed field-select"><label for="shLang">Driver-guide language</label>
          <select id="shLang" data-bind="tour.lang">${['English', 'Italian', 'German', 'French', 'Maltese'].map((l) => `<option ${S.tour.lang === l ? 'selected' : ''}>${l}</option>`).join('')}</select>
          ${icon('i-down', 'ic select-chev')}
        </div>
      </div>`;
  }

  function renderWeddingStep() {
    const w = S.wedding;
    const car = D.cars.find((c) => c.id === w.carId);
    const status = availability(w.date, w.carId);
    const statusHtml = status === 'booked'
      ? `<span class="ph-tag" style="color:var(--danger);background:var(--danger-tint)">${icon('i-x')}Booked, choose another car</span>`
      : `<span class="ph-tag">${icon('i-check')}${status === 'ok' ? 'Available' : 'Morning only'} on ${esc(fmtDate(w.date))}</span>`;
    return `
      <div class="block" style="padding:0;overflow:hidden">
        <img src="${car.img}" alt="" style="width:100%;aspect-ratio:16/8;object-fit:cover">
        <div style="padding:0 16px 16px;display:grid;gap:8px">
          <div>${statusHtml}</div>
          <h3 style="font-size:19px">${esc(car.name)} <span class="car-year" style="font-size:16px">${car.year}</span></h3>
          <p class="hint">${icon('i-user')}${car.seats} seats · ${esc(car.colour)} · chauffeur in livery, ribbons included</p>
        </div>
      </div>
      <div class="field-row">
        <div class="field field-boxed"><label for="shWdDate">Wedding date</label><input id="shWdDate" type="date" min="${isoLocal(new Date())}" value="${w.date}" data-bind="wedding.date" data-rerender></div>
        <div class="field field-boxed field-select"><label for="shWdCar">Car</label>
          <select id="shWdCar" data-bind="wedding.carId" data-rerender>${D.cars.map((c) => `<option value="${c.id}" ${c.id === w.carId ? 'selected' : ''}>${esc(c.name)} ${c.year}</option>`).join('')}</select>
          ${icon('i-down', 'ic select-chev')}
        </div>
      </div>
      <div class="field-row">
        <div class="field field-boxed"><label for="shCer">Ceremony (church or venue)</label><input id="shCer" type="text" placeholder="e.g. Mosta Rotunda" value="${esc(w.ceremony)}" data-bind="wedding.ceremony"></div>
        <div class="field field-boxed"><label for="shRec">Reception venue</label><input id="shRec" type="text" placeholder="e.g. Villa Arrigo" value="${esc(w.reception)}" data-bind="wedding.reception"></div>
      </div>
      <div class="block">
        <div class="switch-row">
          <div><strong>Hours with the car</strong><small>3 included · extra hours ${euro(D.wedding.extraHour)} each</small></div>
          <div class="stepper" data-stepper="weddingHours" data-min="3" data-max="8">
            <button type="button" aria-label="Fewer hours" data-step="-1">${icon('i-minus')}</button>
            <output aria-live="polite">${w.hours}</output>
            <button type="button" aria-label="More hours" data-step="1">${icon('i-plus')}</button>
          </div>
        </div>
        <div class="switch-row" style="border-top:1px solid var(--line);padding-top:12px">
          <div><strong>Champagne on board</strong><small>Chilled bottle and two flutes · ${euro(D.wedding.champagne)}</small></div>
          <label class="switch"><input type="checkbox" data-bind="wedding.champagne" ${w.champagne ? 'checked' : ''} aria-label="Champagne on board"><span></span></label>
        </div>
      </div>
      ${S.mode === 'enquiry' ? `<p class="hint">${icon('i-info')}No payment now. We will call you within 24 hours to plan timings and confirm the price.</p>` : `
      <h3 class="block-title">How would you like to pay?</h3>
      <div class="pay-choice" role="radiogroup" aria-label="Payment option">
        <label class="pc-opt"><input type="radio" name="wdPay" value="deposit" data-bind="wedding.pay" ${w.pay === 'deposit' ? 'checked' : ''}>
          <span class="pc-card"><span><strong>Pay deposit now</strong><small>Holds the car · balance due 14 days before</small></span><b>${euro(D.wedding.deposit)}</b></span></label>
        <label class="pc-opt"><input type="radio" name="wdPay" value="full" data-bind="wedding.pay" ${w.pay === 'full' ? 'checked' : ''}>
          <span class="pc-card"><span><strong>Pay in full</strong><small>Nothing more to pay later</small></span><b data-full-price>${euro(quote().total)}</b></span></label>
      </div>`}`;
  }

  function renderDetailsStep() {
    const c = S.contact;
    const ccs = [['+356', 'MT'], ['+44', 'UK'], ['+353', 'IE'], ['+49', 'DE'], ['+39', 'IT'], ['+33', 'FR'], ['+34', 'ES'], ['+31', 'NL'], ['+1', 'US'], ['+971', 'AE']];
    return `
      <p class="muted">We send your confirmation, receipt and driver details here.</p>
      <div class="field field-boxed" data-f="name"><label for="shName">Full name</label><input id="shName" type="text" autocomplete="name" value="${esc(c.name)}" data-bind="contact.name"></div>
      <div class="field field-boxed" data-f="email"><label for="shEmail">Email</label><input id="shEmail" type="email" autocomplete="email" inputmode="email" value="${esc(c.email)}" data-bind="contact.email"></div>
      <div class="phone-field">
        <div class="field field-boxed field-select"><label for="shCc">Code</label>
          <select id="shCc" autocomplete="tel-country-code" data-bind="contact.cc">${ccs.map(([v, n]) => `<option value="${v}" ${c.cc === v ? 'selected' : ''}>${n} ${v}</option>`).join('')}</select>
          ${icon('i-down', 'ic select-chev')}
        </div>
        <div class="field field-boxed" data-f="phone"><label for="shPhone">Mobile (for driver updates)</label><input id="shPhone" type="tel" autocomplete="tel-national" inputmode="tel" value="${esc(c.phone)}" data-bind="contact.phone"></div>
      </div>
      <div class="field field-boxed"><label for="shNotes">${S.service === 'wedding' ? 'Anything we should know?' : 'Note for your chauffeur (optional)'}</label><textarea id="shNotes" rows="2" placeholder="${S.service === 'wedding' ? 'Colour theme, timings, second car for bridesmaids…' : 'e.g. Travelling with a wheelchair, villa gate code…'}" data-bind="contact.notes">${esc(c.notes)}</textarea></div>
      ${S.mode === 'enquiry' ? '' : `
      <div class="block">
        <div class="switch-row">
          <div><strong>I need a VAT invoice</strong><small>Add company name and VAT number</small></div>
          <label class="switch"><input type="checkbox" data-bind="contact.invoice" data-rerender ${c.invoice ? 'checked' : ''} aria-label="I need a VAT invoice"><span></span></label>
        </div>
        ${c.invoice ? `<div class="field-row">
          <div class="field field-boxed"><label for="shCo">Company name</label><input id="shCo" type="text" autocomplete="organization" value="${esc(c.company)}" data-bind="contact.company"></div>
          <div class="field field-boxed"><label for="shVat">VAT number</label><input id="shVat" type="text" placeholder="e.g. MT12345678" value="${esc(c.vat)}" data-bind="contact.vat"></div>
        </div>` : ''}
      </div>`}
      <label class="check"><input type="checkbox" data-bind="contact.marketing" ${c.marketing ? 'checked' : ''}><span>Send me occasional offers from Johns. You can unsubscribe at any time.</span></label>`;
  }

  function renderPayStep() {
    const q = quote();
    return `
      <div class="express">
        <button class="pay-btn" type="button" data-pay="apple" aria-label="Pay with Apple Pay">${icon('i-apple', '')}Pay</button>
        <button class="pay-btn pay-google" type="button" data-pay="google" aria-label="Pay with Google Pay">${icon('i-google', '')}Pay</button>
      </div>
      <div class="divider">or pay by card</div>
      <div class="card-fields">
        <div class="field field-boxed"><label for="ccNum">Card number</label><input id="ccNum" type="text" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234"></div>
        <div class="field-row">
          <div class="field field-boxed"><label for="ccExp">Expiry</label><input id="ccExp" type="text" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY"></div>
          <div class="field field-boxed"><label for="ccCvc">Security code</label><input id="ccCvc" type="text" inputmode="numeric" autocomplete="cc-csc" placeholder="CVC"></div>
        </div>
        <div class="field field-boxed"><label for="ccName">Name on card</label><input id="ccName" type="text" autocomplete="cc-name" value="${esc(S.contact.name)}"></div>
      </div>
      <div class="secure-note">${icon('i-lock')}<span>Card details are entered in secure fields hosted by Trust Payments and never touch our servers. Prototype only, no payment is taken.</span></div>
      <p class="hint">${icon('i-receipt')}A VAT receipt for ${euro(q.due)} is emailed to ${esc(S.contact.email || 'you')} straight after payment.</p>
      <p class="muted" style="font-size:12.5px">By paying you accept the <a href="#top">Terms of booking</a> and <a href="#top">cancellation policy</a>.</p>`;
  }

  function renderDone() {
    const enquiry = S.mode === 'enquiry';
    const email = S.contact.email || 'your email';
    return `
      <div class="confirm">
        <span class="confirm-ic">${icon('i-check')}</span>
        <h3>${enquiry ? 'Thank you, enquiry received' : 'You are all set'}</h3>
        <p>${enquiry ? `We have sent a copy to ${esc(email)}. Our weddings team will call you within 24 hours.` : `Confirmation and VAT receipt sent to ${esc(email)}. Your chauffeur's name, car and plate follow before pickup.`}</p>
        <div class="code-box"><small>${enquiry ? 'Enquiry reference' : 'Booking code'}</small><b>${S.code}</b></div>
      </div>
      ${enquiry ? '' : `
      <div class="block">
        <h3 class="block-title" style="margin:0">What happens next</h3>
        <ol class="sd-timeline" style="padding-top:4px">
          <li class="done"><span class="dot"></span><div><strong>Booking confirmed</strong><span>Synced to our dispatch system</span></div><time>Now</time></li>
          <li><span class="dot"></span><div><strong>Chauffeur assigned</strong><span>Name, phone and plate by email and SMS</span></div><time>24h before</time></li>
          <li><span class="dot"></span><div><strong>On the day</strong><span>Live updates when your chauffeur is on the way</span></div><time>&nbsp;</time></li>
        </ol>
      </div>
      <div class="confirm-actions">
        <button class="btn btn-outline" type="button" data-cal>${icon('i-calendar')}Add to calendar</button>
        <button class="btn btn-outline" type="button" data-manage>${icon('i-route')}Manage booking</button>
      </div>`}`;
  }

  function renderSummary() {
    const q = quote();
    const done = isDone();
    const lines = q.lines.map(([l, a]) => `<div><dt>${esc(l)}</dt><dd>${a === 0 ? 'Free' : euro(a)}</dd></div>`).join('');
    let img = '', trip = '';
    if (S.service === 'transfer') {
      const t = S.transfer;
      img = vehicleById[t.vehicle].img;
      trip = `<li>${icon('i-route')}<span>${esc(short(t.from))} → ${esc(short(t.to))}</span></li>
        <li>${icon('i-calendar')}<span>${esc(fmtDate(t.date, true))}, ${esc(t.time)}${t.ret ? `<br>Return ${esc(fmtDate(t.retDate))}, ${esc(t.retTime)}` : ''}</span></li>
        <li>${icon('i-users')}<span>${t.adults + t.children} passengers · ${t.bags} bags</span></li>
        ${t.flight ? `<li>${icon('i-plane')}<span>${esc(t.flight.toUpperCase())}</span></li>` : ''}`;
    } else if (S.service === 'hourly') {
      const h = S.hourly;
      img = vehicleById[h.vehicle].img;
      trip = `<li>${icon('i-pin')}<span>${esc(h.from || 'Pickup to be added')}</span></li>
        <li>${icon('i-calendar')}<span>${esc(fmtDate(h.date, true))}, from ${esc(h.time)}</span></li>
        <li>${icon('i-clock')}<span>${h.hours} hours with your chauffeur</span></li>`;
    } else if (S.service === 'tour') {
      const tour = D.tours.find((x) => x.id === S.tour.id);
      img = tour.img;
      trip = `<li>${icon('i-compass')}<span>${esc(tour.name)}</span></li>
        <li>${icon('i-calendar')}<span>${esc(fmtDate(S.tour.date, true))} · ${tour.hours} hours</span></li>
        <li>${icon('i-users')}<span>${S.tour.guests} guest${S.tour.guests > 1 ? 's' : ''} · ${esc(S.tour.lang)}-speaking</span></li>`;
    } else {
      const car = D.cars.find((c) => c.id === S.wedding.carId);
      img = car.img;
      trip = `<li>${icon('i-gem')}<span>${esc(car.name)} (${car.year})</span></li>
        <li>${icon('i-calendar')}<span>${esc(fmtDate(S.wedding.date, true))}</span></li>
        <li>${icon('i-clock')}<span>${S.wedding.hours} hours with the car</span></li>`;
    }
    const isDeposit = S.service === 'wedding' && S.mode === 'book' && S.wedding.pay === 'deposit';
    summary.innerHTML = `
      <p class="sum-title">Your booking</p>
      <div class="sum-media"><img src="${img}" alt="" loading="lazy"></div>
      <ul class="sum-trip">${trip}</ul>
      <dl class="sum-lines">${lines}</dl>
      <div class="sum-total"><span>Total<small>EUR, VAT included</small></span><b>${euro(q.total)}</b></div>
      ${isDeposit ? `<div class="sum-due"><span>Due now (deposit)</span><b>${euro(q.due)}</b></div><div class="sum-due"><span>Balance, 14 days before</span><b>${euro(q.total - q.due)}</b></div>` : ''}
      <ul class="sum-perks">
        <li>${icon('i-check')}Free cancellation up to 24h before</li>
        <li>${icon('i-check')}Instant email confirmation</li>
        <li>${icon('i-check')}24/7 support: +356 2298 2123</li>
      </ul>`;

    const enquiry = S.mode === 'enquiry';
    $('.sf-label', sheet).innerHTML = enquiry ? 'Estimated total <small>no payment now</small>' : isDeposit ? 'Due now <small>deposit</small>' : 'Total <small>incl. VAT</small>';
    totalEl.textContent = euro(enquiry ? q.total : q.due);
    const fullEl = $('[data-full-price]', body);
    if (fullEl) fullEl.textContent = euro(q.total);

    const steps = flow();
    const id = steps[S.step];
    if (done) nextBtn.textContent = 'Done';
    else if (id === 'pay') nextBtn.innerHTML = `${icon('i-lock')}Pay ${euro(q.due)}`;
    else if (enquiry && S.step === steps.length - 1) nextBtn.textContent = 'Send enquiry';
    else if (steps[S.step + 1] === 'pay') nextBtn.textContent = 'Continue to payment';
    else nextBtn.textContent = 'Continue';
  }

  // two-way binding inside the sheet
  function setPath(path, value) {
    const keys = path.split('.');
    let o = S;
    while (keys.length > 1) o = o[keys.shift()];
    o[keys[0]] = value;
  }
  function onBind(e) {
    const el = e.target.closest('[data-bind]');
    if (!el) return;
    if (el.type === 'radio' && !el.checked) return;
    const v = el.type === 'checkbox' ? el.checked : el.value;
    setPath(el.dataset.bind, v);
    const f = el.closest('.field');
    if (f && f.classList.contains('is-invalid')) { f.classList.remove('is-invalid'); const err = f.nextElementSibling; if (err && err.classList.contains('field-error')) err.remove(); }
    if (el.dataset.bind === 'transfer.ret' && v && !S.transfer.retDate) S.transfer.retDate = isoLocal(addDays(7, parseISO(S.transfer.date)));
    if (el.hasAttribute('data-rerender') && e.type === 'change') { const top = body.scrollTop; renderSheet(); body.scrollTop = top; }
    else renderSummary();
  }
  body.addEventListener('input', onBind);
  body.addEventListener('change', onBind);

  body.addEventListener('click', (e) => {
    if (e.target.closest('[data-edit-trip]')) {
      sheet.close();
      scrollToBooker();
    }
    if (e.target.closest('[data-cal]')) toast('Calendar file (.ics) downloads here in the live site');
    const p = e.target.closest('[data-pay]');
    if (p) pay(p);
  });

  function validateStep() {
    const id = flow()[S.step];
    clearErrors(body);
    const errs = [];
    const need = (sel, msg, test) => { const input = $(sel, body); if (input && !test(input.value.trim())) errs.push([input.closest('.field'), msg, input]); };
    if (id === 'extras') {
      const t = S.transfer;
      const base = transferBase(t.from, t.to) || {};
      if (base.airport === 'pickup' && !t.flightLater) need('#shFlight', 'Add your flight number, or tick “add it later”', (v) => /^[a-z0-9]{2}\s?\d{1,4}[a-z]?$/i.test(v));
      if (t.ret && !t.retDate) need('#shRetDate', 'Choose a return date', (v) => !!v);
    }
    if (id === 'hourly') need('#shHrFrom', 'Add your pickup location', (v) => v.length > 1);
    if (id === 'tour') need('#shTrPickup', 'Where should we pick you up?', (v) => v.length > 1);
    if (id === 'wedding' && availability(S.wedding.date, S.wedding.carId) === 'booked') {
      toast('That car is booked on this date. Choose another car or date.');
      return false;
    }
    if (id === 'details') {
      need('#shName', 'Enter your full name', (v) => v.length > 1);
      need('#shEmail', 'Enter a valid email so we can send your confirmation', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
      need('#shPhone', 'Enter a mobile number for driver updates', (v) => v.replace(/\D/g, '').length >= 6);
    }
    errs.forEach(([f, m]) => fieldError(f, m));
    if (errs.length) { errs[0][2].focus(); return false; }
    return true;
  }

  function pay(btn) {
    const label = btn.innerHTML;
    btn.classList.add('is-loading');
    nextBtn.classList.add('is-loading');
    if (btn === nextBtn) btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Processing…';
    setTimeout(() => {
      btn.classList.remove('is-loading');
      nextBtn.classList.remove('is-loading');
      btn.innerHTML = label;
      finish();
    }, 1300);
  }
  function finish() {
    S.code = (S.mode === 'enquiry' ? 'ENQ-' : 'JHN-') + String(10000 + Math.floor(Math.random() * 89999));
    S.step = flow().length;
    sheet.classList.remove('show-summary');
    sumToggle.setAttribute('aria-expanded', 'false');
    renderSheet();
    body.scrollTop = 0;
  }

  nextBtn.addEventListener('click', () => {
    if (isDone()) { sheet.close(); return; }
    if (!validateStep()) return;
    const steps = flow();
    if (steps[S.step] === 'pay') { pay(nextBtn); return; }
    if (S.mode === 'enquiry' && S.step === steps.length - 1) { finish(); return; }
    S.step++;
    renderSheet();
    body.scrollTop = 0;
    body.focus({ preventScroll: true });
  });

  /* ==========================================================================
     Custom tour + manage dialogs
     ========================================================================== */
  const customDlg = $('#customTour');
  const customBodyHTML = $('[data-custom-body]').innerHTML;
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-custom-tour]')) {
      $('[data-custom-body]').innerHTML = customBodyHTML;
      $('[data-custom-submit]').textContent = 'Send request';
      initDates();
      customDlg.showModal();
      document.documentElement.style.overflow = 'hidden';
    }
    const close = e.target.closest('[data-dialog-close]');
    if (close) close.closest('dialog').close();
    const chip = e.target.closest('[data-multi] .chip');
    if (chip) chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
  });
  $$('dialog.sheet-narrow').forEach((d) => {
    d.addEventListener('close', () => { document.documentElement.style.overflow = ''; });
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  });
  $('[data-custom-form]').addEventListener('submit', (e) => {
    const form = e.currentTarget;
    const submit = $('[data-custom-submit]');
    if (submit.textContent === 'Close') return; // let method=dialog close it
    e.preventDefault();
    clearErrors(form);
    const name = $('#ctName'), email = $('#ctEmail'), consent = $('.check input', form);
    const errs = [];
    if (name.value.trim().length < 2) errs.push([name, 'Enter your name']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) errs.push([email, 'Enter a valid email']);
    errs.forEach(([i, m]) => fieldError(i.closest('.field'), m));
    if (!consent.checked) { consent.closest('.check').style.color = 'var(--danger)'; if (!errs.length) consent.focus(); }
    if (errs.length) { errs[0][0].focus(); return; }
    if (!consent.checked) return;
    const places = $$('[data-multi] [aria-pressed="true"]', form).map((c) => c.textContent).join(', ');
    $('[data-custom-body]').innerHTML = `
      <div class="success-panel">
        <span class="confirm-ic">${icon('i-check')}</span>
        <h3 style="font-family:var(--font-display);font-weight:700;font-size:24px">Request received</h3>
        <p class="muted">Thanks ${esc(name.value.split(' ')[0])}. A local expert is planning ${places ? esc(places) : 'your tour'} and will email ${esc(email.value)} with an itinerary and fixed price, usually within 2 hours.</p>
        <div class="code-box"><small>Reference</small><b>TOUR-${String(1000 + Math.floor(Math.random() * 8999))}</b></div>
      </div>`;
    submit.textContent = 'Close';
  });

  const manageDlg = $('#manageDialog');
  document.addEventListener('click', (e) => {
    const m = e.target.closest('[data-manage]');
    if (!m) return;
    e.preventDefault();
    if (sheet.open) sheet.close();
    closeMenu();
    manageDlg.showModal();
    document.documentElement.style.overflow = 'hidden';
  });
  $('[data-manage-form]').addEventListener('submit', () => { toast('Secure link sent. Check your inbox.'); });

  /* ==========================================================================
     Header, menu, language, scroll helpers
     ========================================================================== */
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const menu = $('#mobileMenu');
  const menuBtn = $('[data-menu-open]');
  function openMenu() { menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); document.documentElement.style.overflow = 'hidden'; $('[data-menu-close]').focus(); updateMobileCta(); }
  function closeMenu() { if (menu.hidden) return; menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); document.documentElement.style.overflow = ''; updateMobileCta(); }
  menuBtn.addEventListener('click', openMenu);
  $('[data-menu-close]').addEventListener('click', () => { closeMenu(); menuBtn.focus(); });
  $$('[data-menu-link]').forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuBtn.focus(); } });

  const langBtn = $('[data-lang-btn]');
  const langMenu = $('[data-lang-menu]');
  langBtn.addEventListener('click', (e) => { e.stopPropagation(); const open = langMenu.hidden; langMenu.hidden = !open; langBtn.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('click', (e) => { if (!langMenu.hidden && !langMenu.contains(e.target)) { langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); } });
  langMenu.addEventListener('click', (e) => { const b = e.target.closest('[aria-disabled="true"]'); if (b) toast('Extra languages arrive in Phase 2. The site is built for them.'); });

  function scrollToBooker() {
    const top = booker.getBoundingClientRect().top + window.scrollY - (isDesktop() ? 120 : 76);
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' });
    const panel = $$('.bk-panel', booker).find((p) => !p.hidden);
    const first = panel && $('input:not([type=radio]), select', panel);
    if (first) setTimeout(() => first.focus({ preventScroll: true }), reducedMotion ? 0 : 450);
  }
  $$('[data-scroll-booker]').forEach((b) => b.addEventListener('click', () => { closeMenu(); scrollToBooker(); }));

  // service cards preselect the right tab when the visitor is going to book
  $$('[data-service-card]').forEach((c) => c.addEventListener('click', () => selectTab(c.dataset.serviceCard)));

  // links that open a tab in the hero booker (e.g. Wedding cars)
  $$('[data-book-tab]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    closeMenu();
    selectTab(a.dataset.bookTab);
    scrollToBooker();
  }));

  // sticky mobile CTA
  const mcta = $('[data-mobile-cta]');
  let bookerOut = false;
  function updateMobileCta() {
    const cookieOpen = !$('[data-cookie]').hidden;
    const show = bookerOut && menu.hidden && !cookieOpen;
    mcta.classList.toggle('is-visible', show);
    mcta.setAttribute('aria-hidden', String(!show));
    $$('a,button', mcta).forEach((el) => { el.tabIndex = show ? 0 : -1; });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { bookerOut = !en.isIntersecting && en.boundingClientRect.top < 0; updateMobileCta(); }, { threshold: 0 }).observe(booker);

    // active nav link (cleared while the hero is in view)
    const links = $$('.main-nav > ul > li > a');
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = window.scrollY < 200 ? 'top' : en.target.id;
        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', ...links.map((a) => a.getAttribute('href').slice(1))].forEach((id) => { const el = document.getElementById(id); if (el && el.tagName === 'SECTION') navIO.observe(el); });
  }

  // reveal on scroll
  if ('IntersectionObserver' in window && !reducedMotion) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.section-head, .svc-grid, .transfers-copy, .routes-card, .chauffeur-copy, .about-copy').forEach((el) => { el.classList.add('reveal'); io.observe(el); });
  }

  /* ==========================================================================
     Cookie consent (GDPR) - GA4 only after opt-in
     ========================================================================== */
  const cookie = $('[data-cookie]');
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } } };
  // ?present hides the banner for client demos and screenshots
  const presenting = new URLSearchParams(location.search).has('present');
  if (!store.get('jm-consent') && !presenting) setTimeout(() => { cookie.hidden = false; updateMobileCta(); }, 700);
  $$('[data-cookie-choice]').forEach((b) => b.addEventListener('click', () => {
    store.set('jm-consent', b.dataset.cookieChoice);
    cookie.hidden = true;
    updateMobileCta();
    toast(b.dataset.cookieChoice === 'accept' ? 'Thanks. Analytics enabled.' : 'Only essential cookies will be used.');
  }));
  $('[data-cookie-open]').addEventListener('click', () => { cookie.hidden = false; updateMobileCta(); });

  /* ==========================================================================
     Car care dropdown (hover on desktop, click and keyboard everywhere)
     ========================================================================== */
  $$('[data-nav-dd]').forEach((dd) => {
    const btn = $('.nav-dd-btn', dd);
    const set = (open) => { dd.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(!dd.classList.contains('is-open')); });
    dd.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); btn.focus(); } });
    dd.addEventListener('mouseleave', () => set(false));
    document.addEventListener('click', (e) => { if (!dd.contains(e.target)) set(false); });
    $$('a', dd).forEach((a) => a.addEventListener('click', () => set(false)));
  });

  // Phase 2 booking flows are not part of this prototype
  document.addEventListener('click', (e) => {
    const soon = e.target.closest('[data-soon]');
    if (!soon) return;
    e.preventDefault();
    toast(`${soon.dataset.soon} arrives in Phase 2`);
  });

  /* ==========================================================================
     Hero video (the poster image stays as the fallback)
     ========================================================================== */
  const video = $('[data-video]');
  const vToggle = $('[data-video-toggle]');
  const conn = navigator.connection || {};
  if (video && !reducedMotion && !conn.saveData && !/2g/.test(conn.effectiveType || '')) {
    let userPaused = false;
    video.muted = true;
    video.src = window.innerWidth < 768 ? video.dataset.srcSd : video.dataset.srcHd;
    const tryPlay = () => { const p = video.play(); if (p) p.catch(() => {}); };
    const syncToggle = () => {
      vToggle.setAttribute('aria-label', video.paused ? 'Play background video' : 'Pause background video');
      $('use', vToggle).setAttribute('href', video.paused ? '#i-play' : '#i-pause');
    };
    video.addEventListener('playing', () => { video.classList.add('is-ready'); vToggle.hidden = false; }, { once: true });
    video.addEventListener('play', syncToggle);
    video.addEventListener('pause', syncToggle);
    video.addEventListener('error', () => { video.remove(); vToggle.hidden = true; });
    vToggle.addEventListener('click', () => {
      if (video.paused) { userPaused = false; tryPlay(); } else { userPaused = true; video.pause(); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { if (en.isIntersecting) { if (!userPaused) tryPlay(); } else video.pause(); }).observe($('.hero'));
    } else tryPlay();
  }

  /* ---------- init ---------- */
  initDates();
  $$('[data-combo]').forEach(setupCombo);
  $$('[data-stepper]').forEach((el) => setStepper(el, stepperValue(el)));
  $('#tfFrom').dataset.chosen = D.AIRPORT;
  updatePaxSummary();
  renderRoutes();
  renderCalc();
  renderTours('all');
  updateHints();
})();
