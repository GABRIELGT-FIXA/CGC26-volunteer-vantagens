'use client';

import { useEffect, useRef } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'flip';

interface Props {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function Reveal({ children, direction = 'up', delay = 0, className = '', as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('revealed'), delay);
        } else {
          el.classList.remove('revealed');
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={ref} data-reveal={direction} className={className}>
      {children}
    </Tag>
  );
}
