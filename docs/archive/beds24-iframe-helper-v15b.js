/*
 * TNH Beds24 Iframe Helper v15
 * Load via customhead: <script src="https://astrongpresence.com/beds24-iframe-helper-v15.js"></script>
 *
 * Complete rewrite incorporating all changes through Session 8:
 * - Lazy page detection (script loads in <head> before DOM)
 * - Checkout stays in iframe (no form.target breakout)
 * - Checkout/confirmation: hide chrome, report height, notify widget
 * - Dorm booking fix
 * - Per-room Book buttons with bookmult param
 * - Date strip color overrides (for direct page visits)
 * - Price UX: per-night display, total after qty selection
 * - NEW: Room tag injection (icon badges replacing description)
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
      + 'body{background:transparent!important;margin:0!important;padding:0!important}';
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
   * ============================================ */
  function injectBookButtons() {
    if (!getIsRoomSearch()) return;
    var offers = document.querySelectorAll('.offer');
    offers.forEach(function(offer) {
      if (offer.querySelector('.tnh-book-btn')) return;

      var priceBox = offer.querySelector('.b24-multipricebox');
      if (!priceBox) return;

      var qtySelect = offer.querySelector('select[id^="sr1-"]');
      var hiddenInput = offer.querySelector('input[type="hidden"][name^="sr1-"]');
      var guestSelect = offer.querySelector('select[id^="naa"]');

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

      priceBox.appendChild(btn);
    });
  }

  /* ============================================
   * SECTION 5: Date strip overrides
   * (kept for direct page visits; CSS v4 hides
   * date strip entirely in compact card view)
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

        if (hasHidden && currentState !== 'total') {
          fromDiv.dataset.tnhState = 'total';
          fromDiv.style.setProperty('display', 'block', 'important');
          fromDiv.innerHTML = '';

          var totalSpan = document.createElement('span');
          totalSpan.className = 'tnh-price-total';
          totalSpan.style.cssText = 'font-size:15px;font-weight:600;color:#2D482D;';
          totalSpan.textContent = currency + total.toFixed(2) + ' total';
          fromDiv.appendChild(totalSpan);

          if (nights > 1) {
            var nightSpan = document.createElement('span');
            nightSpan.className = 'tnh-price-pernight-note';
            nightSpan.style.cssText = 'font-size:12px;color:#5a6f5a;margin-left:6px;';
            nightSpan.textContent = '(' + currency + perNight.toFixed(2) + ' / night)';
            fromDiv.appendChild(nightSpan);
          }

        } else if (!hasHidden && currentState !== 'pernight') {
          fromDiv.dataset.tnhState = 'pernight';
          fromDiv.style.removeProperty('display');

          if (nights > 1) {
            fromDiv.innerHTML = '';

            var mainSpan = document.createElement('span');
            mainSpan.className = 'tnh-price-pernight-main';
            mainSpan.style.cssText = 'font-size:14px;font-weight:600;color:#2D482D;';
            mainSpan.textContent = 'from ' + currency + perNight.toFixed(2) + ' / night';
            fromDiv.appendChild(mainSpan);

            var totalNote = document.createElement('span');
            totalNote.className = 'tnh-price-total-note';
            totalNote.style.cssText = 'font-size:11px;color:#5a6f5a;display:block;margin-top:1px;';
            totalNote.textContent = currency + total.toFixed(2) + ' for ' + nights + ' nights';
            fromDiv.appendChild(totalNote);
          }
        }
      });
    } catch(e) {}
  }

  /* ============================================
   * SECTION 7: Room tag injection
   * Replaces the description text with compact
   * icon tags per room (Hostelworld style).
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

  function injectRoomTags() {
    if (!getIsRoomSearch()) return;
    var rooms = document.querySelectorAll('.b24room');
    rooms.forEach(function(room) {
      if (room.querySelector('.tnh-room-tags')) return;

      /* Extract room ID from the element id (e.g., "roomid567218") */
      var roomId = (room.id || '').replace('roomid', '');
      var tags = ROOM_TAGS[roomId];
      if (!tags) return;

      /* Find the description collapse wrapper and hide original text */
      var descCollapse = room.querySelector('[id^="collapsedesc"]');
      if (descCollapse) {
        var descText = descCollapse.querySelector('div:not(.fakelink)');
        if (descText) descText.style.display = 'none';
      }

      /* Build tag container */
      var tagContainer = document.createElement('div');
      tagContainer.className = 'tnh-room-tags';
      tagContainer.style.cssText = ''
        + 'display:flex;flex-wrap:wrap;gap:6px;'
        + 'margin:4px 0 6px;';

      tags.forEach(function(tag) {
        var badge = document.createElement('span');
        badge.className = 'tnh-tag';
        badge.style.cssText = ''
          + 'display:inline-flex;align-items:center;gap:3px;'
          + 'font-size:12px;font-weight:500;color:#2D482D;'
          + 'background:#f0f5f0;border:1px solid #d4e0d4;'
          + 'border-radius:4px;padding:2px 8px;'
          + 'white-space:nowrap;line-height:1.4;';
        badge.textContent = tag.icon + ' ' + tag.text;
        tagContainer.appendChild(badge);
      });

      /* Insert tags into the description area */
      var descModule = room.querySelector('.b24-room-desc');
      if (descModule) {
        descModule.appendChild(tagContainer);
      } else {
        /* Fallback: insert into the panel body */
        var panel = room.querySelector('.b24panel-room > .b24panel');
        if (panel) panel.appendChild(tagContainer);
      }
    });
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
      injectRoomTags();
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
