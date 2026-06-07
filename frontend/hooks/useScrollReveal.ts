import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = (entry.target as HTMLElement).dataset.delay ?? '0';
            setTimeout(() => entry.target.classList.add('revealed'), Number(delay));
          } else {
            // reset para repetir ao subir a página (comportamento ScrollReveal reset:true)
            entry.target.classList.remove('revealed');
          }
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
