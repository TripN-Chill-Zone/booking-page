/*
 * TNH Beds24 Iframe Helper v8
 * Load via customhead: <script src="https://astrongpresence.com/beds24-iframe-helper-v8.js"></script>
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
      if (offer.querySelector('.tnh-dorm-fixed')) return;

      /* Mark as fixed */
      var marker = document.createElement('span');
      marker.className = 'tnh-dorm-fixed';
      marker.style.display = 'none';
      offer.appendChild(marker);

      /* Find the guest count selector — unhide it and restyle it as a "Select beds" control */
      var guestSelect = offer.querySelector('select[id^="naa"]');
      if (guestSelect) {
        /* Make the guest selector visible */
        guestSelect.style.cssText = 'display:block!important;width:100%;padding:8px 12px;'
          + 'font-family:inherit;font-size:14px;border:1.5px solid #d4e0d4;'
          + 'border-radius:6px;background:#F7FAFC;color:#2D482D;cursor:pointer;'
          + 'margin-top:8px;-webkit-appearance:none;appearance:none;';

        /* Make parent containers visible too */
        var parent = guestSelect.parentElement;
        while (parent && parent !== offer) {
          if (window.getComputedStyle(parent).display === 'none') {
            parent.style.display = 'block';
          }
          parent = parent.parentElement;
        }

        /* Add a label before the select */
        var label = document.createElement('span');
        label.textContent = 'Select Beds:';
        label.style.cssText = 'display:block;font-size:12px;font-weight:500;color:#5a7a5a;'
          + 'text-transform:uppercase;letter-spacing:.05em;margin-top:10px;';
        guestSelect.parentElement.insertBefore(label, guestSelect);

        /* When guest selects a bed count, trigger Beds24's internal handler
           which will activate the bottom booking bar */
        guestSelect.addEventListener('change', function() {
          /* Beds24 listens for changes on this select to update the bottom bar.
             The native event dispatch should be enough. If not, also click
             the multi-room book button to activate the flow. */
          var multiBtn = document.querySelector('.b24-bookingstrip .at_bookingbut');
          if (multiBtn && guestSelect.value !== '0') {
            /* Small delay to let Beds24's handler process the change first */
            setTimeout(function() {
              /* Don't click — just ensure the bottom bar is visible */
            }, 100);
          }
        });
      }

      /* Also find and show the per-room Book button if it exists but is hidden */
      var bookBtn = offer.querySelector('.multiplebookbutton');
      if (bookBtn) {
        bookBtn.style.display = 'block';
        var btn = bookBtn.querySelector('.at_bookingbut');
        if (btn) {
          btn.style.cssText = 'display:block!important;width:100%;margin-top:8px;padding:10px 16px;'
            + 'font-weight:600;font-size:14px;border-radius:6px;';
        }
      }
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
      /* Bottom bar: position absolute, will be moved by JS */
      + '.b24fullcontainer-proprow11{'
      +   'position:absolute!important;left:0!important;right:0!important;z-index:100!important;'
      +   'background:#fff!important;border-top:1px solid #d4e0d4!important;'
      +   'box-shadow:0 -2px 8px rgba(0,0,0,.08)!important;'
      +   'padding:10px 16px!important;display:block!important;'
      +   'transition:top .15s ease!important;'
      + '}';
    document.head.appendChild(stickyCSS);

    /* Listen for scroll position from parent widget */
    window.addEventListener('message', function(e) {
      var data;
      try { data = (typeof e.data === 'string') ? JSON.parse(e.data) : e.data; } catch(err) { return; }
      if (data && data.type === 'tnh-scroll' && typeof data.visibleBottom === 'number') {
        var bar = document.querySelector('.b24fullcontainer-proprow11');
        if (bar) {
          var barH = bar.offsetHeight || 50;
          /* Position the bar so its bottom edge is at the visible bottom of the viewport */
          var topPos = data.visibleBottom - barH;
          /* Don't go above 0 or below content */
          topPos = Math.max(0, topPos);
          bar.style.top = topPos + 'px';
        }
      }
    });
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
