/* ==========================================================================
   beds24-rooms-v1.js
   Hide/Reveal Rooms + Price Injection
   Paste into: custombody field (wrapped in <script> tags)
   
   DOM-verified selectors:
     Room container:  .b24fullcontainer-rooms
     Room cards:      .b24room
     Room heading:    .b24-roompanel-heading > .at_roomnametext
     Price elements:  #roomprice-1-{roomId}
     Checkin param:   checkin (in URL query string)
   
   REQUIREMENTS:
   - Hide rooms until dates selected (no checkin param → hide)
   - MutationObserver on room container, reveal when rooms appear
   - With checkin param → watch for rooms, reveal when loaded
   - Without checkin param → hide rooms, show message, wait for page reload
   - 10-second backstop timeout
   - Price injection: fail silently to no-display on ANY error
   ========================================================================== */

(function() {
  'use strict';

  // ---- CONFIGURATION ----
  var ROOM_IDS = [567218, 567219, 567220, 567221];
  var BACKSTOP_MS = 10000;
  var ROOMS_CONTAINER_SELECTOR = '.b24fullcontainer-rooms';
  var ROOM_SELECTOR = '.b24room';
  var ROOM_HEADING_SELECTOR = '.b24-roompanel-heading';
  var ROOM_NAME_SELECTOR = '.at_roomnametext';
  var PRICE_SELECTOR_PREFIX = '#roomprice-1-';
  var SELECT_DATES_MSG_CLASS = 'b24-select-dates-msg';

  // ---- HELPERS ----
  function getUrlParam(name) {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get(name);
    } catch (e) {
      return null;
    }
  }

  function hasCheckinParam() {
    var checkin = getUrlParam('checkin');
    return checkin !== null && checkin !== '';
  }

  // ---- HIDE/REVEAL MODULE ----
  function initHideReveal() {
    try {
      var body = document.body;
      var container = document.querySelector(ROOMS_CONTAINER_SELECTOR);

      if (hasCheckinParam()) {
        initWithCheckin(body, container);
      } else {
        initWithoutCheckin(body, container);
      }
    } catch (e) {
      // Fail silently — ensure rooms are visible
      safeReveal();
    }
  }

  function initWithCheckin(body, container) {
    try {
      // Initially hide rooms to prevent unstyled flash
      body.classList.add('b24-rooms-hidden');
      body.classList.remove('b24-rooms-revealed');

      if (!container) {
        // Container not found — backstop will handle
        startBackstop(body, null);
        return;
      }

      // Check if rooms already loaded
      var existingRooms = container.querySelectorAll(ROOM_SELECTOR);
      if (existingRooms.length > 0) {
        revealRooms(body);
        return;
      }

      // Watch for rooms to appear in the container
      var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes.length > 0) {
            var rooms = container.querySelectorAll(ROOM_SELECTOR);
            if (rooms.length > 0) {
              observer.disconnect();
              clearTimeout(backstopTimer);
              revealRooms(body);
              return;
            }
          }
        }
      });

      observer.observe(container, { childList: true, subtree: true });

      // Backstop: force reveal after timeout
      var backstopTimer = startBackstop(body, observer);
    } catch (e) {
      safeReveal();
    }
  }

  function initWithoutCheckin(body, container) {
    try {
      body.classList.add('b24-rooms-hidden');
      body.classList.remove('b24-rooms-revealed');

      // Insert "select dates" message before the rooms container
      if (container) {
        var msgDiv = document.createElement('div');
        msgDiv.className = SELECT_DATES_MSG_CLASS;
        msgDiv.textContent = 'Select your dates above to see available rooms and prices.';
        container.parentNode.insertBefore(msgDiv, container);
      }

      // No backstop — rooms stay hidden until guest selects dates.
      // Beds24 reloads the page with checkin param when dates are submitted.
    } catch (e) {
      safeReveal();
    }
  }

  function revealRooms(body) {
    try {
      // Remove any "select dates" message
      var msgs = document.querySelectorAll('.' + SELECT_DATES_MSG_CLASS);
      for (var i = 0; i < msgs.length; i++) {
        msgs[i].parentNode.removeChild(msgs[i]);
      }

      body.classList.remove('b24-rooms-hidden');
      body.classList.add('b24-rooms-revealed');

      // After reveal, attempt price injection
      setTimeout(function() {
        initPriceInjection();
      }, 300);
    } catch (e) {
      safeReveal();
    }
  }

  function startBackstop(body, observer) {
    return setTimeout(function() {
      try {
        if (observer) observer.disconnect();
        revealRooms(body);
      } catch (e) {
        safeReveal();
      }
    }, BACKSTOP_MS);
  }

  function safeReveal() {
    // Nuclear option — remove hiding, ensure rooms visible
    try {
      document.body.classList.remove('b24-rooms-hidden');
      document.body.classList.add('b24-rooms-revealed');
    } catch (e) {
      // Absolute last resort — can't modify body classes
    }
  }

  // ---- PRICE INJECTION MODULE ----
  // Reads price from #roomprice-1-{roomId} elements and injects
  // "From €XX" label into room heading (.b24-roompanel-heading).
  // HARD REQUIREMENT: fail silently to no-display on ANY error.

  function initPriceInjection() {
    try {
      for (var i = 0; i < ROOM_IDS.length; i++) {
        injectPriceForRoom(ROOM_IDS[i]);
      }
    } catch (e) {
      // Fail silently — no price labels shown
      removePriceLabels();
    }
  }

  function injectPriceForRoom(roomId) {
    try {
      var priceEl = document.querySelector(PRICE_SELECTOR_PREFIX + roomId);
      if (!priceEl) return; // No price element — skip silently

      var priceText = (priceEl.textContent || priceEl.innerText || '').trim();

      // Validate: must contain a number
      if (!priceText || !/\d/.test(priceText)) return;

      // Find the room's container by ID
      var roomDiv = document.querySelector('#roomid' + roomId);
      if (!roomDiv) return;

      // Find the heading inside this room
      var heading = roomDiv.querySelector(ROOM_HEADING_SELECTOR);
      if (!heading) return;

      // Don't inject twice
      if (heading.querySelector('.b24-from-price')) return;

      // Create label
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
    } catch (e) {
      // Fail silently for this room
    }
  }

  function removePriceLabels() {
    try {
      var labels = document.querySelectorAll('.b24-from-price');
      for (var i = 0; i < labels.length; i++) {
        labels[i].parentNode.removeChild(labels[i]);
      }
    } catch (e) {
      // Can't clean up — acceptable
    }
  }

  // ---- INIT ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHideReveal);
  } else {
    initHideReveal();
  }

})();
