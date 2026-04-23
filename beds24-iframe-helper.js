/*
 * TNH Beds24 Iframe Helper
 * Stable filename — deployed via GitHub Actions CI/CD.
 * Loaded via Date.now() bootstrapper in Beds24 customhead field.
 *
 * Session 10 updates:
 * - Viewport clamp for iOS Safari iframe: html/body overflow-x constraint
 * - All Bootstrap .container elements clamped to 100% width
 * - All v16 functionality preserved
 * Session 9 updates:
 * - Dual tag injection (desktop inside desc column + mobile as direct grid child)
 * - Description text styled with .tnh-desc-text (NOT hidden)
 * - Book button wrapped in .tnh-book-group with total price
 * - Per-night price: lighter style, no subtitle line
 * - Qty placeholder changed from "Quantity" to "-"
 * - All previous: lazy page detection, bookmult, checkout in iframe, dorm fix
 */
(function(){
  var config = resolveConfig();
  if (!config) {
    console.error('[TNH] No config found (window.TNH_CONFIG missing or invalid). Helper halted.');
    return;
  }

  var isWidget = location.search.indexOf('referer=widget') >= 0;
  var isEmbedded = window.parent !== window;

  /* Lazy page detection — DOM may not exist yet when script loads in <head> */
  function getIsRoomSearch() { return !!document.getElementById('formlook'); }
  function getIsCheckout() { return !!document.querySelector('.bp2book'); }

  /* ============================================
   * SECTION 1: Hide chrome + height sync (widget only)
   * ============================================ */
  if (isWidget && isEmbedded) {
    var s = document.createElement('style');
    s.textContent = ''
      /* Room search page chrome */
      + '.b24fullcontainer-selector{display:none!important}'
      + '.b24fullcontainer-top{display:none!important}'
      + '.b24fullcontainer-ownerrow1{display:none!important}'
      + '.b24fullcontainer-footer{display:none!important}'
      + '.b24fullcontainer-proprow1{display:none!important}'
      + '.b24fullcontainer-proprow2{display:none!important}'
      + '.b24fullcontainer-proprow11{display:none!important}'
      + '.b24fullcontainer-ownerrow11{display:none!important}'
      + '#b24bookshoppingcart{display:none!important}'
      /* Checkout/confirmation page chrome */
      + '#selectorstripinfo{display:none!important}'
      + '.book_poweredby{display:none!important}'
      + '.bp2book .b24panel img{max-width:200px!important;height:auto!important;border-radius:8px}'
      + '.book_securelogo{display:none!important}'
      /* Shared */
      + 'body{background:transparent!important;margin:0!important;padding:0!important}'
      /* iOS Safari iframe viewport fix: prevent Bootstrap containers from expanding iframe */
      + '.container{max-width:100%!important;width:auto!important;box-sizing:border-box!important}'
      + '.row{max-width:100%!important}';
    document.head.appendChild(s);

    function send() {
      var h;
      var rooms = document.querySelector('.b24fullcontainer-rooms');
      var bookingPage = document.querySelector('#bookingpage');
      if (rooms) {
        var rect = rooms.getBoundingClientRect();
        h = Math.ceil(rect.bottom + window.scrollY);
      } else if (bookingPage) {
        var rect2 = bookingPage.getBoundingClientRect();
        h = Math.ceil(rect2.bottom + window.scrollY);
      } else {
        h = document.documentElement.scrollHeight;
      }
      h = Math.max(h, 200);
      try {
        window.parent.postMessage(JSON.stringify({type:'tnh-height', height:h}), '*');
      } catch(e) {}
    }

    function notifyPageChange(page) {
      try {
        window.parent.postMessage(JSON.stringify({type:'tnh-page-change', page:page}), '*');
      } catch(e) {}
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

  /* ============================================
   * SECTION 2: (removed — checkout stays in iframe)
   * ============================================ */

  /* ============================================
   * SECTION 3: Dorm booking fix
   * Moves native naa select from BOX 1 into BOX 0,
   * shows it with inline !important, adds bed options.
   * See docs/skill/dom-structure.md §8 for box structure.
   * ============================================ */
  function fixDormRooms() {
    if (!getIsRoomSearch()) return;

    var dormInputs = document.querySelectorAll('input[type="hidden"][name^="sr1-"]');
    dormInputs.forEach(function(dormInput) {
      /* BOX 0: the .b24-multipricebox that contains the hidden sr1- input */
      var priceBox = dormInput.closest('.b24-multipricebox');
      if (!priceBox) return;
      if (priceBox.querySelector('.tnh-dorm-label')) return; /* already processed */

      var offer = priceBox.closest('.offer');
      if (!offer) return;

      /* naaSelect lives in BOX 1 (orphan box, no from-price) */
      var naaSelect = offer.querySelector('select[id^="naa"]');
      if (!naaSelect) return;

      /* Hide BOX 1 — after we move naaSelect out it's empty */
      var boxes = offer.querySelectorAll('.b24-multipricebox');
      boxes.forEach(function(box) {
        if (box !== priceBox) box.style.setProperty('display', 'none', 'important');
      });

      /* Get bed count from config tag "N-Bed Dorm" */
      var dormRoomId = dormInput.name.replace(/^sr1-/, '');
      var numBeds = 1;
      config.rooms.forEach(function(r) {
        if (String(r.id) === dormRoomId && r.isDorm && r.tags) {
          r.tags.forEach(function(tag) {
            var m = tag.text && tag.text.match(/^(\d+)-Bed Dorm$/i);
            if (m) numBeds = parseInt(m[1], 10);
          });
        }
      });

      /* Add missing options — Beds24 only generates up to numadult beds */
      var existingMax = 0;
      for (var i = 0; i < naaSelect.options.length; i++) {
        var v = parseInt(naaSelect.options[i].value, 10);
        if (!isNaN(v) && v > existingMax) existingMax = v;
      }
      for (var n = existingMax + 1; n <= numBeds; n++) {
        var newOpt = document.createElement('option');
        newOpt.value = String(n);
        newOpt.text = n + ' Bed' + (n === 1 ? '' : 's');
        naaSelect.appendChild(newOpt);
      }

      /* Relabel: "0 Guests" → "-", "N Guest(s)" → "N Bed(s)" */
      for (var j = 0; j < naaSelect.options.length; j++) {
        var o = naaSelect.options[j];
        if (o.value === '0' || o.value === '') {
          o.text = '-';
        } else {
          o.text = o.text.replace(/(\d+)\s*Guests?$/i, function(_, num) {
            var k = parseInt(num, 10);
            return k + ' Bed' + (k === 1 ? '' : 's');
          });
        }
      }

      /* Show naaSelect — inline !important beats CSS-base.css display:none!important */
      naaSelect.style.cssText = ''
        + 'display:inline-block!important;'
        + 'visibility:visible!important;'
        + 'width:auto;min-width:80px;padding:4px 8px;'
        + 'font-family:inherit;font-size:13px;'
        + 'border:1.5px solid #d4e0d4;border-radius:6px;'
        + 'background:#F7FAFC;color:#2D482D;cursor:pointer;';

      /* Move naaSelect into BOX 0 with "Beds:" label, before the from-price */
      var wrapper = document.createElement('span');
      wrapper.className = 'tnh-dorm-label';
      wrapper.style.cssText = 'display:inline-flex;align-items:center;gap:6px;flex-shrink:0;';
      var label = document.createElement('span');
      label.textContent = 'Beds:';
      label.style.cssText = 'font-size:13px;font-weight:500;color:#5a6f5a;white-space:nowrap;';
      wrapper.appendChild(label);
      wrapper.appendChild(naaSelect);

      var fromPrice = priceBox.querySelector('[id^="from-"]');
      if (fromPrice) {
        priceBox.insertBefore(wrapper, fromPrice);
      } else {
        priceBox.insertBefore(wrapper, priceBox.firstChild);
      }
    });
  }

  /* ============================================
   * SECTION 4: Inject per-room Book buttons
   * Now wrapped in .tnh-book-group with total price
   * ============================================ */
  function injectBookButtons() {
    if (!getIsRoomSearch()) return;

    function injectIntoBox(priceBox, qtySelect, hiddenInput, guestSelect) {
      if (priceBox.querySelector('.tnh-book-btn')) return;

      /* Add change listener on whichever select drives this room's booking.
         Beds24 AJAX briefly adds .hidden to the from-price div during a price
         update; the MutationObserver debounces 300 ms before we fix it back.
         This listener fires immediately on selection and keeps the div visible,
         preventing the Book button from jumping upward on mobile. */
      [qtySelect, guestSelect].forEach(function(sel) {
        if (!sel) return;
        sel.addEventListener('change', function() {
          var fromDiv = priceBox.querySelector('[id^="from-"]');
          if (fromDiv) {
            fromDiv.style.setProperty('display', 'block', 'important');
            fromDiv.classList.remove('hidden');
          }
        });
      });

      var fromDiv = priceBox.querySelector('[id^="from-"]');
      var dollarsSpan = fromDiv ? fromDiv.querySelector('.bookingpagedollars') : null;
      var centsSpan = fromDiv ? fromDiv.querySelector('.bookingpagecents') : null;
      var currencySpan = fromDiv ? fromDiv.querySelector('.bookingpagecurrency') : null;
      var total = 0;
      var currency = '\u20AC';
      if (dollarsSpan && centsSpan) {
        total = parseInt(dollarsSpan.textContent, 10) + parseInt(centsSpan.textContent.replace('.', ''), 10) / 100;
        currency = currencySpan ? currencySpan.textContent : '\u20AC';
      }

      /* tnh-total-price and tnh-book-btn are independent flex siblings —
         no wrapper div. tnh-book-btn has margin-left:auto (CSS) so it always
         sits at the right edge of the offer row regardless of whether the
         price is shown or hidden, and regardless of the price's text width. */
      var totalEl = document.createElement('span');
      totalEl.className = 'tnh-total-price';
      totalEl.style.display = 'none';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tnh-book-btn';
      btn.textContent = 'Book';
      btn.style.cssText = ''
        + 'display:inline-block;padding:8px 24px;'
        + 'font-family:inherit;font-size:14px;font-weight:600;'
        + 'color:#fff;background:#E7A35C;border:none;border-radius:6px;'
        + 'cursor:pointer;transition:background .2s;';

      btn.addEventListener('mouseenter', function() { btn.style.background = '#d4923e'; });
      btn.addEventListener('mouseleave', function() { btn.style.background = '#E7A35C'; });

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (qtySelect) {
          if (qtySelect.value === '0' || qtySelect.value === '') {
            qtySelect.value = '1';
            qtySelect.dispatchEvent(new Event('change', {bubbles: true}));
          }
        }
        if (guestSelect) {
          var val = guestSelect.value;
          if (!val || val === '0') val = '1';
          guestSelect.value = val;
          guestSelect.dispatchEvent(new Event('change', {bubbles: true}));
        }
        var form = document.getElementById('formlook');
        if (form) {
          if (!form.querySelector('input[name="bookmult"]')) {
            var bm = document.createElement('input');
            bm.type = 'hidden';
            bm.name = 'bookmult';
            bm.value = '';
            form.appendChild(bm);
          }
          form.submit();
        }
      });

      var offerRow = priceBox.querySelector('.tnh-offer-row');
      if (!offerRow) {
        offerRow = document.createElement('div');
        offerRow.className = 'tnh-offer-row';
        var formInline = priceBox.querySelector('.form-inline');
        if (formInline) {
          priceBox.insertBefore(offerRow, formInline);
          offerRow.appendChild(formInline);
        }
      }
      offerRow.appendChild(totalEl);
      offerRow.appendChild(btn);
    }

    var offers = document.querySelectorAll('.offer');
    offers.forEach(function(offer) {
      var warnDiv = offer.querySelector('[class*="offerwarndiv"]');
      if (warnDiv && !warnDiv.classList.contains('hidden')) return;

      /* Dorm: has hidden sr1- inputs but no visible sr1- select */
      var dormInputs = offer.querySelectorAll('input[type="hidden"][name^="sr1-"]');
      var isDorm = dormInputs.length > 0 && !offer.querySelector('select[id^="sr1-"]');

      if (isDorm) {
        /* One Book button per dorm unit (priceBox).
           naa select may be in orphan box, not priceBox — search whole offer. */
        dormInputs.forEach(function(hiddenInput) {
          var priceBox = hiddenInput.closest('.b24-multipricebox');
          if (!priceBox || priceBox.classList.contains('hidden')) return;
          var guestSelect = offer.querySelector('select[id^="naa"]');
          injectIntoBox(priceBox, null, hiddenInput, guestSelect);
        });
      } else {
        /* Regular room: one Book button for the offer */
        if (offer.querySelector('.tnh-book-btn')) return;
        var priceBox = offer.querySelector('.b24-multipricebox:not(.hidden)');
        if (!priceBox) return;
        var qtySelect = offer.querySelector('select[id^="sr1-"]');
        var guestSelect = offer.querySelector('select[id^="naa"]');
        injectIntoBox(priceBox, qtySelect, null, guestSelect);
      }
    });
  }

  /* ============================================
   * SECTION 5: Date strip overrides
   * ============================================ */
  var ds = document.createElement('style');
  ds.textContent = ''
    + '.datestay{background-color:#6DA17D!important;color:#fff!important}'
    + '.setsplitdates1 .datestay.prevdateavail,'
    + '.setsplitdates1 .datestay.prevdatenotavail,'
    + '.setsplitdates1 .datestay.prevdaterequest'
    + '{background:linear-gradient(-45deg,#6DA17D,#6DA17D 50%,#F7FAFC 50%)!important}'
    + '.setsplitdates1 .dateavail.prevdatestay:not(.datestay)'
    + '{background:linear-gradient(-45deg,#F7FAFC,#F7FAFC 50%,#6DA17D 50%)!important}'
    + '.setsplitdates1 .datenotavail.prevdatestay:not(.datestay)'
    + '{background:linear-gradient(-45deg,rgba(200,60,60,.12),rgba(200,60,60,.12) 50%,#6DA17D 50%)!important}'
    + '.datenotavail{background-color:rgba(200,60,60,.10)!important;color:#a04040!important;text-decoration:line-through;opacity:.8}'
    + '.dateavail:hover{background-color:rgba(109,161,125,.15)!important}'
    + '.roomofferpricetable .at_pricetd{pointer-events:none!important;cursor:default!important}'
    + '.roomofferpricetable tr.b24-bookingstrip{display:none!important}';
  document.head.appendChild(ds);

  /* ============================================
   * SECTION 6: Price UX enhancement
   * Per-night display with lighter styling.
   * Total price now shown in .tnh-book-group (Section 4).
   * After qty selection: updates total in .tnh-total-price.
   * ============================================ */
  function enhancePrices() {
    if (!getIsRoomSearch()) return;
    try {
      /* Read nights from iframe URL params (reliable) — falls back to DOM element */
      var nights = parseInt(new URLSearchParams(location.search).get('numnight'), 10);
      if (!nights || nights < 1) {
        var nightsEl = document.querySelector('#inputnumnight');
        if (nightsEl) nights = parseInt(nightsEl.value, 10);
      }
      if (!nights || nights < 1) return;

      var fromDivs = document.querySelectorAll('[id^="from-1-"]');
      fromDivs.forEach(function(fromDiv) {
        /* Always re-read from native spans — handles qty/naa changes updating the price */
        var dollarsSpan = fromDiv.querySelector('.bookingpagedollars');
        var centsSpan = fromDiv.querySelector('.bookingpagecents');
        if (!dollarsSpan || !centsSpan) return;

        var dollars = parseInt(dollarsSpan.textContent, 10);
        var centsText = centsSpan.textContent.replace('.', '');
        var centsNum = parseInt(centsText, 10) || 0;
        var total = dollars + (centsNum / 100);
        if (isNaN(total) || total <= 0) return;

        var currencySpan = fromDiv.querySelector('.bookingpagecurrency');
        var currency = currencySpan ? currencySpan.textContent : '\u20AC';

        /* Hide native spans — keep in DOM so Beds24 can still update them */
        dollarsSpan.style.display = 'none';
        centsSpan.style.display = 'none';
        if (currencySpan) currencySpan.style.display = 'none';

        /* Blank the raw "from " text node Beds24 writes as direct DOM text.
           Our tnh-price-pernight-main already starts with "from", so without
           this step both appear: "from €31.00 / nightfrom". */
        Array.prototype.forEach.call(fromDiv.childNodes, function(node) {
          if (node.nodeType === 3 && node.data.trim()) node.data = '';
        });

        /* Update or create per-night span */
        var perNight = nights > 1 ? (total / nights) : total;
        var perNightSpan = fromDiv.querySelector('.tnh-price-pernight-main');
        if (!perNightSpan) {
          perNightSpan = document.createElement('span');
          perNightSpan.className = 'tnh-price-pernight-main';
          fromDiv.insertBefore(perNightSpan, fromDiv.firstChild);
        }
        perNightSpan.textContent = 'from ' + currency + perNight.toFixed(2) + ' / night';

        /* Keep fromDiv visible — Beds24 adds .hidden on qty selection */
        fromDiv.style.setProperty('display', 'block', 'important');
        fromDiv.classList.remove('hidden');

        /* Show total price when a qty or bed count is selected */
        var offer = fromDiv.closest('.offer');
        var totalEl = offer ? offer.querySelector('.tnh-total-price') : null;
        if (totalEl) {
          var qtySelect = offer.querySelector('select[id^="sr1-"]');
          var naaSelect = offer.querySelector('select[id^="naa"]');
          var qty = 0;
          if (qtySelect) qty = parseInt(qtySelect.value, 10) || 0;
          if (!qty && naaSelect) qty = parseInt(naaSelect.value, 10) || 0;
          if (qty > 0) {
            totalEl.textContent = currency + total.toFixed(2);
            totalEl.style.display = '';
          } else {
            totalEl.style.display = 'none';
            totalEl.textContent = '';
          }
        }
      });
    } catch(e) {}
  }

  /* ============================================
   * SECTION 7: Room card enhancement
   * - Style description text with .tnh-desc-text
   * - Inject desktop tags (inside .b24-room-desc)
   * - Inject mobile tags (direct child of .b24panel)
   * - Change qty placeholder to "-"
   * ============================================ */
  var ROOM_TAGS = {};
  config.rooms.forEach(function(room) {
    ROOM_TAGS[String(room.id)] = room.tags;
  });

  function buildTagsDiv(tags, className) {
    var container = document.createElement('div');
    container.className = className;
    tags.forEach(function(tag) {
      var badge = document.createElement('span');
      badge.className = 'tnh-tag';
      badge.textContent = tag.icon + ' ' + tag.text;
      container.appendChild(badge);
    });
    return container;
  }

  function enhanceRoomCards() {
    if (!getIsRoomSearch()) return;
    var rooms = document.querySelectorAll('.b24room');
    rooms.forEach(function(room) {
      if (room.querySelector('.tnh-room-tags')) return; /* Already processed */

      var roomId = (room.id || '').replace('roomid', '');
      var tags = ROOM_TAGS[roomId];
      if (!tags) return;

      /* Style description text (don't hide it) */
      var descCollapse = room.querySelector('[id^="collapsedesc"]');
      if (descCollapse) {
        var descText = descCollapse.querySelector('div:not(.fakelink)');
        if (descText) {
          descText.className = 'tnh-desc-text';
        }
      }

      /* Desktop tags: inside .b24-room-desc (flex space-between pushes to bottom) */
      var descModule = room.querySelector('.b24-room-desc');
      if (descModule) {
        descModule.appendChild(buildTagsDiv(tags, 'tnh-room-tags'));
      }

      /* Mobile tags: direct child of .b24panel, inserted before .offer */
      var panelBody = room.querySelector('.panel-body.b24panel');
      var offer = panelBody ? panelBody.querySelector('.offer') : null;
      if (panelBody && offer) {
        panelBody.insertBefore(buildTagsDiv(tags, 'tnh-room-tags-mobile'), offer);
      }
    });

    /* Change qty dropdown: placeholder → "-", numbers → "1 room", "2 rooms" etc.
       Also inject a "Select" label immediately before each qty dropdown. */
    var qtySelects = document.querySelectorAll('select[id^="sr1-"]');
    qtySelects.forEach(function(sel) {
      for (var i = 0; i < sel.options.length; i++) {
        var opt = sel.options[i];
        if (i === 0 && (opt.text === 'Quantity' || opt.value === '0')) {
          opt.text = '-';
        } else {
          var n = parseInt(opt.value, 10);
          if (!isNaN(n) && n > 0) {
            opt.text = n === 1 ? '1 room' : n + ' rooms';
          }
        }
      }
      /* Inject "Select" label to the left of the dropdown (once only) */
      if (!sel.parentNode.querySelector('.tnh-select-label')) {
        var lbl = document.createElement('span');
        lbl.className = 'tnh-select-label';
        lbl.style.cssText = 'font-size:13px;font-weight:500;color:#5a6f5a;white-space:nowrap;flex-shrink:0;display:inline-flex;align-items:center;';
        lbl.textContent = 'Select';
        sel.parentNode.insertBefore(lbl, sel);
      }
    });
  }

  /* ============================================
   * SECTION 8: Room ordering
   * Reads prices from DOM, sorts cheapest first,
   * pushes unavailable rooms to bottom.
   * Uses CSS order on .b24room (requires flex parent).
   * ============================================ */
  function sortRooms() {
    if (!getIsRoomSearch()) return;

    var rooms = document.querySelectorAll('.b24room');
    if (rooms.length < 2) return;

    /* All rooms may share the same parent (Beds24 AJAX loads into one wrapper) */
    var parent = rooms[0].parentElement;
    if (!parent) return;

    /* Only sort once per page load — mark parent when done */
    if (parent.dataset.tnhSorted === 'true') return;

    var sortable = [];
    rooms.forEach(function(room) {
      var offer = room.querySelector('.offer');
      var price = 999999;

      if (offer) {
        var fromDiv = offer.querySelector('[id^="from-"]');
        if (fromDiv) {
          if (fromDiv.dataset.tnhTotal) {
            price = parseFloat(fromDiv.dataset.tnhTotal) || 999999;
          } else {
            var dollars = fromDiv.querySelector('.bookingpagedollars');
            var cents = fromDiv.querySelector('.bookingpagecents');
            if (dollars && cents) {
              var d = parseInt(dollars.textContent, 10);
              var c = parseInt(cents.textContent.replace('.', ''), 10) || 0;
              if (!isNaN(d)) price = d + (c / 100);
            }
          }
        }
      }

      var unavailable = false;
      if (offer) {
        var warnDiv = offer.querySelector('[class*="offerwarndiv"]');
        if (warnDiv && !warnDiv.classList.contains('hidden')) unavailable = true;
      }

      sortable.push({ el: room, price: price, unavailable: unavailable });
    });

    /* Only sort if we got valid prices (not all 999999) */
    var validPrices = sortable.filter(function(s) { return s.price < 999999; });
    if (validPrices.length === 0) return;

    /* Sort: available by price asc, then unavailable by price asc */
    sortable.sort(function(a, b) {
      if (a.unavailable !== b.unavailable) return a.unavailable ? 1 : -1;
      return a.price - b.price;
    });

    /* DOM reorder — appendChild moves elements, doesn't clone */
    sortable.forEach(function(item) {
      parent.appendChild(item.el);
    });

    parent.dataset.tnhSorted = 'true';
  }

  /* ============================================
   * INIT
   * ============================================ */
  var isModifying = false;

  function applyFixes() {
    if (isModifying) return;
    isModifying = true;
    try {
      fixDormRooms();
      injectBookButtons();
      enhancePrices();
      enhanceRoomCards();
      sortRooms();
      if (isWidget && isEmbedded) send();
    } catch(e) {}
    setTimeout(function() { isModifying = false; }, 500);
  }

  function init() {
    applyFixes();

    function attachObserver() {
      if (!document.body) return;
      if (typeof MutationObserver !== 'undefined') {
        var t;
        new MutationObserver(function() {
          if (isModifying) return;
          clearTimeout(t);
          t = setTimeout(applyFixes, 300);
        }).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
      }
    }

    if (document.body) attachObserver();
    else document.addEventListener('DOMContentLoaded', attachObserver);

    if (isWidget && isEmbedded) {
      window.addEventListener('resize', send);
      document.addEventListener('load', function(e) {
        if (e.target.tagName === 'IMG') setTimeout(send, 100);
      }, true);
      var c = 0, iv = setInterval(function() {
        applyFixes();
        if (++c >= 30) clearInterval(iv);
      }, 1000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

function resolveConfig() {
  if (window.TNH_CONFIG && isValidConfig(window.TNH_CONFIG)) {
    return window.TNH_CONFIG;
  }
  // Future: fetch path for hosted-tier clients will be added here.
  return null;
}

function isValidConfig(c) {
  return c && c.schemaVersion === 1 && Array.isArray(c.rooms);
}
