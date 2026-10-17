(() => {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const openCursor = styles.getPropertyValue('--cursor-open-url').trim();
  const closedCursor = styles.getPropertyValue('--cursor-closed-url').trim();
  const pointerCursor = styles.getPropertyValue('--cursor-pointer-url').trim();
  const pointerCursorFlipped = styles.getPropertyValue('--cursor-pointer-flipped-url').trim();
  const fallbackPointerLeft =
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ctext x='2' y='27' font-size='26'%3E%F0%9F%91%88%3C/text%3E%3C/svg%3E")`;
  const fallbackPointerRight =
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ctext x='2' y='27' font-size='26'%3E%F0%9F%91%89%3C/text%3E%3C/svg%3E")`;
  const pointerLeft = pointerCursor || fallbackPointerLeft;
  const pointerRight = pointerCursorFlipped || fallbackPointerRight;
  const hasDirectionalPointer = Boolean(pointerLeft && pointerRight);

  if (!openCursor || !closedCursor) {
    return;
  }

  let lastActivity = Date.now();
  let blinkTimer = null;
  let closeTimer = null;
  let isClosed = false;
  let isPointerFlipped = null;
  let lastPointerX = window.innerWidth / 2;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const setCursor = (cursorValue) => {
    root.style.setProperty('--cursor-current-url', cursorValue);
  };

  const setPointerCursor = (cursorValue) => {
    root.style.setProperty('--cursor-pointer-active-url', cursorValue);
  };

  const updatePointerDirection = (clientX) => {
    if (!hasDirectionalPointer || typeof clientX !== 'number' || Number.isNaN(clientX)) {
      return;
    }
    lastPointerX = clientX;
    const shouldFlip = clientX > (window.innerWidth / 2);
    if (isPointerFlipped === shouldFlip) {
      return;
    }
    isPointerFlipped = shouldFlip;
    setPointerCursor(shouldFlip ? pointerRight : pointerLeft);
  };

  const getClientXFromEvent = (event) => {
    if (!event) {
      return null;
    }
    if (typeof event.clientX === 'number') {
      return event.clientX;
    }
    if (event.touches && event.touches.length) {
      return event.touches[0].clientX;
    }
    if (event.changedTouches && event.changedTouches.length) {
      return event.changedTouches[0].clientX;
    }
    return null;
  };

  const openEye = () => {
    if (isClosed) {
      setCursor(openCursor);
      isClosed = false;
    }
  };

  const closeEye = () => {
    if (!isClosed) {
      setCursor(closedCursor);
      isClosed = true;
    }
  };

  const FULL_CLOSE_SECONDS = 6;
  const BASE_BLINK_INTERVAL = 2.0;
  const FAST_BLINK_INTERVAL = 0.3;
  const BASE_BLINK_CLOSE_MS = 120;
  const MAX_BLINK_CLOSE_MS = 420;

  const scheduleBlink = () => {
    if (blinkTimer) {
      clearTimeout(blinkTimer);
    }

    const idleSeconds = (Date.now() - lastActivity) / 1000;

    if (idleSeconds >= FULL_CLOSE_SECONDS) {
      closeEye();
      return;
    }

    const t = clamp(idleSeconds / FULL_CLOSE_SECONDS, 0, 1);
    const interval = clamp(
      BASE_BLINK_INTERVAL - (BASE_BLINK_INTERVAL - FAST_BLINK_INTERVAL) * t,
      FAST_BLINK_INTERVAL,
      BASE_BLINK_INTERVAL
    );
    const closeDuration = Math.round(
      BASE_BLINK_CLOSE_MS + (MAX_BLINK_CLOSE_MS - BASE_BLINK_CLOSE_MS) * t
    );

    blinkTimer = setTimeout(() => {
      closeEye();
      if (closeTimer) {
        clearTimeout(closeTimer);
      }
      closeTimer = setTimeout(() => {
        if ((Date.now() - lastActivity) / 1000 < FULL_CLOSE_SECONDS) {
          openEye();
        }
      }, closeDuration);
      scheduleBlink();
    }, interval * 1000);
  };

  const markActivity = (event) => {
    updatePointerDirection(getClientXFromEvent(event));
    lastActivity = Date.now();
    openEye();
    scheduleBlink();
  };

  ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(
    (eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    }
  );

  window.addEventListener(
    'resize',
    () => {
      updatePointerDirection(lastPointerX);
    },
    { passive: true }
  );

  setPointerCursor(pointerLeft);
  updatePointerDirection(lastPointerX);
  markActivity();
})();
