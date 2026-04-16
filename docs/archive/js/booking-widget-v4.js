/*
 * Trip'N'Hostel Booking Widget v4
 * Self-injecting — just add <div id="tnh-booking-root"></div> and load this script.
 * CONFIG is set per-property at the top.
 */
(function() {
  var CONFIG = {
    ownerid: '141266',
    propid:  '271142',
    cssfile: 'https://astrongpresence.com/CSS-base-v2.css',
    minNights: 2,
    maxNights: 90,
    defaultNights: 2,
    primaryColor: '#E7A35C',
    secondaryColor: '#6DA17D',
    textColor: '#2D482D',
    textLight: '#5a7a5a',
    bgColor: '#F7FAFC',
    borderColor: '#d4e0d4',
    secondaryHover: '#5b8d6a',
    fontBody: "'Lexend', sans-serif",
    fontHeading: "'Lexend Giga', sans-serif",
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600&family=Lexend+Giga:wght@400;600&display=swap'
  };

  /* ---- Inject Google Fonts ---- */
  var fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = CONFIG.fontsUrl;
  document.head.appendChild(fontLink);

  /* ---- Inject CSS ---- */
  var css = ''
    + '.tnh-booking-widget{'
    +   '--tnh-secondary:' + CONFIG.secondaryColor + ';'
    +   '--tnh-text:' + CONFIG.textColor + ';'
    +   '--tnh-text-light:' + CONFIG.textLight + ';'
    +   '--tnh-bg:' + CONFIG.bgColor + ';'
    +   '--tnh-border:' + CONFIG.borderColor + ';'
    +   '--tnh-secondary-hover:' + CONFIG.secondaryHover + ';'
    +   'font-family:' + CONFIG.fontBody + ';'
    +   'color:var(--tnh-text);max-width:700px;margin:0 auto;padding:0;box-sizing:border-box;'
    + '}'
    + '.tnh-booking-widget *{box-sizing:border-box}'
    + '.tnh-booking-card{background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(45,72,45,.08);padding:28px 28px 24px;border:1px solid var(--tnh-border)}'
    + '.tnh-booking-title{font-family:' + CONFIG.fontHeading + ';font-weight:600;font-size:18px;letter-spacing:-.01em;margin:0 0 20px;color:var(--tnh-text)}'
    + '.tnh-booking-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}'
    + '.tnh-field{display:flex;flex-direction:column;gap:5px}'
    + '.tnh-field-full{grid-column:1/-1}'
    + '.tnh-label{font-size:12px;font-weight:500;color:var(--tnh-text-light);text-transform:uppercase;letter-spacing:.05em}'
    + '.tnh-input{font-family:' + CONFIG.fontBody + ';font-size:15px;font-weight:400;color:var(--tnh-text);background:var(--tnh-bg);border:1.5px solid var(--tnh-border);border-radius:8px;padding:10px 12px;outline:none;transition:border-color .2s,box-shadow .2s;-webkit-appearance:none;appearance:none;width:100%}'
    + '.tnh-input:focus{border-color:var(--tnh-secondary);box-shadow:0 0 0 3px rgba(109,161,125,.15)}'
    + '.tnh-select-wrap{position:relative}'
    + '.tnh-select-wrap::after{content:"";position:absolute;right:12px;top:50%;transform:translateY(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--tnh-text-light);pointer-events:none}'
    + '.tnh-select-wrap select.tnh-input{padding-right:32px;cursor:pointer}'
    + '.tnh-search-btn{grid-column:1/-1;font-family:' + CONFIG.fontHeading + ';font-size:15px;font-weight:600;letter-spacing:.02em;color:#fff;background:var(--tnh-secondary);border:none;border-radius:8px;padding:13px 24px;margin-top:4px;cursor:pointer;transition:background .2s,box-shadow .2s,transform .1s;display:flex;align-items:center;justify-content:center;gap:8px}'
    + '.tnh-search-btn:hover{background:var(--tnh-secondary-hover);box-shadow:0 4px 20px rgba(45,72,45,.14)}'
    + '.tnh-search-btn:active{transform:scale(.985)}'
    + '.tnh-search-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
    + '.tnh-error{grid-column:1/-1;font-size:13px;color:#c0392b;background:#fdf0ef;border-radius:6px;padding:8px 12px;display:none}'
    + '.tnh-error.visible{display:block}'
    + '.tnh-results{display:none;margin-top:16px;position:relative}'
    + '.tnh-results.open{display:block}'
    + '.tnh-results-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:0 2px}'
    + '.tnh-results-summary{font-size:14px;font-weight:500;color:var(--tnh-text-light)}'
    + '.tnh-results-close{font-family:' + CONFIG.fontBody + ';font-size:13px;font-weight:500;color:var(--tnh-text-light);background:none;border:1.5px solid var(--tnh-border);border-radius:6px;padding:5px 12px;cursor:pointer;transition:border-color .2s,color .2s}'
    + '.tnh-results-close:hover{border-color:var(--tnh-text-light);color:var(--tnh-text)}'
    + '.tnh-results-frame-wrap{border:1px solid var(--tnh-border);border-radius:12px;overflow:hidden;background:#fff}'
    + '.tnh-results-frame{width:100%;border:none;display:block;min-height:0;transition:height .3s ease}'
    + '.tnh-loading{display:none;align-items:center;justify-content:center;gap:10px;padding:40px 20px;font-size:14px;font-weight:400;color:var(--tnh-text-light)}'
    + '.tnh-loading.visible{display:flex}'
    + '.tnh-spinner{width:20px;height:20px;border:2.5px solid var(--tnh-border);border-top-color:var(--tnh-secondary);border-radius:50%;animation:tnh-spin .7s linear infinite}'
    + '@keyframes tnh-spin{to{transform:rotate(360deg)}}'
    + '@media(max-width:480px){'
    +   '.tnh-booking-card{padding:20px 18px 18px}'
    +   '.tnh-booking-fields{grid-template-columns:1fr}'
    +   '.tnh-field-full,.tnh-search-btn,.tnh-error{grid-column:1}'
    +   '.tnh-results-frame-wrap{border-radius:8px}'
    +   '.tnh-results-summary{font-size:12px}'
    + '}';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---- Inject HTML ---- */
  var root = document.getElementById('tnh-booking-root');
  if (!root) return;

  root.innerHTML = ''
    + '<div class="tnh-booking-widget">'
    +   '<div class="tnh-booking-card">'
    +     '<h3 class="tnh-booking-title">Check Availability</h3>'
    +     '<div class="tnh-booking-fields">'
    +       '<div class="tnh-field">'
    +         '<span class="tnh-label">Check In</span>'
    +         '<input type="date" id="tnh-checkin" class="tnh-input" />'
    +       '</div>'
    +       '<div class="tnh-field">'
    +         '<span class="tnh-label">Check Out</span>'
    +         '<input type="date" id="tnh-checkout" class="tnh-input" />'
    +       '</div>'
    +       '<div class="tnh-field tnh-field-full">'
    +         '<span class="tnh-label">Guests</span>'
    +         '<div class="tnh-select-wrap">'
    +           '<select id="tnh-guests" class="tnh-input">'
    +             '<option value="1">1 Guest</option>'
    +             '<option value="2" selected>2 Guests</option>'
    +             '<option value="3">3 Guests</option>'
    +             '<option value="4">4 Guests</option>'
    +             '<option value="5">5 Guests</option>'
    +             '<option value="6">6 Guests</option>'
    +           '</select>'
    +         '</div>'
    +       '</div>'
    +       '<div class="tnh-error" id="tnh-error"></div>'
    +       '<button type="button" class="tnh-search-btn" id="tnh-search-btn">'
    +         '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    +         'Search Rooms'
    +       '</button>'
    +     '</div>'
    +   '</div>'
    +   '<div class="tnh-results" id="tnh-results">'
    +     '<div class="tnh-results-header">'
    +       '<span class="tnh-results-summary" id="tnh-results-summary"></span>'
    +       '<button type="button" class="tnh-results-close" id="tnh-results-close">Close</button>'
    +     '</div>'
    +     '<div class="tnh-loading" id="tnh-loading">'
    +       '<div class="tnh-spinner"></div>'
    +       '<span>Loading available rooms\u2026</span>'
    +     '</div>'
    +     '<div class="tnh-results-frame-wrap">'
    +       '<iframe id="tnh-results-frame" class="tnh-results-frame" scrolling="no" allowtransparency="true"></iframe>'
    +     '</div>'
    +   '</div>'
    + '</div>';

  /* ---- Wire up logic ---- */
  var checkinEl  = document.getElementById('tnh-checkin');
  var checkoutEl = document.getElementById('tnh-checkout');
  var guestsEl   = document.getElementById('tnh-guests');
  var errorEl    = document.getElementById('tnh-error');
  var searchBtn  = document.getElementById('tnh-search-btn');
  var resultsEl  = document.getElementById('tnh-results');
  var summaryEl  = document.getElementById('tnh-results-summary');
  var closeBtn   = document.getElementById('tnh-results-close');
  var loadingEl  = document.getElementById('tnh-loading');
  var iframeEl   = document.getElementById('tnh-results-frame');

  function formatDateBeds24(d) {
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + m + day;
  }

  function formatDateDisplay(d) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function toInputDate(d) {
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }

  function daysBetween(a, b) {
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
  }

  function clearError() {
    errorEl.classList.remove('visible');
    errorEl.textContent = '';
  }

  /* Defaults */
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  var defaultOut = new Date(tomorrow);
  defaultOut.setDate(defaultOut.getDate() + CONFIG.defaultNights);

  checkinEl.min = toInputDate(tomorrow);
  checkinEl.value = toInputDate(tomorrow);
  checkoutEl.min = toInputDate(new Date(tomorrow.getTime() + CONFIG.minNights * 86400000));
  checkoutEl.value = toInputDate(defaultOut);

  /* Date events */
  checkinEl.addEventListener('change', function() {
    clearError();
    if (checkinEl.value) {
      var cin = new Date(checkinEl.value + 'T00:00:00');
      var minOut = new Date(cin);
      minOut.setDate(minOut.getDate() + CONFIG.minNights);
      checkoutEl.min = toInputDate(minOut);
      if (!checkoutEl.value || new Date(checkoutEl.value + 'T00:00:00') <= cin) {
        checkoutEl.value = toInputDate(minOut);
      }
    }
  });

  checkoutEl.addEventListener('change', function() {
    clearError();
  });

  /* Iframe height sync */
  var roomsReady = false;
  window.addEventListener('message', function(e) {
    if (!e.origin || e.origin.indexOf('beds24.com') === -1) return;
    var data;
    try { data = (typeof e.data === 'string') ? JSON.parse(e.data) : e.data; } catch(err) { return; }
    if (data && data.type === 'tnh-height' && typeof data.height === 'number') {
      var h = Math.max(data.height + 20, 200);
      iframeEl.style.height = h + 'px';
      /* Hide loading spinner once rooms have rendered (height > 500px) */
      if (h > 500 && !roomsReady) {
        roomsReady = true;
        loadingEl.classList.remove('visible');
        iframeEl.style.display = 'block';
      }
    }
  });

  /* Show/hide results */
  function showResults(cin, cout, nights, guests) {
    var summary = formatDateDisplay(cin) + ' \u2192 ' + formatDateDisplay(cout)
      + '  \u00b7  ' + nights + (nights === 1 ? ' night' : ' nights')
      + '  \u00b7  ' + guests + (parseInt(guests) === 1 ? ' guest' : ' guests');
    summaryEl.textContent = summary;

    loadingEl.classList.add('visible');
    iframeEl.style.display = 'none';
    iframeEl.style.height = '0';
    roomsReady = false;
    resultsEl.classList.add('open');

    var url = 'https://www.beds24.com/booking2.php'
      + '?ownerid=' + CONFIG.ownerid
      + '&propid=' + CONFIG.propid
      + '&checkin=' + formatDateBeds24(cin)
      + '&numnight=' + nights
      + '&numadult=' + guests
      + '&referer=widget'
      + '&cssfile=' + encodeURIComponent(CONFIG.cssfile);

    iframeEl.onload = function() {
      /* Don't hide spinner yet — wait for postMessage with real content height.
         Fallback: if no height message arrives after 8s, show iframe anyway */
      setTimeout(function() {
        if (!roomsReady) {
          roomsReady = true;
          loadingEl.classList.remove('visible');
          iframeEl.style.display = 'block';
          if (!iframeEl.style.height || iframeEl.style.height === '0px') {
            iframeEl.style.height = '2400px';
          }
        }
      }, 8000);
    };

    iframeEl.src = url;

    setTimeout(function() {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  function hideResults() {
    resultsEl.classList.remove('open');
    iframeEl.src = '';
    iframeEl.style.display = 'none';
    iframeEl.style.height = '0';
    loadingEl.classList.remove('visible');
  }

  closeBtn.addEventListener('click', hideResults);

  /* Search */
  searchBtn.addEventListener('click', function() {
    clearError();

    if (!checkinEl.value || !checkoutEl.value) {
      showError('Please select your check-in and check-out dates.');
      return;
    }

    var cin  = new Date(checkinEl.value + 'T00:00:00');
    var cout = new Date(checkoutEl.value + 'T00:00:00');
    var nights = daysBetween(cin, cout);

    if (nights < CONFIG.minNights) {
      showError('Minimum stay is ' + CONFIG.minNights + ' nights.');
      return;
    }
    if (nights > CONFIG.maxNights) {
      showError('Maximum stay is ' + CONFIG.maxNights + ' nights.');
      return;
    }
    if (cin <= today) {
      showError('Check-in must be a future date.');
      return;
    }

    showResults(cin, cout, nights, guestsEl.value);
  });
})();
