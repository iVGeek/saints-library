(function () {
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var PAGE_SIZE = 50;
  var dataEl = document.getElementById('saints-data');
  if (!dataEl) return;
  var saints = JSON.parse(dataEl.textContent);
  var grid = document.getElementById('saint-grid');
  var search = document.getElementById('dir-search');
  var sortEl = document.getElementById('dir-sort');
  var countEl = document.getElementById('result-count');
  var activeEl = document.getElementById('active-filters');
  var emptyState = document.getElementById('empty-state');
  var emptyClear = document.getElementById('empty-clear');
  var clearAll = document.getElementById('clear-all');
  var filterToggle = document.getElementById('filter-toggle');
  var filterPanel = document.getElementById('filter-panel');
  var filterCount = document.getElementById('filter-count');
  var paginationEl = document.getElementById('pagination');

  var filters = {};
  var currentPage = 1;
  var visibleItems = [];

  var inputs = Array.from(document.querySelectorAll('input[data-filter]'));
  inputs.forEach(function (input) {
    var group = input.dataset.filter;
    input.addEventListener('change', function () {
      if (!filters[group]) filters[group] = new Set();
      var value = input.value;
      if (group !== 'martyr' && input.checked) {
        filters[group].clear();
        inputs.forEach(function (other) {
          if (other !== input && other.dataset.filter === group) other.checked = false;
        });
      }
      if (input.checked) filters[group].add(value);
      else filters[group].delete(value);
      if (filters[group].size === 0) delete filters[group];
      currentPage = 1;
      syncURL();
      applyFilters();
    });
  });

  function syncURL() {
    var params = new URLSearchParams();
    for (var group in filters) {
      filters[group].forEach(function (v) { params.append(group, v); });
    }
    if (search.value.trim()) params.set('q', search.value.trim());
    if (currentPage > 1) params.set('page', String(currentPage));
    var next = params.toString();
    var url = next ? location.pathname + '?' + next : location.pathname;
    history.replaceState(null, '', url);
  }

  function parseURL() {
    var params = new URLSearchParams(location.search);
    var filterKeys = ['month','patronage','vocation','region','century','order','status','martyr'];
    filterKeys.forEach(function (group) {
      var values = params.getAll(group);
      if (values.length) {
        filters[group] = new Set(values);
        inputs.forEach(function (input) {
          if (input.dataset.filter === group && values.includes(input.value)) input.checked = true;
        });
      }
    });
    var q = params.get('q');
    if (q) {
      search.value = q;
      filters['_search'] = new Set([q.toLowerCase()]);
    }
    if (params.has('page')) currentPage = Math.max(1, parseInt(params.get('page') || '1', 10));
    if (params.has('sort')) sortEl.value = params.get('sort');
  }

  function matchItem(s) {
    for (var group in filters) {
      if (group === '_search') continue;
      if (group === 'month') {
        if (String(s.m) !== Array.from(filters[group])[0]) return false;
      } else if (group === 'century') {
        var list = s.c.map(String);
        var hit = false;
        filters[group].forEach(function (v) { if (list.indexOf(v) !== -1) hit = true; });
        if (!hit) return false;
      } else if (group === 'martyr') {
        var hitM = false;
        filters[group].forEach(function (v) {
          if (v === 'true' && s.mr) hitM = true;
          if (v === 'false' && !s.mr) hitM = true;
        });
        if (!hitM) return false;
      } else if (group === 'patronage') {
        var normalized = s.p.map(function (x) { return x.toLowerCase(); });
        var hit2 = false;
        filters[group].forEach(function (v) { if (normalized.indexOf(v) !== -1) hit2 = true; });
        if (!hit2) return false;
      } else if (group === 'vocation') {
        var normalized2 = s.v.map(function (x) { return x.toLowerCase(); });
        var hit3 = false;
        filters[group].forEach(function (v) { if (normalized2.indexOf(v) !== -1) hit3 = true; });
        if (!hit3) return false;
      } else if (group === 'region') {
        var hit4 = false;
        filters[group].forEach(function (v) { if (s.r.toLowerCase() === v) hit4 = true; });
        if (!hit4) return false;
      } else if (group === 'order') {
        var hit5 = false;
        filters[group].forEach(function (v) { if (s.o === v) hit5 = true; });
        if (!hit5) return false;
      } else if (group === 'status') {
        var hit6 = false;
        filters[group].forEach(function (v) { if (s.st === v) hit6 = true; });
        if (!hit6) return false;
      }
    }
    var q = '';
    if (filters['_search']) filters['_search'].forEach(function (v) { q = v; });
    if (q && s.sh.indexOf(q) === -1) return false;
    return true;
  }

  function formatFeast(m, d) { return MONTHS[m - 1] + ' ' + d; }

  function imageSrc(src) {
    if (!src) return '';
    if (/^https?:\/\//i.test(src)) return src;
    var name = src.replace(/^File:/, '').replace(/ /g, '_');
    return 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(name) + '?width=600';
  }

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function renderMonogram(name, symbol) {
    var stripped = name.replace(/^St(\.|eint)\s+/i, '').split(/\s+/);
    var initials = stripped.filter(function (w) { return /^[A-Za-z\u00C0-\u00FF]/.test(w); }).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
    var sym = symbol || '\u2020';
    return '<svg viewBox="0 0 300 400" role="img" class="h-full w-full" preserveAspectRatio="xMidYMid slice">' +
      '<defs><radialGradient id="mg" cx="50%" cy="18%" r="85%"><stop offset="0%" stop-color="#2f4380"/><stop offset="55%" stop-color="#1a2749"/><stop offset="100%" stop-color="#0a1022"/></radialGradient>' +
      '<linearGradient id="mgb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e5d3a7"/><stop offset="50%" stop-color="#a87f2e"/><stop offset="100%" stop-color="#e5d3a7"/></linearGradient>' +
      '<pattern id="mgg" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="none"/><circle cx="9" cy="9" r="0.9" fill="#d6b97c" opacity="0.35"/></pattern></defs>' +
      '<rect width="300" height="400" fill="url(#mg)"/>' +
      '<path d="M24 398 V150 Q24 40 150 40 Q276 40 276 150 V398 Z" fill="url(#mgg)" opacity="0.5" stroke="url(#mgb)" stroke-width="3"/>' +
      '<path d="M34 396 V150 Q34 52 150 52 Q266 52 266 150 V396 Z" fill="none" stroke="#c6a155" stroke-width="1.2" opacity="0.65"/>' +
      '<path d="M44 394 V150 Q44 64 150 64 Q256 64 256 150 V394 Z" fill="rgba(10,16,34,0.35)"/>' +
      '<g transform="translate(150 120)"><circle r="40" fill="none" stroke="#c6a155" stroke-width="1.4" opacity="0.75"/><circle r="30" fill="none" stroke="#d6b97c" stroke-width="0.8" opacity="0.6"/>' +
      '<path d="M0 -40 Q14 0 0 40 Q-14 0 0 -40 M-40 0 Q0 14 40 0 Q0 -14 -40 0" fill="none" stroke="#e5d3a7" stroke-width="1" opacity="0.8"/><circle r="3" fill="#e5d3a7"/></g>' +
      '<circle cx="150" cy="120" r="26" fill="none" stroke="#fbdba7" stroke-width="2.2" opacity="0.9"/>' +
      '<text x="150" y="270" text-anchor="middle" font-family="Georgia,serif" font-size="120" font-weight="600" fill="#e5d3a7" opacity="0.92">' + esc(initials || '\u2020') + '</text>' +
      '<text x="150" y="332" text-anchor="middle" font-family="Georgia,serif" font-size="30" font-style="italic" fill="#d6b97c" opacity="0.9">' + esc(sym) + '</text>' +
      '<path d="M78 366 Q84 356 90 366 Q84 362 78 366 Z" fill="#f2c07a" opacity="0.8"/><path d="M210 366 Q216 356 222 366 Q216 362 210 366 Z" fill="#f2c07a" opacity="0.8"/></svg>';
  }

  function renderCard(s) {
    var img = imageSrc(s.i);
    var patronage = s.p;
    var html = '<a href="/saints/' + s.s + '" class="card-glow group flex flex-col overflow-hidden">' +
      '<div class="arch-frame m-3 aspect-[4/4.6] overflow-hidden">';
    if (img) {
      html += '<img src="' + img + '" alt="' + esc(s.a || s.n + ' \u2014 traditional portrait') +
        '" loading="lazy" decoding="async" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />';
    } else {
      html += renderMonogram(s.n, s.sy);
    }
    html += '<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>' +
      '</div>' +
      '<div class="flex flex-1 flex-col px-4 pb-4">' +
      '<h3 class="font-display text-lg font-semibold leading-snug text-navy-900 group-hover:text-burgundy-700">' + esc(s.n) + '</h3>';
    if (s.t) html += '<p class="mt-0.5 font-heading text-base italic text-ink-600">' + esc(s.t) + '</p>';
    html += '<dl class="mt-3 space-y-1 font-body text-[15px] text-ink-700">' +
      '<div class="flex items-center gap-2"><dt class="sr-only">Feast day</dt>' +
      '<dd class="flex items-center gap-1.5"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5 text-gold-600" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>' +
      formatFeast(s.m, s.d) + '</dd></div>';
    if (patronage.length > 0) {
      var display = patronage.slice(0, 3).map(function (p) { return p.replace(/-/g, ' '); }).join(', ');
      if (patronage.length > 3) display += '\u2026';
      html += '<div class="flex items-start gap-1.5"><dt class="sr-only">Patronage</dt><dd class="line-clamp-2"><span class="text-gold-700">Patron of </span>' + esc(display) + '</dd></div>';
    }
    html += '</dl>' +
      '<div class="mt-auto flex items-center justify-between pt-3">' +
      '<span class="label !text-[10px] text-gold-600">' + esc(s.r || '\u2014') + '</span>' +
      '<span class="font-heading text-gold-700 transition-transform duration-300 group-hover:translate-x-1">Read \u2192</span>' +
      '</div></div></a>';
    return html;
  }

  function applyFilters() {
    visibleItems = saints.filter(matchItem);

    var sortMode = sortEl.value;
    if (sortMode === 'feast') {
      visibleItems.sort(function (a, b) { return (String(a.m).padStart(2,'0') + '-' + String(a.d).padStart(2,'0')).localeCompare(String(b.m).padStart(2,'0') + '-' + String(b.d).padStart(2,'0')); });
    } else {
      visibleItems.sort(function (a, b) { return a.sh.localeCompare(b.sh); });
    }

    var totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * PAGE_SIZE;
    var end = start + PAGE_SIZE;
    var pageItems = visibleItems.slice(start, end);

    grid.innerHTML = pageItems.map(function (s) {
      return '<div class="saint-item">' + renderCard(s) + '</div>';
    }).join('');

    countEl.textContent = 'Showing ' + (start + 1) + '\u2013' + Math.min(end, visibleItems.length) + ' of ' + visibleItems.length + ' saints';
    emptyState.hidden = visibleItems.length !== 0;

    activeEl.innerHTML = '';
    var total = 0;
    for (var gg in filters) total += filters[gg].size;
    filterCount.textContent = total > 0 ? String(total) : '';
    filterCount.classList.toggle('hidden', total === 0);

    for (var group in filters) {
      filters[group].forEach(function (v) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip chip-active';
        chip.innerHTML = esc(v.replace(/-/g, ' ')) + ' <span aria-hidden="true">\u2715</span>';
        chip.addEventListener('click', function () {
          filters[group].delete(v);
          if (filters[group].size === 0) delete filters[group];
          if (group === '_search') { search.value = ''; }
          else {
            inputs.forEach(function (input) {
              if (input.dataset.filter === group && input.value === v) input.checked = false;
            });
          }
          currentPage = 1;
          syncURL();
          applyFilters();
        });
        activeEl.appendChild(chip);
      });
    }
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    paginationEl.innerHTML = '';
    if (totalPages <= 1) return;
    function addBtn(label, page, disabled, active) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.className = 'px-3 py-2 font-heading text-sm rounded border transition-colors ' +
        (active ? 'bg-gold-600 text-ivory border-gold-600' : 'border-gold-600/40 text-ink-700 hover:bg-gold-600/10');
      btn.disabled = disabled;
      if (!disabled && !active) {
        btn.addEventListener('click', function () {
          currentPage = page;
          syncURL();
          applyFilters();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
      paginationEl.appendChild(btn);
    }
    addBtn('\u2190 Prev', currentPage - 1, currentPage === 1, false);
    var maxVisible = 7;
    var startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    var endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
    if (startPage > 1) {
      addBtn('1', 1, false, false);
      if (startPage > 2) {
        var dots = document.createElement('span');
        dots.textContent = '...';
        dots.className = 'px-2 text-ink-400';
        paginationEl.appendChild(dots);
      }
    }
    for (var i = startPage; i <= endPage; i++) addBtn(String(i), i, false, i === currentPage);
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        var dots2 = document.createElement('span');
        dots2.textContent = '...';
        dots2.className = 'px-2 text-ink-400';
        paginationEl.appendChild(dots2);
      }
      addBtn(String(totalPages), totalPages, false, false);
    }
    addBtn('Next \u2192', currentPage + 1, currentPage === totalPages, false);
  }

  var acDropdown = document.getElementById('ac-dropdown');
  var acHighlight = -1;
  function renderAutocomplete(q) {
    if (!q || q.length < 2) { acDropdown.classList.add('hidden'); return; }
    var lq = q.toLowerCase();
    var matches = [];
    for (var i = 0; i < saints.length && matches.length < 12; i++) {
      var it = saints[i];
      if (it.sh.indexOf(lq) !== -1) {
        matches.push({ name: it.n, status: it.st, date: formatFeast(it.m, it.d), slug: it.s, hay: it.sh });
      }
    }
    if (matches.length === 0) { acDropdown.classList.add('hidden'); return; }
    acDropdown.innerHTML = matches.map(function (m, idx) {
      var dot = m.status === 'Saint' ? 'bg-gold-500' : m.status === 'Blessed' ? 'bg-forest-600' : 'bg-navy-500';
      return '<a href="/saints/' + m.slug + '" class="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gold-600/10" data-ac-idx="' + idx + '">' +
        '<span class="h-2 w-2 shrink-0 rounded-full ' + dot + '"></span>' +
        '<span class="min-w-0 flex-1 truncate font-heading text-sm font-semibold text-navy-900">' + esc(m.name) + '</span>' +
        '<span class="shrink-0 font-body text-xs text-ink-500">' + esc(m.date) + '</span></a>';
    }).join('');
    acDropdown.classList.remove('hidden');
    acHighlight = -1;
  }

  search.addEventListener('input', function () {
    var q = search.value.trim().toLowerCase();
    renderAutocomplete(search.value.trim());
    if (q) filters['_search'] = new Set([q]);
    else delete filters['_search'];
    currentPage = 1;
    syncURL();
    applyFilters();
  });

  search.addEventListener('keydown', function (e) {
    var links = acDropdown.querySelectorAll('a[data-ac-idx]');
    if (acDropdown.classList.contains('hidden') || links.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      acHighlight = Math.min(acHighlight + 1, links.length - 1);
      links.forEach(function (l, i) { l.style.background = i === acHighlight ? 'rgba(180,140,60,0.1)' : ''; });
      links[acHighlight].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      acHighlight = Math.max(acHighlight - 1, 0);
      links.forEach(function (l, i) { l.style.background = i === acHighlight ? 'rgba(180,140,60,0.1)' : ''; });
      links[acHighlight].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && acHighlight >= 0) {
      e.preventDefault();
      links[acHighlight].click();
    } else if (e.key === 'Escape') {
      acDropdown.classList.add('hidden');
    }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#ac-dropdown') && e.target !== search) acDropdown.classList.add('hidden');
  });
  sortEl.addEventListener('change', function () {
    var params = new URLSearchParams(location.search);
    params.set('sort', sortEl.value);
    history.replaceState(null, '', location.pathname + '?' + params.toString());
    applyFilters();
  });

  function clearAllFilters() {
    for (var k in filters) delete filters[k];
    inputs.forEach(function (input) { input.checked = false; });
    search.value = '';
    currentPage = 1;
    syncURL();
    applyFilters();
  }

  if (filterToggle) filterToggle.addEventListener('click', function () {
    var open = filterPanel.classList.toggle('hidden');
    filterToggle.setAttribute('aria-expanded', String(!open));
  });
  if (clearAll) clearAll.addEventListener('click', clearAllFilters);
  if (emptyClear) emptyClear.addEventListener('click', clearAllFilters);

  parseURL();
  applyFilters();
})();
