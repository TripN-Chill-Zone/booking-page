/*
 * TNH Beds24 Iframe Helper v9
 * Load via customhead: <script src="https://astrongpresence.com/beds24-iframe-helper-v9.js"></script>
 *
 * 1. When embedded via widget (referer=widget): hide chrome, report height, trim page
 * 2. Dorm booking fix: unhide guest selector in correct position
 * 3. Per-room Book buttons made prominent
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
      var h = document.documentElement.scrollHeight;
      var hidden = [
        '.b24fullcontainer-selector',
        '.b24fullcontainer-top',
        '.b24fullcontainer-ownerrow1',
        '.b24fullcontainer-footer',
        '.b24fullcontainer-proprow1',
        '.b24fullcontainer-proprow2',
        '.b24fullcontainer-ownerrow11'
      ];
      hidden.forEach(function(sel) {
        var el = document.querySelector(sel);
        if (el) h -= el.scrollHeight || 0;
      });

      /* Also trim body to actual content */
      var rooms = document.querySelector('.b24fullcontainer-rooms');
      var proprow11 = document.querySelector('.b24fullcontainer-proprow11');
      if (rooms && rooms.offsetHeight > 0) {
        var contentBottom = rooms.offsetTop + rooms.offsetHeight;
        if (proprow11 && proprow11.offsetHeight > 0) {
          var barBottom = proprow11.offsetTop + proprow11.offsetHeight;
          if (barBottom > contentBottom) contentBottom = barBottom;
        }
        contentBottom += 40; /* padding */
        if (contentBottom < h && contentBottom > 200) {
          h = contentBottom;
        }
        document.body.style.height = h + 'px';
        document.documentElement.style.height = h + 'px';
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
   * Unhide guest selector in the SAME position as other rooms' quantity dropdown
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

      /* The guest selector is inside .b24-multipricebox > .form-inline,
         same container where private rooms have their quantity dropdown.
         We just need to unhide it and restyle it. */
      var guestSelect = offer.querySelector('select[id^="naa"]');
      if (!guestSelect) return;

      /* Restyle the select to match quantity dropdowns on other rooms */
      guestSelect.style.cssText = ''
        + 'display:inline-block!important;visibility:visible!important;'
        + 'width:auto;min-width:120px;padding:6px 10px;'
        + 'font-family:inherit;font-size:14px;'
        + 'border:1.5px solid #d4e0d4;border-radius:6px;'
        + 'background:#F7FAFC;color:#2D482D;cursor:pointer;';

      /* Unhide all ancestor elements up to the offer */
      var el = guestSelect.parentElement;
      while (el && el !== offer) {
        var cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') {
          el.style.display = 'block';
          el.style.visibility = 'visible';
        }
        el = el.parentElement;
      }

      /* Replace the "0 Guests / 1 Guest" labels with "0 Beds / 1 Bed" */
      for (var i = 0; i < guestSelect.options.length; i++) {
        var opt = guestSelect.options[i];
        opt.text = opt.text.replace('Guest', 'Bed').replace('Guests', 'Beds');
      }

      /* Replace the "Select" label if present */
      var selectLabel = offer.querySelector('.roomofferqtyselectlabel');
      if (selectLabel) {
        selectLabel.textContent = 'Beds:';
        selectLabel.style.display = 'inline-block';
        selectLabel.style.visibility = 'visible';
      }
    });
  }

  /* ============================================
   * SECTION 3: Per-room Book buttons (runs always)
   * Make the existing per-room Book buttons prominent
   * ============================================ */
  function addStyles() {
    var css = document.createElement('style');
    css.textContent = ''
      /* Per-room Book button — always visible, prominent */
      + '.multiplebookbutton{margin-top:8px;display:block!important}'
      + '.multiplebookbutton .at_bookingbut{'
      +   'display:block!important;width:100%;padding:10px 16px;'
      +   'font-weight:600;font-size:14px;border-radius:6px;'
      +   'background:#6DA17D!important;color:#fff!important;'
      +   'border:none!important;cursor:pointer;'
      +   'transition:background .2s;'
      + '}'
      + '.multiplebookbutton .at_bookingbut:hover{'
      +   'background:#5b8d6a!important;'
      + '}'
      /* Bottom summary bar — stays at bottom of content, no floating */
      + '.b24fullcontainer-proprow11{'
      +   'background:#fff!important;border-top:1px solid #d4e0d4!important;'
      +   'box-shadow:0 -2px 8px rgba(0,0,0,.08)!important;'
      +   'padding:10px 16px!important;'
      + '}';
    document.head.appendChild(css);
  }

  /* ============================================
   * INIT
   * ============================================ */
  function init() {
    addStyles();
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
