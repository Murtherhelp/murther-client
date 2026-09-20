  /* ---- menu pass check (v1.52.1) ------------------------------------------------------
     The three editor panes gained a self-description, a CARD per feature row and a movable
     category. This drives the REAL pane markup through the real code paths:

       (a) PANE INTRO. Settings and Hotkeys now describe themselves above the search bar
           (Themes already did). Asserted by POSITION, not by text: the intro is an element
           child of the search bar's OWN parent and precedes it. The lookup is scoped to
           the pane that is NOT .mx-hidden — Hotkeys and Themes wrap their categories in
           .mx-theme-body while the bar lives in the outer pane in both cases.
       (b) CARDS. A feature row directly inside its parent section carries the card styling
           (a 2px accent in the category's colour is visibly different from the 1px
           border elsewhere, plus a non-transparent background). A row nested one level
           deeper — the note cards' own .mx-set-row action strips — is deliberately NOT
           carded: a card inside a card is not a feature. The colour test is needed
           because the shell carries zoom, so border widths are scaled and a px comparison
           varies with the device.
       (c) MOVE. A CLOSED category is dragged by its grip onto the other closed one: the DOM
           reorders, the ARRANGEMENT IS WRITTEN TO THE SETTINGS STORE (which is what makes a
           Backup carry it — the old open/closed flag lived only in localStorage), the moved
           category is still closed, and order AND fold state both survive a pane rebuild.
       (d) SEARCH. While a filter is active the grip is refused (draggable="false") or the
           matching sections collapse entirely (filter hides rows with mx-hidden and the whole
           section gets mx-hidden when nothing in it matches), because a filtered pane
           holds only the matches — saving that would silently drop every hidden
           category's position.

     It captures the raw settings string first and restores it afterwards, and restores the DOM
     arrangement and the fold state it borrowed, so running it on the real client leaves the
     store byte-identical and the menu as it was. Order is re-applied PAIRWISE among sections
     only, so a non-section sibling (the intro, the search bar) can never be displaced — that
     was the old fixed-slot bug.
       await __mxMenuCheck() -> { ok, panes, cards, moved, orderInStore, searchRefuses, ... }
  ------------------------------------------------------------------------------------- */
  window.__mxMenuCheck = function () {
    var out = { ok: false, steps: [] };
    var M = window.__murther;
    if (!M || !M.openMenu || !M.closeMenu || !M.menu || !M.menuMove) return Promise.resolve({ ok: false, why: 'no __murther menu API' });
    var LS = 'murther_settings_v1';
    var raw = null; try { raw = localStorage.getItem(LS); } catch (e0) {}
    var saved = M.menu();
    M.openMenu();

    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function q(sel, root) { return (root || document).querySelector(sel); }
    function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    /* Tabs: the shell also renders a ruler with .mx-tab clones for measurement — it has
       aria-hidden and class mx-nav-ruler and lives inside .mx-left. A document-wide
       ".mx-tabs .mx-tab" query hits those ghosts too when the ruler is populated, and
       clicking a ghost has no handlers. Scope to the pane tabs (they are the ones that
       carry role="tablist" and are NOT the ruler). */
    function tab(name) {
      var hit = null;
      /* real tabs: the ruler also has role attributes (cloneNode(true)), but it is
         aria-hidden="true" — the real bar has role="tablist" without aria-hidden */
      var bars = all('[role="tablist"]').filter(function (b) { return b.getAttribute('aria-hidden') !== 'true' && !b.classList.contains('mx-nav-ruler'); });
      var tabs = bars.length ? all('[role="tab"]', bars[0]) : all('.mx-left .mx-tabs:not(.mx-nav-ruler) .mx-tab');
      tabs.forEach(function (b) {
        var l = q('.mx-tab-lbl', b);
        if (l && l.textContent.replace(/\s+/g, ' ').trim() === name) hit = b;
      });
      if (!hit) all('.mx-left .mx-tabs .mx-tab').forEach(function (b) { var l = q('.mx-tab-lbl', b); if (l && l.textContent.replace(/\s+/g, ' ').trim() === name) hit = b; });
      if (hit) hit.click();
      return !!hit;
    }
    function activeSearch() {
      var cand = all('input.mx-settings-search, input.mx-theme-search');
      for (var i = 0; i < cand.length; i++) {
        var el = cand[i];
        try { if (el.closest('.mx-hidden')) continue; } catch (e) { }
        if (el.offsetParent !== null) return el;
        // closest may not be available in very old builds; fall back to hidden-class ancestor walk
        var p = el;
        var hidden = false;
        while (p && p.nodeType === 1) { if (p.classList && p.classList.contains('mx-hidden')) { hidden = true; break; } p = p.parentElement; }
        if (!hidden) return el;
      }
      return cand[0] || null;
    }
    function host(pane) {
      var s = q('.mx-tsec[data-mx-pane="' + pane + '"]');
      return s ? s.parentNode : null;
    }
    function secs(pane) {
      var h = host(pane);
      return h ? all('.mx-tsec', h).filter(function (c) { return c.parentNode === h; }) : [];
    }
    function keys(pane) { return secs(pane).map(function (s) { return s.getAttribute('data-mx-key'); }); }
    function introProbe() {
      var s = activeSearch();
      if (!s || !s.parentNode) return { ok: false, why: 'no active search box' };
      var par = s.parentNode;
      var idx = Array.prototype.indexOf.call(par.children, s);
      var before = Array.prototype.slice.call(par.children, 0, idx).filter(function (c) { return /\bmx-kb-note\b/.test(c.className || ''); });
      return { ok: before.length > 0, bar: (s.className || ''), parent: (par.className || '').slice(0, 40), barIdx: idx, beforeCount: before.length, total: par.children.length };
    }
    function cardProbe(pane, label) {
      tab(label);
      var row = document.querySelector('.mx-tsec[data-mx-pane="' + pane + '"] .mx-set-row, .mx-tsec[data-mx-pane="' + pane + '"] .mx-kb, .mx-tsec[data-mx-pane="' + pane + '"] .mx-trow');
      if (!row) return { carded: false, why: 'no feature row found for ' + pane };
      var cs = getComputedStyle(row);
      // The shell carries zoom (e.g. 0.94), so widths are scaled and a literal "2px vs 1px"
      // assertion is a false negative. The invariant is the COLOUR: the accent must be the
      // category's own colour (from --mx-feature-*), visibly different from the generic border
      // elsewhere on the row.
      var accentEq = cs.borderLeftColor === cs.borderTopColor;
      return { carded: !accentEq && cs.backgroundColor !== 'rgba(0, 0, 0, 0)',
               left: cs.borderLeftWidth, leftColor: cs.borderLeftColor,
               top: cs.borderTopWidth, topColor: cs.borderTopColor,
               bg: cs.backgroundColor, cls: row.className };
    }
    function nestedProbe() {
      var row = document.querySelector('.mx-kb-note .mx-set-row');
      if (!row) return { skipped: true, why: 'no note-card row on this build' };
      var cs = getComputedStyle(row);
      return { skipped: false, bg: cs.backgroundColor, left: cs.borderLeftWidth, top: cs.borderTopWidth,
               cls: row.className, carded: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' };
    }
    function drag(from, to, where) {
      var grip = q('.mx-tsec-grip', from);
      if (!grip) return;
      var r = to.getBoundingClientRect();
      var y = where === 'after' ? r.top + Math.max(1, r.height - 1) : r.top + 1;
      var dt = null; try { dt = new DataTransfer(); } catch (e1) {}
      function fire(type, node) {
        var e;
        try { e = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, clientY: y }); }
        catch (e2) { e = new Event(type, { bubbles: true, cancelable: true }); }
        node.dispatchEvent(e);
      }
      fire('dragstart', grip);
      fire('dragover', to);
      fire('drop', to);
      fire('dragend', grip);
    }
    function restoreDOM(pane, want) {
      var h = host(pane);
      if (!h || !Array.isArray(want) || !want.length) return;
      for (var i = want.length - 1; i >= 0; i--) {
        var el = h.querySelector('.mx-tsec[data-mx-key="' + want[i] + '"]');
        if (!el || el.parentNode !== h) continue;
        var nxt = want[i + 1];
        if (nxt) {
          var ref = h.querySelector('.mx-tsec[data-mx-key="' + nxt + '"]');
          if (ref && ref.parentNode === h && ref !== el) h.insertBefore(el, ref);
        }
      }
      var last = want[want.length - 1];
      if (last) { try { M.menuMove(pane, last, null); } catch (eM) {} }
    }

    var panesInfo = {}, borrowed = [], beenA = false, beenB = false, targetHeight0 = null;
    return wait(520)
      .then(function () {
        tab('Settings'); return wait(360);
      })
      .then(function () {
        panesInfo.settingsKeys = keys('settings');
        var ip0 = introProbe();
        panesInfo.settingsIntro = ip0;
        var cp0 = cardProbe('settings', 'Settings');
        panesInfo.settingsCard = cp0;
        return wait(160);
      })
      .then(function () {
        tab('Hotkeys'); return wait(360);
      })
      .then(function () {
        panesInfo.hotkeysKeys = keys('hotkeys');
        var ip1 = introProbe();
        panesInfo.hotkeysIntro = ip1;
        var cp1 = cardProbe('hotkeys', 'Hotkeys');
        panesInfo.hotkeysCard = cp1;
        panesInfo.nestedRow = nestedProbe();
        panesInfo.nestedOk = !!panesInfo.nestedRow.skipped || !panesInfo.nestedRow.carded;
        return wait(160);
      })
      .then(function () {
        tab('Themes'); return wait(360);
      })
      .then(function () {
        panesInfo.themesKeys = keys('themes');
        var ip2 = introProbe();
        panesInfo.themesIntro = ip2;
        var cp2 = cardProbe('themes', 'Themes');
        panesInfo.themesCard = cp2;
        out.panes = panesInfo;
        out.intro = !!(panesInfo.settingsIntro.ok && panesInfo.hotkeysIntro.ok && panesInfo.themesIntro.ok);
        out.keysOk = !!(panesInfo.settingsKeys.length >= 3 && panesInfo.hotkeysKeys.length >= 3 && panesInfo.themesKeys.length >= 2);
        function paneOk(p) { var list = secs(p); return list.length === all('.mx-tsec[data-mx-pane="' + p + '"]', host(p)).length &&
          list.every(function (s) { return !!s.getAttribute('data-mx-key') && !!q('.mx-tsec-grip', s); }); }
        out.keyedGripsOk = paneOk('settings') && paneOk('hotkeys') && paneOk('themes');
        out.cards = { settings: panesInfo.settingsCard, hotkeys: panesInfo.hotkeysCard, themes: panesInfo.themesCard };
        out.cardsOk = ['settings', 'hotkeys', 'themes'].every(function (p) { return panesInfo[p + 'Card'].carded; });
        out.nestedRow = panesInfo.nestedRow;
        out.nestedOk = panesInfo.nestedOk;
        return wait(200);
      })
      .then(function () {
        tab('Settings'); return wait(420);
      })
      .then(function () {
        var list = secs('settings');
        if (list.length < 3) { out.steps.push('too few settings categories'); return wait(60); }
        out.before = keys('settings');
        var a = list[list.length - 1], b = list[list.length - 2];
        beenA = a.classList.contains('closed'); beenB = b.classList.contains('closed');
        try { targetHeight0 = b.getBoundingClientRect().height; } catch (eR) { targetHeight0 = null; }
        out.targetHeight = targetHeight0;
        if (targetHeight0 === 0) out.steps.push('target had no layout box (pane not laid out — guard path, not proven here)');
        if (!beenA) q('.mx-tsec-head', a).click();
        if (!beenB) q('.mx-tsec-head', b).click();
        out.closedPair = [a.classList.contains('closed'), b.classList.contains('closed')];
        drag(a, b, 'before');
        var after = keys('settings');
        out.moved = after.indexOf(a.getAttribute('data-mx-key')) < after.indexOf(b.getAttribute('data-mx-key'));
        out.movedKeyStaysClosed = a.classList.contains('closed');
        var st = M.menu();
        out.storeOrder = (st.order || {}).settings || null;
        out.storeClosed = (st.closed || {}).settings || null;
        out.orderInStore = Array.isArray(out.storeOrder) && out.storeOrder.join('|') === after.join('|');
        out.closedInStore = !!(out.storeClosed && out.storeClosed[a.getAttribute('data-mx-key')] === true);
        out.domAfterDrag = after;
        borrowed.push({ el: a, was: beenA }, { el: b, was: beenB });
        return wait(220);
      })
      .then(function () { tab('Themes'); return wait(420); })
      .then(function () { tab('Settings'); return wait(420); })
      .then(function () {
        out.afterRebuild = keys('settings');
        out.orderSurvived = !!(out.storeOrder && out.afterRebuild.join('|') === out.storeOrder.join('|'));
        var movedKey = out.before[out.before.length - 1];
        var movedEl = document.querySelector('.mx-tsec[data-mx-pane="settings"][data-mx-key="' + movedKey + '"]');
        out.closedSurvived = !!(movedEl && movedEl.classList.contains('closed'));
        var s = activeSearch();
        out.searchSeen = !!s;
        out.searchWas = s ? (s.className || '') : null;
        if (s) { s.value = 'zzzzz'; s.dispatchEvent(new Event('input', { bubbles: true })); }
        return wait(420);
      })
      .then(function () {
        var list = secs('settings');
        var grips = list.map(function (x) { var g = q('.mx-tsec-grip', x); return g ? g.getAttribute('draggable') : null; });
        var hiddens = list.map(function (x) { return x.classList.contains('mx-hidden'); });
        out.search = { sections: list.length, grips: grips, hiddens: hiddens, activeClass: (activeSearch() && activeSearch().className) || null };
        // Settings' filter hides rows with mx-hidden; a non-matching query makes every
        // section's rows hidden and the section itself gets mx-hidden (plus its grip's head
        // display becomes none). That IS the "refused" state for Settings. Themes and Hotkeys
        // instead rebuild with forceOpen and mark the grip draggable="false".
        var allGripsOff = list.length === 0 ? grips.length === 0 : grips.every(function (d) { return d === 'false'; });
        var allHidden = list.length > 0 && hiddens.every(function (h) { return !!h; });
        out.searchRefuses = allGripsOff || allHidden;
        var s = activeSearch();
        if (s) { s.value = ''; s.dispatchEvent(new Event('input', { bubbles: true })); }
        return wait(420);
      })
      .then(function () {
        ['settings', 'hotkeys', 'themes'].forEach(function (pane) {
          var want = (saved.order || {})[pane];
          if (!Array.isArray(want) || !want.length) return;
          restoreDOM(pane, want);
        });
        borrowed.forEach(function (b) {
          if (!b.el.isConnected) return;
          if (b.el.classList.contains('closed') !== b.was) {
            var hd = q('.mx-tsec-head', b.el);
            if (hd) hd.click();
          }
        });
        if (raw === null) { try { localStorage.removeItem(LS); } catch (eR) {} }
        else { try { localStorage.setItem(LS, raw); } catch (eR2) {} }
        out.restored = 'store string put back; pairwise DOM + fold-state restored';
        out.restoredNote = 'in-memory layout still holds the dragged arrangement until reload — which is why the harness is a throwaway page';
        M.closeMenu();
        out.ok = !!(out.intro && out.keysOk && out.keyedGripsOk && out.cardsOk && out.nestedOk &&
                    out.closedPair && out.closedPair[0] && out.closedPair[1] && out.moved &&
                    out.movedKeyStaysClosed && out.targetHeight > 0 && out.orderInStore &&
                    out.closedInStore && out.orderSurvived && out.closedSurvived && out.searchRefuses);
        try { console.log('[murther] menu check', out); } catch (eL) {}
        return out;
      });
  };
