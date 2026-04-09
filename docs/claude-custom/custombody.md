<script>
(function() {
  'use strict';
  var ROOM_IDS = [567218, 567219, 567220, 567221];
  var BACKSTOP_MS = 10000;
  var ROOMS_CONTAINER_SELECTOR = '.b24fullcontainer-rooms';
  var ROOM_SELECTOR = '.b24room';
  var ROOM_HEADING_SELECTOR = '.b24-roompanel-heading';
  var PRICE_SELECTOR_PREFIX = '#roomprice-1-';
  var SELECT_DATES_MSG_CLASS = 'b24-select-dates-msg';
  function getUrlParam(name) {
    try { var p = new URLSearchParams(window.location.search); return p.get(name); }
    catch (e) { return null; }
  }
  function hasCheckinParam() {
    var c = getUrlParam('checkin'); return c !== null && c !== '';
  }
  function initHideReveal() {
    try {
      var body = document.body;
      var container = document.querySelector(ROOMS_CONTAINER_SELECTOR);
      if (hasCheckinParam()) { initWithCheckin(body, container); }
      else { initWithoutCheckin(body, container); }
    } catch (e) { safeReveal(); }
  }
  function initWithCheckin(body, container) {
    try {
      body.classList.add('b24-rooms-hidden');
      body.classList.remove('b24-rooms-revealed');
      if (!container) { startBackstop(body, null); return; }
      var existingRooms = container.querySelectorAll(ROOM_SELECTOR);
      if (existingRooms.length > 0) { revealRooms(body); return; }
      var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes.length > 0) {
            var rooms = container.querySelectorAll(ROOM_SELECTOR);
            if (rooms.length > 0) {
              observer.disconnect(); clearTimeout(backstopTimer);
              revealRooms(body); return;
            }
          }
        }
      });
      observer.observe(container, { childList: true, subtree: true });
      var backstopTimer = startBackstop(body, observer);
    } catch (e) { safeReveal(); }
  }
  function initWithoutCheckin(body, container) {
    try {
      body.classList.add('b24-rooms-hidden');
      body.classList.remove('b24-rooms-revealed');
      if (container) {
        var msgDiv = document.createElement('div');
        msgDiv.className = SELECT_DATES_MSG_CLASS;
        msgDiv.textContent = 'Select your dates above to see available rooms and prices.';
        container.parentNode.insertBefore(msgDiv, container);
      }
    } catch (e) { safeReveal(); }
  }
  function revealRooms(body) {
    try {
      var msgs = document.querySelectorAll('.' + SELECT_DATES_MSG_CLASS);
      for (var i = 0; i < msgs.length; i++) { msgs[i].parentNode.removeChild(msgs[i]); }
      body.classList.remove('b24-rooms-hidden');
      body.classList.add('b24-rooms-revealed');
      setTimeout(function() { initPriceInjection(); }, 300);
    } catch (e) { safeReveal(); }
  }
  function startBackstop(body, observer) {
    return setTimeout(function() {
      try { if (observer) observer.disconnect(); revealRooms(body); }
      catch (e) { safeReveal(); }
    }, BACKSTOP_MS);
  }
  function safeReveal() {
    try { document.body.classList.remove('b24-rooms-hidden'); document.body.classList.add('b24-rooms-revealed'); }
    catch (e) {}
  }
  function initPriceInjection() {
    try { for (var i = 0; i < ROOM_IDS.length; i++) { injectPriceForRoom(ROOM_IDS[i]); } }
    catch (e) { removePriceLabels(); }
  }
  function injectPriceForRoom(roomId) {
    try {
      var priceEl = document.querySelector(PRICE_SELECTOR_PREFIX + roomId);
      if (!priceEl) return;
      var priceText = (priceEl.textContent || priceEl.innerText || '').trim();
      if (!priceText || !/\d/.test(priceText)) return;
      var roomDiv = document.querySelector('#roomid' + roomId);
      if (!roomDiv) return;
      var heading = roomDiv.querySelector(ROOM_HEADING_SELECTOR);
      if (!heading) return;
      if (heading.querySelector('.b24-from-price')) return;
      var wrapper = document.createElement('span');
      wrapper.className = 'b24-from-price';
      var label = document.createElement('span');
      label.className = 'b24-from-price-label';
      label.textContent = 'From ';
      var price = document.createElement('span');
      price.textContent = priceText;
      wrapper.appendChild(label);
      wrapper.appendChild(price);
      heading.appendChild(wrapper);
    } catch (e) {}
  }
  function removePriceLabels() {
    try { var l = document.querySelectorAll('.b24-from-price'); for (var i = 0; i < l.length; i++) { l[i].parentNode.removeChild(l[i]); } }
    catch (e) {}
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initHideReveal); }
  else { initHideReveal(); }
})();
</script>