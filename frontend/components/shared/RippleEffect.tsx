'use client';

import { useEffect } from 'react';

function spawnRipple(x: number, y: number) {
  const el = document.createElement('div');

  Object.assign(el.style, {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    width: '0px',
    height: '0px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 69, 0, 0.8)',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: '99999',
  });

  document.body.appendChild(el);

  el.animate(
    [
      { width: '0px',    height: '0px',    opacity: '1', borderWidth: '2px' },
      { width: '350px',  height: '350px',  opacity: '0', borderWidth: '1px' },
    ],
    { duration: 1200, easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)', fill: 'forwards' }
  ).onfinish = () => el.remove();
}

export function RippleEffect() {
  useEffect(() => {
    let lastTouch = 0;

    function onTouch(e: TouchEvent) {
      lastTouch = Date.now();
      const t = e.changedTouches[0];
      if (t) spawnRipple(t.clientX, t.clientY);
    }

    function onClick(e: MouseEvent) {
      if (Date.now() - lastTouch < 500) return; // evita duplicar após touch
      spawnRipple(e.clientX, e.clientY);
    }

    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return null;
}
