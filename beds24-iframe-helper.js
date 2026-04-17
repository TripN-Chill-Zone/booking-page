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
   * ============================================ */
  function fixDormRooms() {
    if (!getIsRoomSearch()) return;
    var hiddenInputs = document.querySelectorAll('input[type="hidden"][name^="sr1-"]');
    hiddenInputs.forEach(function(input) {
      var offer = input.closest('.offer');
      if (!offer) return;
      if (offer.querySelector('.tnh-dorm-fixed')) return;

      var marker = document.createElement('span');
      marker.className = 'tnh-dorm-fixed';
      marker.style.display = 'none';
      offer.appendChild(marker);

      var guestSelect = offer.querySelector('select[id^="naa"]');
      if (!guestSelect) return;

      for (var i = 0; i < guestSelect.options.length; i++) {
        var opt = guestSelect.options[i];
        opt.text = opt.text.replace(/Guests?/g, function(m) {
          return m === 'Guest' ? 'Bed' : 'Beds';
        });
      }

      guestSelect.style.cssText = ''
        + 'display:inline-block!important;visibility:visible!important;'
        + 'width:auto;min-width:80px;padding:6px 10px;'
        + 'font-family:inherit;font-size:14px;'
        + 'border:1.5px solid #d4e0d4;border-radius:6px;'
        + 'background:#F7FAFC;color:#2D482D;cursor:pointer;'
        + 'margin-right:8px;';

      var allBoxes = offer.querySelectorAll('.b24-multipricebox');
      var mainBox = null;
      var orphanBox = null;
      allBoxes.forEach(function(box) {
        if (box.classList.contains('hidden')) return;
        if (box.querySelector('[id^="from-"]')) {
          mainBox = box;
        } else if (box.querySelector('select[id^="naa"]')) {
          orphanBox = box;
        }
      });

      if (mainBox) {
        var wrapper = document.createElement('span');
        wrapper.style.cssText = 'display:inline-flex;align-items:center;gap:4px;margin-right:8px;';
        var label = document.createElement('span');
        label.textContent = 'Beds:';
        label.style.cssText = 'font-size:13px;font-weight:500;color:#5a6f5a;';
        wrapper.appendChild(label);
        wrapper.appendChild(guestSelect);

        var fromPrice = mainBox.querySelector('[id^="from-"]');
        if (fromPrice) {
          mainBox.insertBefore(wrapper, fromPrice);
        } else {
          mainBox.insertBefore(wrapper, mainBox.firstChild);
        }
      }

      if (orphanBox) {
        orphanBox.style.setProperty('display', 'none', 'important');
      }
    });
  }

  /* ============================================
   * SECTION 4: Inject per-room Book buttons
   * Now wrapped in .tnh-book-group with total price
   * ============================================ */
  function injectBookButtons() {
    if (!getIsRoomSearch()) return;
    var offers = document.querySelectorAll('.offer');
    offers.forEach(function(offer) {
      if (offer.querySelector('.tnh-book-btn')) return;

      /* Skip unavailable rooms — Beds24 shows a warning and hides selectors */
      var warnDiv = offer.querySelector('[class*="offerwarndiv"]');
      if (warnDiv && !warnDiv.classList.contains('hidden')) return;

      var priceBox = offer.querySelector('.b24-multipricebox:not(.hidden)');
      if (!priceBox) return;

      var qtySelect = offer.querySelector('select[id^="sr1-"]');
      var hiddenInput = offer.querySelector('input[type="hidden"][name^="sr1-"]');
      var guestSelect = offer.querySelector('select[id^="naa"]');

      /* Parse total from the from-price spans */
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

      /* Create .tnh-book-group: [total] [Book] */
      var group = document.createElement('span');
      group.className = 'tnh-book-group';

      /* Total price — hidden until qty is selected */
      var totalEl = document.createElement('span');
      totalEl.className = 'tnh-total-price';
      totalEl.style.display = 'none';
      if (total > 0) {
        totalEl.dataset.tnhTotal = total.toFixed(2);
        totalEl.dataset.tnhCurrency = currency;
      }
      group.appendChild(totalEl);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tnh-book-btn';
      btn.textContent = 'Book';
      btn.style.cssText = ''
        + 'display:inline-block;padding:8px 24px;'
        + 'font-family:inherit;font-size:14px;font-weight:600;'
        + 'color:#fff;background:#E7A35C;border:none;border-radius:6px;'
        + 'cursor:pointer;transition:background .2s;';

      btn.addEventListener('mouseenter', function() {
        btn.style.background = '#d4923e';
      });
      btn.addEventListener('mouseleave', function() {
        btn.style.background = '#E7A35C';
      });

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (qtySelect) {
          if (qtySelect.value === '0' || qtySelect.value === '') {
            qtySelect.value = '1';
            qtySelect.dispatchEvent(new Event('change', {bubbles: true}));
          }
        }
        if (hiddenInput && guestSelect) {
          if (guestSelect.value === '0' || guestSelect.value === '') {
            guestSelect.value = '1';
            guestSelect.dispatchEvent(new Event('change', {bubbles: true}));
          }
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

      group.appendChild(btn);

      /* Create .tnh-offer-row: wraps [form-inline] and [book-group] as a single flex row */
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
      offerRow.appendChild(group);
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
      var nightsEl = document.querySelector('#inputnumnight');
      if (!nightsEl) return;
      var nights = parseInt(nightsEl.value, 10);
      if (!nights || nights < 1) return;

      var fromDivs = document.querySelectorAll('[id^="from-1-"]');
      fromDivs.forEach(function(fromDiv) {
        if (!fromDiv.dataset.tnhTotal) {
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

          fromDiv.dataset.tnhTotal = total.toFixed(2);
          fromDiv.dataset.tnhCurrency = currency;
        }

        var total = parseFloat(fromDiv.dataset.tnhTotal);
        var currency = fromDiv.dataset.tnhCurrency;
        if (isNaN(total) || total <= 0) return;

        var hasHidden = fromDiv.classList.contains('hidden');
        var currentState = fromDiv.dataset.tnhState || '';
        var perNight = nights > 1 ? (total / nights) : total;

        /* Always keep the from-price visible with per-night display */
        if (currentState !== 'pernight') {
          fromDiv.dataset.tnhState = 'pernight';
          /* Override Beds24's .hidden class — from-price should always show */
          fromDiv.style.setProperty('display', 'block', 'important');
          fromDiv.classList.remove('hidden');

          if (nights > 1) {
            fromDiv.innerHTML = '';
            var mainSpan = document.createElement('span');
            mainSpan.className = 'tnh-price-pernight-main';
            mainSpan.textContent = 'from ' + currency + perNight.toFixed(2) + ' / night';
            fromDiv.appendChild(mainSpan);
          }
        }

        /* Show/hide total price based on qty selection */
        var offer = fromDiv.closest('.offer');
        var totalEl = offer ? offer.querySelector('.tnh-total-price') : null;
        if (totalEl) {
          if (hasHidden) {
            /* Qty is selected — Beds24 added .hidden to fromDiv, show total */
            /* Keep fromDiv visible (already handled above) but also show total */
            fromDiv.style.setProperty('display', 'block', 'important');
            var updatedTotal = total;
            var rawDollars = fromDiv.querySelector('.bookingpagedollars');
            var rawCents = fromDiv.querySelector('.bookingpagecents');
            if (rawDollars && rawCents) {
              var d = parseInt(rawDollars.textContent, 10);
              var c = parseInt(rawCents.textContent.replace('.', ''), 10) || 0;
              if (!isNaN(d)) updatedTotal = d + (c / 100);
            }
            totalEl.textContent = currency + updatedTotal.toFixed(2);
            totalEl.style.display = '';
          } else {
            /* No qty selected — hide total */
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
  var ROOM_TAGS = {
    '567218': [
      { icon: '\uD83D\uDECF', text: 'Sleeps 2' },
      { icon: '\uD83D\uDEBF', text: 'Ensuite' },
      { icon: '\uD83C\uDFD9', text: 'City View' },
      { icon: '\uD83D\uDCBC', text: 'Work Desk' },
      { icon: '\uD83D\uDC51', text: 'Premium' }
    ],
    '567220': [
      { icon: '\uD83D\uDECF', text: 'Sleeps 1' },
      { icon: '\uD83D\uDEBF', text: 'Shared Bathroom' },
      { icon: '\uD83D\uDCBC', text: 'Work Desk' },
      { icon: '\uD83D\uDD12', text: 'Private' }
    ],
    '567221': [
      { icon: '\uD83D\uDECF', text: 'Sleeps 2' },
      { icon: '\uD83D\uDEBF', text: 'Shared Bathroom' },
      { icon: '\uD83D\uDCBC', text: 'Work Desk' },
      { icon: '\uD83D\uDD12', text: 'Private' }
    ],
    '567219': [
      { icon: '\uD83D\uDECF', text: '1 Bed' },
      { icon: '\uD83D\uDC65', text: '4-Bed Dorm' },
      { icon: '\uD83D\uDD0C', text: 'Power Outlet' },
      { icon: '\uD83D\uDCA1', text: 'Reading Light' }
    ]
  };

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

    /* Change qty dropdown placeholder from "Quantity" to "-" */
    var qtySelects = document.querySelectorAll('select[id^="sr1-"]');
    qtySelects.forEach(function(sel) {
      if (sel.options[0] && (sel.options[0].text === 'Quantity' || sel.options[0].value === '0')) {
        sel.options[0].text = '-';
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
