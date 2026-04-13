/*
 * TNH Beds24 Iframe Helper v6
 * Load via customhead: <script src="https://astrongpresence.com/beds24-iframe-helper-v6.js"></script>
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
      + '.b24fullcontainer-ownerrow11{display:none!important}'
      + 'body{background:transparent!important;overflow:hidden!important;margin:0!important;padding:0!important}'
      + 'html{overflow:hidden!important}';
    document.head.appendChild(s);

    function send() {
      /* Find the true content bottom by measuring visible containers */
      var h = 0;

      /* The rooms container is the main content */
      var rooms = document.querySelector('.b24fullcontainer-rooms');
      if (rooms) {
        /* Walk through room cards to find the last one with actual height */
        var roomCards = rooms.querySelectorAll('[id^="ajaxroomoffer"]');
        var lastBottom = 0;
        roomCards.forEach(function(card) {
          if (card.offsetHeight > 0) {
            var bottom = card.offsetTop + card.offsetHeight;
            if (bottom > lastBottom) lastBottom = bottom;
          }
        });
        if (lastBottom > 0) {
          /* Add rooms container's own offset */
          h = rooms.offsetTop + lastBottom + 40;
        }
      }

      /* Check proprow11 (booking summary bar) */
      var proprow = document.querySelector('.b24fullcontainer-proprow11');
      if (proprow && proprow.offsetHeight > 0 && proprow.offsetParent !== null) {
        var propBottom = proprow.offsetTop + proprow.offsetHeight + 20;
        if (propBottom > h) h = propBottom;
      }

      /* If we got a real measurement, actively trim the page */
      if (h > 100) {
        document.body.style.height = h + 'px';
        document.documentElement.style.height = h + 'px';
      } else {
        /* Fallback — content not loaded yet, use scrollHeight capped */
        h = Math.min(document.documentElement.scrollHeight, 3000);
      }

      h = Math.max(h, 200);
      try { window.parent.postMessage(JSON.stringify({type:'tnh-height', height:h}), '*'); } catch(e) {}
    }

    if (document.readyState === 'complete') send();
    else window.addEventListener('load', send);

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
    document.addEventListener('load', function(e) { if (e.target.tagName === 'IMG') setTimeout(send, 100); }, true);

    var c = 0, iv = setInterval(function() { send(); if (++c >= 30) clearInterval(iv); }, 1000);
  }

  /* ============================================
   * SECTION 2: Dorm booking fix (runs always)
   * ============================================ */
  function fixDormRooms() {
    var hiddenInputs = document.querySelectorAll('input[type="hidden"][name^="sr1-"]');
    hiddenInputs.forEach(function(input) {
      var roomId = input.name.replace('sr1-', '');
      var offer = input.closest('.offer');
      if (!offer) return;
      if (offer.querySelector('.tnh-dorm-book-btn')) return;

      var priceBox = offer.querySelector('.b24-multipricebox');
      if (!priceBox) return;

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
        var guestSelect = offer.querySelector('select[id^="naa"]');
        if (guestSelect) {
          guestSelect.value = '1';
          guestSelect.dispatchEvent(new Event('change', {bubbles: true}));
        }
        var form = document.getElementById('formlook');
        if (form) form.submit();
      });

      priceBox.appendChild(btn);
    });
  }

  /* ============================================
   * SECTION 3: Sticky bottom booking bar
   * ============================================ */
  function addStickyBarStyles() {
    var stickyCSS = document.createElement('style');
    stickyCSS.textContent = ''
      + '.multiplebookbutton .at_bookingbut{'
      +   'display:block!important;width:100%;margin-top:8px;padding:10px 16px;'
      +   'font-weight:600;font-size:14px;border-radius:6px;'
      + '}'
      + '.multiplebookbutton{margin-top:8px}'
      + '.b24fullcontainer-proprow11{'
      +   'position:sticky!important;bottom:0!important;z-index:100!important;'
      +   'background:#fff!important;border-top:1px solid #d4e0d4!important;'
      +   'box-shadow:0 -2px 8px rgba(0,0,0,.08)!important;'
      +   'padding:10px 16px!important;display:block!important;'
      + '}';
    document.head.appendChild(stickyCSS);
  }

  /* ============================================
   * INIT
   * ============================================ */
  function init() {
    addStickyBarStyles();
    fixDormRooms();

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
