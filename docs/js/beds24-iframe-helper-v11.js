/*
 * TNH Beds24 Iframe Helper v11
 * Load via customhead: <script src="https://astrongpresence.com/beds24-iframe-helper-v11.js"></script>
 *
 * When embedded via widget (referer=widget):
 * 1. Hide booking strip + chrome (our widget handles date/guest selection)
 * 2. Report page height to parent for iframe sizing
 * 3. Set form target="_top" so checkout breaks out of iframe
 * 4. Fix dorm room booking (unhide guest selector, relabel)
 * 5. Style per-room Book buttons prominently
 */
(function(){
  var isWidget = location.search.indexOf('referer=widget') >= 0;
  var isEmbedded = window.parent !== window;

  /* ============================================
   * SECTION 1: Hide chrome + height sync (widget only)
   * ============================================ */
  if (isWidget && isEmbedded) {

    /* Hide everything except rooms and bottom bar */
    var s = document.createElement('style');
    s.textContent = ''
      + '.b24fullcontainer-selector{display:none!important}'
      + '.b24fullcontainer-top{display:none!important}'
      + '.b24fullcontainer-ownerrow1{display:none!important}'
      + '.b24fullcontainer-footer{display:none!important}'
      + '.b24fullcontainer-proprow1{display:none!important}'
      + '.b24fullcontainer-proprow2{display:none!important}'
      + '.b24fullcontainer-ownerrow11{display:none!important}'
      + 'body{background:transparent!important;overflow:hidden!important;margin:0!important;padding:0!important}'
      + 'html{overflow:hidden!important}';
    document.head.appendChild(s);

    /* Height reporting — use the v6 approach that worked:
       measure scrollHeight, actively trim body to content bottom */
    function send() {
      var h = 200; /* minimum */

      var rooms = document.querySelector('.b24fullcontainer-rooms');
      var proprow11 = document.querySelector('.b24fullcontainer-proprow11');

      if (rooms && rooms.offsetHeight > 0) {
        h = rooms.offsetTop + rooms.offsetHeight;
      }
      if (proprow11 && proprow11.offsetHeight > 0) {
        var barBottom = proprow11.offsetTop + proprow11.offsetHeight;
        if (barBottom > h) h = barBottom;
      }

      /* If offset measurement failed (zero-viewport), fall back to scrollHeight */
      if (h <= 200) {
        h = document.documentElement.scrollHeight;
      }

      h += 40; /* bottom padding */
      h = Math.max(h, 200);

      /* Trim the page to this height */
      document.body.style.height = h + 'px';
      document.documentElement.style.height = h + 'px';

      try { window.parent.postMessage(JSON.stringify({type:'tnh-height', height:h}), '*'); } catch(e) {}
    }

    if (document.readyState === 'complete') send();
    else window.addEventListener('load', send);

    /* Attach MutationObserver after body exists */
    function attachObserver() {
      if (!document.body) return;
      if (typeof MutationObserver !== 'undefined') {
        var t;
        new MutationObserver(function() { clearTimeout(t); t = setTimeout(send, 200); })
          .observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
      }
    }
    if (document.body) attachObserver();
    else document.addEventListener('DOMContentLoaded', attachObserver);

    window.addEventListener('resize', send);
    document.addEventListener('load', function(e) {
      if (e.target.tagName === 'IMG') setTimeout(send, 100);
    }, true);

    /* Periodic reporter for 30s */
    var c = 0, iv = setInterval(function() { send(); if (++c >= 30) clearInterval(iv); }, 1000);
  }

  /* ============================================
   * SECTION 2: Break out of iframe on form submit
   * ============================================ */
  function setFormTarget() {
    if (!isEmbedded) return;
    var form = document.getElementById('formlook');
    if (form) {
      form.target = '_top';
    }
  }

  /* ============================================
   * SECTION 3: Dorm booking fix
   * Unhide the guest selector, position it right-aligned
   * to match other rooms' quantity dropdowns, relabel to "Beds"
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

      /* Style to match quantity dropdowns on other rooms */
      guestSelect.style.cssText = ''
        + 'display:inline-block!important;visibility:visible!important;'
        + 'width:auto;min-width:120px;padding:6px 10px;'
        + 'font-family:inherit;font-size:14px;'
        + 'border:1.5px solid #d4e0d4;border-radius:6px;'
        + 'background:#F7FAFC;color:#2D482D;cursor:pointer;';

      /* Unhide parent containers up to the offer section */
      var el = guestSelect.parentElement;
      while (el && el !== offer) {
        var cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') {
          el.style.setProperty('display', 'block', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
        }
        el = el.parentElement;
      }

      /* Right-align the price box to match other rooms */
      var priceBox = offer.querySelector('.b24-multipricebox');
      if (priceBox) {
        priceBox.style.cssText = 'text-align:right;float:right;';
      }

      /* Relabel options: "Guests" → "Beds" */
      for (var i = 0; i < guestSelect.options.length; i++) {
        var opt = guestSelect.options[i];
        opt.text = opt.text.replace(/Guests?/g, function(m) {
          return m === 'Guest' ? 'Bed' : 'Beds';
        });
      }

      /* Relabel the "Select" label if present */
      var selectLabel = offer.querySelector('.roomofferqtyselectlabel');
      if (selectLabel) {
        selectLabel.textContent = 'Beds:';
        selectLabel.style.setProperty('display', 'inline-block', 'important');
        selectLabel.style.setProperty('visibility', 'visible', 'important');
      }
    });
  }

  /* ============================================
   * SECTION 4: Inject per-room Book buttons
   * Beds24 multi-room mode does NOT create per-room Book buttons.
   * We inject one into each room card.
   * ============================================ */
  function injectBookButtons() {
    var offers = document.querySelectorAll('.offer');
    offers.forEach(function(offer) {
      if (offer.querySelector('.tnh-book-btn')) return; /* already injected */

      var priceBox = offer.querySelector('.b24-multipricebox');
      if (!priceBox) return;

      /* Determine if this is a dorm (hidden input) or private room (select) */
      var qtySelect = offer.querySelector('select[id^="sr1-"]');
      var hiddenInput = offer.querySelector('input[type="hidden"][name^="sr1-"]');
      var guestSelect = offer.querySelector('select[id^="naa"]');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tnh-book-btn';
      btn.textContent = 'Book';
      btn.style.cssText = ''
        + 'display:block;width:100%;margin-top:12px;padding:11px 20px;'
        + 'font-family:inherit;font-size:15px;font-weight:600;'
        + 'color:#fff;background:#6DA17D;border:none;border-radius:6px;'
        + 'cursor:pointer;transition:background .2s,opacity .2s;';

      btn.addEventListener('mouseenter', function() { btn.style.background = '#5b8d6a'; });
      btn.addEventListener('mouseleave', function() { btn.style.background = '#6DA17D'; });

      btn.addEventListener('click', function(e) {
        e.preventDefault();

        if (qtySelect) {
          /* Private room: set quantity to 1 if not already selected */
          if (qtySelect.value === '0' || qtySelect.value === '') {
            qtySelect.value = '1';
            qtySelect.dispatchEvent(new Event('change', {bubbles: true}));
          }
        }

        if (hiddenInput && guestSelect) {
          /* Dorm room: set guest count to 1 */
          if (guestSelect.value === '0' || guestSelect.value === '') {
            guestSelect.value = '1';
            guestSelect.dispatchEvent(new Event('change', {bubbles: true}));
          }
        }

        /* Submit the form */
        var form = document.getElementById('formlook');
        if (form) form.submit();
      });

      priceBox.appendChild(btn);
    });
  }

  /* ============================================
   * SECTION 5: Styles
   * ============================================ */
  function addStyles() {
    var css = document.createElement('style');
    css.textContent = ''
      /* Bottom summary bar — clean styling */
      + '.b24fullcontainer-proprow11{'
      +   'background:#fff!important;'
      +   'border-top:1px solid #d4e0d4!important;'
      +   'box-shadow:0 -2px 8px rgba(0,0,0,.08)!important;'
      +   'padding:10px 16px!important;'
      + '}';
    document.head.appendChild(css);
  }

  /* ============================================
   * INIT
   * ============================================ */
  function init() {
    setFormTarget();
    addStyles();
    fixDormRooms();
    injectBookButtons();

    /* Re-run fixes after AJAX loads rooms */
    if (typeof MutationObserver !== 'undefined') {
      var fixTimer;
      new MutationObserver(function() {
        clearTimeout(fixTimer);
        fixTimer = setTimeout(function() {
          setFormTarget();
          fixDormRooms();
          injectBookButtons();
        }, 300);
      }).observe(document.body, {childList: true, subtree: true});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
