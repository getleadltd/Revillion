import { useState, useEffect, useRef } from 'react';

export const useCountUp = (target: number, duration = 1800, startOnMount = false) => {
  const [count, setCount] = useState(startOnMount ? 0 : target);
  const [started, setStarted] = useState(startOnMount);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startOnMount) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    const el = ref.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [startOnMount]);

  useEffect(() => {
    if (!started) return;
    if (target === 0) return;

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target, duration]);

  return { count, ref };
};
