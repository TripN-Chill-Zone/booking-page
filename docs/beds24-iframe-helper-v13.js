/*
 * TNH Beds24 Iframe Helper v13
 * Load via customhead: <script src="https://astrongpresence.com/beds24-iframe-helper-v13.js"></script>
 */
(function(){
  var isWidget = location.search.indexOf('referer=widget') >= 0;
  var isEmbedded = window.parent !== window;

  /* ============================================
   * SECTION 1: Hide chrome + height sync (widget only)
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
      + '.b24fullcontainer-proprow11{display:none!important}'
      + '.b24fullcontainer-ownerrow11{display:none!important}'
      + 'body{background:transparent!important;margin:0!important;padding:0!important}';
    document.head.appendChild(s);

    /* Height: use scrollHeight only, do NOT trim body.
       The hidden elements have display:none so they contribute 0 to scrollHeight.
       No body height trimming = no risk of clipping content. */
    function send() {
      var h = document.documentElement.scrollHeight;
      h = Math.max(h, 200);
      try { window.parent.postMessage(JSON.stringify({type:'tnh-height', height:h}), '*'); } catch(e) {}
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

      /* Make visible and style to match other rooms */
      guestSelect.style.cssText = ''
        + 'display:inline-block!important;visibility:visible!important;'
        + 'width:auto;min-width:80px;padding:6px 10px;'
        + 'font-family:inherit;font-size:14px;'
        + 'border:1.5px solid #d4e0d4;border-radius:6px;'
        + 'background:#F7FAFC;color:#2D482D;cursor:pointer;'
        + 'margin-right:8px;';

      /* Unhide all ancestors up to the offer */
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
        priceBox.style.cssText = 'text-align:right;';
      }

      /* Relabel "Guests" → "Beds" */
      for (var i = 0; i < guestSelect.options.length; i++) {
        var opt = guestSelect.options[i];
        opt.text = opt.text.replace(/Guests?/g, function(m) {
          return m === 'Guest' ? 'Bed' : 'Beds';
        });
      }

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
      btn.style.cssText = ''
        + 'display:inline-block;padding:8px 24px;margin-top:10px;'
        + 'font-family:inherit;font-size:14px;font-weight:600;'
        + 'color:#fff;background:#6DA17D;border:none;border-radius:6px;'
        + 'cursor:pointer;transition:background .2s;'
        + 'float:right;';

      btn.addEventListener('mouseenter', function() { btn.style.background = '#5b8d6a'; });
      btn.addEventListener('mouseleave', function() { btn.style.background = '#6DA17D'; });

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
   * INIT — single observer with guard
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
