/*
 * TNH Beds24 Iframe Helper v14
 * Load via customhead: <script src="https://astrongpresence.com/beds24-iframe-helper-v14.js"></script>
 *
 * Changes from v13:
 * - Hide #b24bookshoppingcart (bottom summary/Book bar below rooms)
 * - Fix dorm dropdown: use flexbox for proper right-alignment matching other rooms
 * - Improve height reporting: use .b24fullcontainer-rooms bottom edge, not full scrollHeight
 */
(function(){
  var isWidget = location.search.indexOf('referer=widget') >= 0;
  var isEmbedded = window.parent !== window;

  /* ============================================
   * SECTION 1: Hide chrome + height sync (widget only)
   * ============================================ */
  if (isWidget && isEmbedded) {
    var s = document.createElement('style');
    s.textContent = '' +
      '.b24fullcontainer-selector{display:none!important}' +
      '.b24fullcontainer-top{display:none!important}' +
      '.b24fullcontainer-ownerrow1{display:none!important}' +
      '.b24fullcontainer-footer{display:none!important}' +
      '.b24fullcontainer-proprow1{display:none!important}' +
      '.b24fullcontainer-proprow2{display:none!important}' +
      '.b24fullcontainer-proprow11{display:none!important}' +
      '.b24fullcontainer-ownerrow11{display:none!important}' +
      '#b24bookshoppingcart{display:none!important}' +
      'body{background:transparent!important;margin:0!important;padding:0!important}';
    document.head.appendChild(s);

    /*
     * Height: find the last visible .b24fullcontainer-rooms and measure
     * its bottom edge. This avoids counting hidden containers and excess
     * body padding below the rooms.
     * Fallback to scrollHeight if rooms container isn't found yet.
     */
    function send() {
      var h;
      var rooms = document.querySelector('.b24fullcontainer-rooms');
      if (rooms) {
        var rect = rooms.getBoundingClientRect();
        h = Math.ceil(rect.bottom + window.scrollY);
      } else {
        h = document.documentElement.scrollHeight;
      }
      h = Math.max(h, 200);
      try {
        window.parent.postMessage(JSON.stringify({type:'tnh-height', height:h}), '*');
      } catch(e) {}
    }

    if (document.readyState === 'complete') send();
    else window.addEventListener('load', send);
  }

  /* ============================================
   * SECTION 2: Break out of iframe on form submit
   * ============================================ */
  function setFormTarget() {
    if (!isEmbedded) return;
    var form = document.getElementById('formlook');
    if (form) form.target = '_top';
  }

  /* ============================================
   * SECTION 3: Dorm booking fix
   * Move the guest selector into the main price box so it sits
   * inline with the "from €XX" price and Book button, matching
   * private room layout. Hide the second (orphan) price box.
   * ============================================ */
  function fixDormRooms() {
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

      /* Relabel "Guests" -> "Beds" */
      for (var i = 0; i < guestSelect.options.length; i++) {
        var opt = guestSelect.options[i];
        opt.text = opt.text.replace(/Guests?/g, function(m) {
          return m === 'Guest' ? 'Bed' : 'Beds';
        });
      }

      /* Style the select to match other rooms' qty dropdowns */
      guestSelect.style.cssText = '' +
        'display:inline-block!important;visibility:visible!important;' +
        'width:auto;min-width:80px;padding:6px 10px;' +
        'font-family:inherit;font-size:14px;' +
        'border:1.5px solid #d4e0d4;border-radius:6px;' +
        'background:#F7FAFC;color:#2D482D;cursor:pointer;' +
        'margin-right:8px;';

      /* Find the main price box (the one with the "from" price) */
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
        /* Build a label + select wrapper */
        var wrapper = document.createElement('span');
        wrapper.style.cssText = 'display:inline-flex;align-items:center;gap:4px;margin-right:8px;';

        var label = document.createElement('span');
        label.textContent = 'Beds:';
        label.style.cssText = 'font-size:13px;font-weight:500;color:#5a6f5a;';

        wrapper.appendChild(label);
        wrapper.appendChild(guestSelect);

        /* Insert before the "from" price in the main box */
        var fromPrice = mainBox.querySelector('[id^="from-"]');
        if (fromPrice) {
          mainBox.insertBefore(wrapper, fromPrice);
        } else {
          mainBox.insertBefore(wrapper, mainBox.firstChild);
        }
      }

      /* Hide the orphan price box (now empty) */
      if (orphanBox) {
        orphanBox.style.setProperty('display', 'none', 'important');
      }
    });
  }

  /* ============================================
   * SECTION 4: Inject per-room Book buttons
   * Inline with quantity and price (not full-width below)
   * ============================================ */
  function injectBookButtons() {
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
      btn.style.cssText = '' +
        'display:inline-block;padding:8px 24px;margin-top:10px;' +
        'font-family:inherit;font-size:14px;font-weight:600;' +
        'color:#fff;background:#E7A35C;border:none;border-radius:6px;' +
        'cursor:pointer;transition:background .2s;' +
        'float:right;';

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
        if (hiddenInput && guestSelect) {
          if (guestSelect.value === '0' || guestSelect.value === '') {
            guestSelect.value = '1';
            guestSelect.dispatchEvent(new Event('change', {bubbles: true}));
          }
        }
        var form = document.getElementById('formlook');
        if (form) form.submit();
      });

      priceBox.appendChild(btn);
    });
  }

  /* ============================================
   * INIT - single observer with guard
   * ============================================ */
  var isModifying = false;
  function applyFixes() {
    if (isModifying) return;
    isModifying = true;
    try {
      setFormTarget();
      fixDormRooms();
      injectBookButtons();
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
