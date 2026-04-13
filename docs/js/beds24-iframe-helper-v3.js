/*
 * TNH Beds24 Iframe Helper v3
 * Load via customhead: <script src="https://astrongpresence.com/beds24-iframe-helper-v3.js"></script>
 *
 * Three jobs:
 * 1. When embedded via widget (referer=widget): hide chrome, report height
 * 2. Dorm booking fix: inject visible Book button for dorm rooms (hidden input)
 * 3. Sticky bottom booking bar
 */
(function(){
  var isWidget = location.search.indexOf('referer=widget') >= 0;
  var isEmbedded = window.parent !== window;

  /* ============================================
   * SECTION 1: Widget-only — hide chrome + height sync
   * ============================================ */
  if (isWidget && isEmbedded) {
    var s = document.createElement('style');
    s.textContent = ''
      + '.b24fullcontainer-selector{display:none!important}'
      + '.b24fullcontainer-top{display:none!important}'
      + '.b24fullcontainer-ownerrow1{display:none!important}'
      + '.b24fullcontainer-footer{display:none!important}'
      + '.b24fullcontainer-proprow1{display:none!important}'
      + '.b24fullcontainer-proprow2{display:none!important}'
      + 'body{background:transparent!important;overflow-x:hidden}';
    document.head.appendChild(s);

    function send() {
      /* Measure only the visible content, not the full page with hidden elements.
         The rooms container is the last meaningful visible element. */
      var h = 0;
      var rooms = document.querySelector('.b24fullcontainer-rooms');
      if (rooms) {
        /* Get bottom edge of rooms container relative to page top */
        var rect = rooms.getBoundingClientRect();
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        h = rect.bottom + scrollTop + 60; /* 60px padding */
      } else {
        /* Fallback before rooms load */
        h = document.documentElement.scrollHeight;
      }
      try { window.parent.postMessage(JSON.stringify({type:'tnh-height', height:h}), '*'); } catch(e) {}
    }

    if (document.readyState === 'complete') send();
    else window.addEventListener('load', send);

    if (typeof MutationObserver !== 'undefined') {
      var t;
      new MutationObserver(function() { clearTimeout(t); t = setTimeout(send, 150); })
        .observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
    }

    window.addEventListener('resize', send);
    document.addEventListener('load', function(e) { if (e.target.tagName === 'IMG') setTimeout(send, 100); }, true);

    var c = 0, iv = setInterval(function() { send(); if (++c >= 10) clearInterval(iv); }, 2000);
  }

  /* ============================================
   * SECTION 2: Dorm booking fix (runs always)
   * Detects rooms with hidden sr1 input and injects a visible Book button
   * ============================================ */
  function fixDormRooms() {
    /* Find all hidden quantity inputs — these are dorm rooms */
    var hiddenInputs = document.querySelectorAll('input[type="hidden"][name^="sr1-"]');
    hiddenInputs.forEach(function(input) {
      var roomId = input.name.replace('sr1-', '');
      var offer = input.closest('.offer');
      if (!offer) return;

      /* Don't inject twice */
      if (offer.querySelector('.tnh-dorm-book-btn')) return;

      /* Find the price box area */
      var priceBox = offer.querySelector('.b24-multipricebox');
      if (!priceBox) return;

      /* Create a visible Book button for the dorm */
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tnh-dorm-book-btn';
      btn.textContent = 'Book Bed';
      btn.style.cssText = ''
        + 'display:block;width:100%;margin-top:10px;padding:10px 20px;'
        + 'font-family:inherit;font-size:14px;font-weight:600;'
        + 'color:#fff;background:#6DA17D;border:none;border-radius:6px;'
        + 'cursor:pointer;transition:background .2s;';

      btn.addEventListener('mouseenter', function() { btn.style.background = '#5b8d6a'; });
      btn.addEventListener('mouseleave', function() { btn.style.background = '#6DA17D'; });

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        /* Set guest count to 1 */
        var guestSelect = offer.querySelector('select[id^="naa"]');
        if (guestSelect) {
          guestSelect.value = '1';
          /* Trigger change event so Beds24 registers it */
          var evt = new Event('change', {bubbles: true});
          guestSelect.dispatchEvent(evt);
        }
        /* Submit the form */
        var form = document.getElementById('formlook');
        if (form) form.submit();
      });

      priceBox.appendChild(btn);
    });
  }

  /* ============================================
   * SECTION 3: Sticky bottom booking bar (runs always)
   * Makes the multi-room book button bar stick to viewport bottom
   * ============================================ */
  function addStickyBarStyles() {
    var stickyCSS = document.createElement('style');
    stickyCSS.textContent = ''
      /* Make per-room Book buttons more prominent */
      + '.multiplebookbutton .at_bookingbut{'
      +   'display:block!important;width:100%;margin-top:8px;padding:10px 16px;'
      +   'font-weight:600;font-size:14px;border-radius:6px;'
      + '}'
      + '.multiplebookbutton{'
      +   'margin-top:8px;'
      + '}'
      /* Bottom booking summary bar — sticky at bottom of visible area */
      + '.b24fullcontainer-proprow11{'
      +   'position:sticky!important;bottom:0!important;z-index:100!important;'
      +   'background:#fff!important;border-top:1px solid #d4e0d4!important;'
      +   'box-shadow:0 -2px 8px rgba(0,0,0,.08)!important;'
      +   'padding:10px 16px!important;display:block!important;'
      + '}';
    document.head.appendChild(stickyCSS);
  }

  /* ============================================
   * INIT: Wait for DOM ready, then apply fixes
   * ============================================ */
  function init() {
    addStickyBarStyles();
    fixDormRooms();

    /* Re-check for dorm rooms after AJAX loads rooms */
    if (typeof MutationObserver !== 'undefined') {
      var dormTimer;
      new MutationObserver(function() {
        clearTimeout(dormTimer);
        dormTimer = setTimeout(fixDormRooms, 300);
      }).observe(document.body, {childList: true, subtree: true});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
