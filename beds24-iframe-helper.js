/*
 * TNH Beds24 Iframe Helper
 * Stable filename — deployed via GitHub Actions CI/CD.
 * Loaded via Date.now() bootstrapper in Beds24 customhead field.
 *
 * Session 11: Offer bar rebuild
 * - Replaced Sections 3+4+6 with unified rebuildOfferBars()
 * - New .tnh-offer-bar with 3-state machine
 * - Moves Beds24 form elements (never clones) to preserve jQuery handlers
 */
(function(){
  var isWidget = location.search.indexOf('referer=widget') >= 0;
  var isEmbedded = window.parent !== window;
  function getIsRoomSearch() { return !!document.getElementById('formlook'); }
  function getIsCheckout() { return !!document.querySelector('.bp2book'); }

  /* === SECTION 1: Hide chrome + height sync (widget only) === */
  if (isWidget && isEmbedded) {
    var s = document.createElement('style');
    s.textContent = ''
      + '.b24fullcontainer-selector{display:none!important}'
      + '.b24fullcontainer-top{display:none!important}'
      + '.b24fullcontainer-ownerrow1{display:none!important}'
      + '.b24fullcontainer-footer{display:none!important}'
      + '.b24fullcontainer-proprow1{display:none!important}'
      + '.b24fullcontainer-proprow2{display:none!important}'
      + '.b24fullcontainer-proprow11{display:none!important}'
      + '.b24fullcontainer-ownerrow11{display:none!important}'
      + '#b24bookshoppingcart{display:none!important}'
      + '#selectorstripinfo{display:none!important}'
      + '.book_poweredby{display:none!important}'
      + '.bp2book .b24panel img{max-width:200px!important;height:auto!important;border-radius:8px}'
      + '.book_securelogo{display:none!important}'
      + 'body{background:transparent!important;margin:0!important;padding:0!important}'
      + '.container{max-width:100%!important;width:auto!important;box-sizing:border-box!important}'
      + '.row{max-width:100%!important}';
    document.head.appendChild(s);

    function send() {
      var h, el = document.querySelector('.b24fullcontainer-rooms') || document.querySelector('#bookingpage');
      if (el) { var r = el.getBoundingClientRect(); h = Math.ceil(r.bottom + window.scrollY); }
      else { h = document.documentElement.scrollHeight; }
      h = Math.max(h, 200);
      try { window.parent.postMessage(JSON.stringify({type:'tnh-height', height:h}), '*'); } catch(e) {}
    }
    function notifyPageChange(page) {
      try { window.parent.postMessage(JSON.stringify({type:'tnh-page-change', page:page}), '*'); } catch(e) {}
    }
    if (document.readyState === 'complete') {
      send();
      if (!getIsRoomSearch()) notifyPageChange(getIsCheckout() ? 'checkout' : 'confirmation');
    } else {
      window.addEventListener('load', function() {
        send();
        if (!getIsRoomSearch()) notifyPageChange(getIsCheckout() ? 'checkout' : 'confirmation');
      });
    }
  }

  /* === OFFER BAR REBUILD (replaces Sections 3+4+6) === */

  function detectOfferState(offer) {
    var w = offer.querySelector('[class*="offerwarndiv"]');
    if (w && !w.classList.contains('hidden')) return 'unavailable';
    var f = offer.querySelector('[id^="from-1-"]');
    if (f && f.classList.contains('hidden')) return 'available-qty';
    return 'available-noqty';
  }

  function extractPriceData(offer) {
    var f = offer.querySelector('[id^="from-1-"]');
    if (!f) return { valid: false };
    var ds = f.querySelector('.bookingpagedollars'), cs = f.querySelector('.bookingpagecents');
    if (!ds || !cs) return { valid: false };
    var d = parseInt(ds.textContent, 10), c = parseInt(cs.textContent.replace('.',''), 10) || 0;
    if (isNaN(d)) return { valid: false };
    var total = d + c / 100;
    var cur = (f.querySelector('.bookingpagecurrency') || {}).textContent || '\u20AC';
    /* Cache the base total for readLiveTotal to use */
    if (!f.dataset.tnhBaseTotal) {
      f.dataset.tnhBaseTotal = total.toFixed(2);
      f.dataset.tnhBaseCurrency = cur;
    }
    var nEl = document.querySelector('#inputnumnight');
    var n = nEl ? parseInt(nEl.value, 10) : 1;
    if (!n || n < 1) n = 1;
    return { valid: true, total: total, currency: cur, nights: n, perNight: n > 1 ? total / n : total };
  }

  function readLiveTotal(offer) {
    /* Compute total: base total × qty selected */
    var f = offer.querySelector('[id^="from-1-"]');
    if (!f) return null;
    /* Use cached base total if available, otherwise read from spans */
    var baseTotal, cur;
    if (f.dataset.tnhBaseTotal) {
      baseTotal = parseFloat(f.dataset.tnhBaseTotal);
      cur = f.dataset.tnhBaseCurrency || '\u20AC';
    } else {
      var ds = f.querySelector('.bookingpagedollars'), cs = f.querySelector('.bookingpagecents');
      if (!ds || !cs) return null;
      var d = parseInt(ds.textContent, 10), c = parseInt(cs.textContent.replace('.',''), 10) || 0;
      if (isNaN(d)) return null;
      baseTotal = d + c / 100;
      cur = (f.querySelector('.bookingpagecurrency') || {}).textContent || '\u20AC';
      f.dataset.tnhBaseTotal = baseTotal.toFixed(2);
      f.dataset.tnhBaseCurrency = cur;
    }
    if (isNaN(baseTotal)) return null;
    /* Read qty from the select */
    var qs = offer.querySelector('select[id^="sr1-"]');
    var qty = qs ? parseInt(qs.value, 10) : 1;
    if (!qty || qty < 1) qty = 1;
    /* For dorms, read from guest select instead */
    if (offer.querySelector('input[type="hidden"][name^="sr1-"]')) {
      var gs = offer.querySelector('select[id^="naa"]');
      qty = gs ? parseInt(gs.value, 10) : 1;
      if (!qty || qty < 1) qty = 1;
    }
    return { total: baseTotal * qty, currency: cur };
  }

  function isDormOffer(offer) {
    return !!offer.querySelector('input[type="hidden"][name^="sr1-"]');
  }

  function getOrCreateOfferBar(offer) {
    var existing = offer.querySelector('.tnh-offer-bar');
    if (existing) return existing;
    var bar = document.createElement('div');
    bar.className = 'tnh-offer-bar';
    var row = offer.querySelector('.row');
    var strip = row ? row.querySelector('.b24-offer-pricetable') : null;
    if (row && strip) row.insertBefore(bar, strip);
    else if (row) row.appendChild(bar);
    return bar;
  }

  function movePriceBoxInto(bar, offer) {
    var controls = bar.querySelector('.tnh-offer-controls');
    if (!controls) return;
    if (bar.dataset.tnhMoved === 'true' && controls.querySelector('.b24-multipricebox')) return;
    bar.dataset.tnhMoved = '';
    var sel = offer.querySelector('.b24-offer-select');
    if (!sel) return;
    var boxes = sel.querySelectorAll('.b24-multipricebox'), mainBox = null;
    for (var i = 0; i < boxes.length; i++) {
      if (!boxes[i].classList.contains('hidden') && boxes[i].querySelector('[id^="from-"]')) { mainBox = boxes[i]; break; }
    }
    if (!mainBox) return;
    var label = controls.querySelector('.tnh-offer-label');
    if (label) controls.insertBefore(mainBox, label.nextSibling);
    else controls.insertBefore(mainBox, controls.querySelector('.tnh-total-price'));
    bar.dataset.tnhMoved = 'true';
  }

  function handleDormControls(bar, offer) {
    if (bar.dataset.tnhDormDone === 'true') return;
    var sel = offer.querySelector('.b24-offer-select');
    if (!sel) return;
    var gs = sel.querySelector('select[id^="naa"]');
    if (!gs) return;
    for (var i = 0; i < gs.options.length; i++) {
      if (i === 0 && (gs.options[i].value === '0' || gs.options[i].value === '')) {
        gs.options[i].text = '-';
      } else {
        gs.options[i].text = gs.options[i].text.replace(/Guests?/g, function(m) { return m === 'Guest' ? 'Bed' : 'Beds'; });
      }
    }
    var controls = bar.querySelector('.tnh-offer-controls');
    if (!controls) return;
    var wrapper = document.createElement('span');
    wrapper.className = 'tnh-dorm-select-wrapper';
    var lbl = document.createElement('span');
    lbl.className = 'tnh-offer-label'; lbl.textContent = 'Beds';
    wrapper.appendChild(lbl);
    wrapper.appendChild(gs); /* MOVE, not clone */
    var existing = controls.querySelector('.tnh-offer-label');
    if (existing) controls.replaceChild(wrapper, existing);
    else controls.insertBefore(wrapper, controls.firstChild);
    /* Hide orphan second pricebox */
    sel.querySelectorAll('.b24-multipricebox').forEach(function(box) {
      if (!box.classList.contains('hidden') && !box.querySelector('[id^="from-"]') && !box.closest('.tnh-offer-bar'))
        box.style.setProperty('display', 'none', 'important');
    });
    bar.dataset.tnhDormDone = 'true';
  }

  function formatPrice(pd) {
    if (!pd.valid) return '';
    return pd.nights > 1
      ? 'from ' + pd.currency + pd.perNight.toFixed(2) + ' / night'
      : 'from ' + pd.currency + pd.total.toFixed(2);
  }

  function renderOfferBar(bar, offer, state, pd) {
    var controls = bar.querySelector('.tnh-offer-controls');
    var priceDiv = bar.querySelector('.tnh-offer-price');
    var totalEl = bar.querySelector('.tnh-total-price');
    var unavailEl = bar.querySelector('.tnh-unavailable');

    if (state === 'unavailable') {
      if (controls) controls.style.display = 'none';
      if (priceDiv) priceDiv.style.display = 'none';
      if (!unavailEl) { unavailEl = document.createElement('div'); unavailEl.className = 'tnh-unavailable'; bar.appendChild(unavailEl); }
      var w = offer.querySelector('[class*="offerwarndiv"]');
      unavailEl.textContent = w ? w.textContent.trim() : 'Not available for selected dates';
      unavailEl.style.display = '';
      return;
    }

    if (unavailEl) unavailEl.style.display = 'none';
    if (controls) controls.style.display = '';
    if (priceDiv) { priceDiv.style.display = ''; priceDiv.textContent = formatPrice(pd); }

    if (state === 'available-noqty') {
      if (totalEl) { totalEl.style.display = 'none'; totalEl.textContent = ''; }
    } else {
      if (totalEl) {
        var live = readLiveTotal(offer);
        if (live) { totalEl.textContent = live.currency + live.total.toFixed(2); totalEl.style.display = ''; }
      }
    }
  }

  function attachBookHandler(btn, offer) {
    if (btn.dataset.tnhBound === 'true') return;
    btn.dataset.tnhBound = 'true';
    var dorm = isDormOffer(offer);
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var qs = offer.querySelector('select[id^="sr1-"]');
      var gs = offer.querySelector('select[id^="naa"]');
      if (qs && (qs.value === '0' || qs.value === '')) {
        qs.value = '1'; qs.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (dorm && gs && (gs.value === '0' || gs.value === '')) {
        gs.value = '1'; gs.dispatchEvent(new Event('change', { bubbles: true }));
      }
      var form = document.getElementById('formlook');
      if (form) {
        if (!form.querySelector('input[name="bookmult"]')) {
          var bm = document.createElement('input');
          bm.type = 'hidden'; bm.name = 'bookmult'; bm.value = '';
          form.appendChild(bm);
        }
        form.submit();
      }
    });
  }

  function buildOfferBar(offer) {
    var state = detectOfferState(offer);
    var pd = extractPriceData(offer);
    var bar = getOrCreateOfferBar(offer);
    var dorm = isDormOffer(offer);

    if (!bar.querySelector('.tnh-offer-price')) {
      var priceDiv = document.createElement('div');
      priceDiv.className = 'tnh-offer-price';
      bar.appendChild(priceDiv);
      var controls = document.createElement('div');
      controls.className = 'tnh-offer-controls';
      if (!dorm) {
        var lbl = document.createElement('span');
        lbl.className = 'tnh-offer-label'; lbl.textContent = 'Select';
        controls.appendChild(lbl);
      }
      var totalEl = document.createElement('span');
      totalEl.className = 'tnh-total-price'; totalEl.style.display = 'none';
      controls.appendChild(totalEl);
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'tnh-book-btn'; btn.textContent = 'Book';
      controls.appendChild(btn);
      bar.appendChild(controls);
    }

    if (state !== 'unavailable') {
      movePriceBoxInto(bar, offer);
      if (dorm) handleDormControls(bar, offer);
    }
    renderOfferBar(bar, offer, state, pd);
    var bookBtn = bar.querySelector('.tnh-book-btn');
    if (bookBtn) attachBookHandler(bookBtn, offer);
  }

  function rebuildOfferBars() {
    if (!getIsRoomSearch()) return;
    document.querySelectorAll('.offer').forEach(buildOfferBar);
    document.querySelectorAll('select[id^="sr1-"]').forEach(function(sel) {
      if (sel.options[0] && (sel.options[0].text === 'Quantity' || sel.options[0].value === '0'))
        sel.options[0].text = '-';
    });
  }

  /* === SECTION 5: Date strip overrides === */
  var dss = document.createElement('style');
  dss.textContent = ''
    + '.datestay{background-color:#6DA17D!important;color:#fff!important}'
    + '.setsplitdates1 .datestay.prevdateavail,.setsplitdates1 .datestay.prevdatenotavail,.setsplitdates1 .datestay.prevdaterequest'
    + '{background:linear-gradient(-45deg,#6DA17D,#6DA17D 50%,#F7FAFC 50%)!important}'
    + '.setsplitdates1 .dateavail.prevdatestay:not(.datestay)'
    + '{background:linear-gradient(-45deg,#F7FAFC,#F7FAFC 50%,#6DA17D 50%)!important}'
    + '.setsplitdates1 .datenotavail.prevdatestay:not(.datestay)'
    + '{background:linear-gradient(-45deg,rgba(200,60,60,.12),rgba(200,60,60,.12) 50%,#6DA17D 50%)!important}'
    + '.datenotavail{background-color:rgba(200,60,60,.10)!important;color:#a04040!important;text-decoration:line-through;opacity:.8}'
    + '.dateavail:hover{background-color:rgba(109,161,125,.15)!important}'
    + '.roomofferpricetable .at_pricetd{pointer-events:none!important;cursor:default!important}'
    + '.roomofferpricetable tr.b24-bookingstrip{display:none!important}';
  document.head.appendChild(dss);

  /* === SECTION 7: Room card enhancement === */
  var ROOM_TAGS = {
    '567218': [{icon:'\uD83D\uDECF',text:'Sleeps 2'},{icon:'\uD83D\uDEBF',text:'Ensuite'},{icon:'\uD83C\uDFD9',text:'City View'},{icon:'\uD83D\uDCBC',text:'Work Desk'},{icon:'\uD83D\uDC51',text:'Premium'}],
    '567220': [{icon:'\uD83D\uDECF',text:'Sleeps 1'},{icon:'\uD83D\uDEBF',text:'Shared Bathroom'},{icon:'\uD83D\uDCBC',text:'Work Desk'},{icon:'\uD83D\uDD12',text:'Private'}],
    '567221': [{icon:'\uD83D\uDECF',text:'Sleeps 2'},{icon:'\uD83D\uDEBF',text:'Shared Bathroom'},{icon:'\uD83D\uDCBC',text:'Work Desk'},{icon:'\uD83D\uDD12',text:'Private'}],
    '567219': [{icon:'\uD83D\uDECF',text:'1 Bed'},{icon:'\uD83D\uDC65',text:'4-Bed Dorm'},{icon:'\uD83C\uDFD9',text:'City View'},{icon:'\uD83D\uDD0C',text:'Power Outlet'},{icon:'\uD83D\uDCA1',text:'Reading Light'}]
  };
  function buildTagsDiv(tags, cls) {
    var c = document.createElement('div'); c.className = cls;
    tags.forEach(function(t) { var b = document.createElement('span'); b.className = 'tnh-tag'; b.textContent = t.icon + ' ' + t.text; c.appendChild(b); });
    return c;
  }
  function enhanceRoomCards() {
    if (!getIsRoomSearch()) return;
    document.querySelectorAll('.b24room').forEach(function(room) {
      if (room.querySelector('.tnh-room-tags')) return;
      var roomId = (room.id || '').replace('roomid', ''), tags = ROOM_TAGS[roomId];
      if (!tags) return;
      var dc = room.querySelector('[id^="collapsedesc"]');
      if (dc) { var dt = dc.querySelector('div:not(.fakelink)'); if (dt) dt.className = 'tnh-desc-text'; }
      var dm = room.querySelector('.b24-room-desc');
      if (dm) dm.appendChild(buildTagsDiv(tags, 'tnh-room-tags'));
      var pb = room.querySelector('.panel-body.b24panel'), off = pb ? pb.querySelector('.offer') : null;
      if (pb && off) pb.insertBefore(buildTagsDiv(tags, 'tnh-room-tags-mobile'), off);
    });
  }

  /* === SECTION 8: Room sorting === */
  function sortRooms() {
    if (!getIsRoomSearch()) return;
    var rooms = document.querySelectorAll('.b24room');
    if (rooms.length < 2) return;
    var parent = rooms[0].parentElement;
    if (!parent || parent.dataset.tnhSorted === 'true') return;
    var sortable = [];
    rooms.forEach(function(room) {
      var offer = room.querySelector('.offer'), price = 999999, unavail = false;
      if (offer) {
        var fd = offer.querySelector('[id^="from-"]');
        if (fd) {
          var dol = fd.querySelector('.bookingpagedollars'), cen = fd.querySelector('.bookingpagecents');
          if (dol && cen) { var d = parseInt(dol.textContent, 10), c = parseInt(cen.textContent.replace('.',''), 10) || 0; if (!isNaN(d)) price = d + c / 100; }
        }
        var w = offer.querySelector('[class*="offerwarndiv"]');
        if (w && !w.classList.contains('hidden')) unavail = true;
      }
      sortable.push({ el: room, price: price, unavailable: unavail });
    });
    if (!sortable.some(function(s) { return s.price < 999999; })) return;
    sortable.sort(function(a, b) {
      if (a.unavailable !== b.unavailable) return a.unavailable ? 1 : -1;
      return a.price - b.price;
    });
    sortable.forEach(function(item) { parent.appendChild(item.el); });
    parent.dataset.tnhSorted = 'true';
  }

  /* === INIT === */
  var isModifying = false;
  function applyFixes() {
    if (isModifying) return;
    isModifying = true;
    try { rebuildOfferBars(); enhanceRoomCards(); sortRooms(); if (isWidget && isEmbedded) send(); } catch(e) {}
    setTimeout(function() { isModifying = false; }, 500);
  }
  function init() {
    applyFixes();
    function attachObserver() {
      if (!document.body) return;
      if (typeof MutationObserver !== 'undefined') {
        var t;
        new MutationObserver(function() {
          if (isModifying) return; clearTimeout(t); t = setTimeout(applyFixes, 300);
        }).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
      }
    }
    if (document.body) attachObserver();
    else document.addEventListener('DOMContentLoaded', attachObserver);
    if (isWidget && isEmbedded) {
      window.addEventListener('resize', send);
      document.addEventListener('load', function(e) { if (e.target.tagName === 'IMG') setTimeout(send, 100); }, true);
      var c = 0, iv = setInterval(function() { applyFixes(); if (++c >= 30) clearInterval(iv); }, 1000);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
