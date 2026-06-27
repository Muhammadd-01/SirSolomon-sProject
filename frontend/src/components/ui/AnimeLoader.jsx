import { useEffect, useRef } from 'react';
import anime from 'animejs';

export default function AnimeLoader({ size = 60, color = '#10b981' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const dots = containerRef.current.querySelectorAll('.anime-dot');
    
    const animation = anime({
      targets: dots,
      translateY: [
        { value: -15, duration: 300, easing: 'easeOutQuad' },
        { value: 0, duration: 500, easing: 'easeInQuad' }
      ],
      opacity: [
        { value: 1, duration: 300 },
        { value: 0.3, duration: 500 }
      ],
      scale: [
        { value: 1.5, duration: 300, easing: 'easeOutQuad' },
        { value: 1, duration: 500, easing: 'easeInQuad' }
      ],
      delay: anime.stagger(150),
      loop: true
    });

    return () => animation.pause();
  }, []);

  return (
    <div ref={containerRef} className="flex items-center justify-center gap-2" style={{ height: size }}>
      {[0, 1, 2].map((i) => (
        <div 
          key={i} 
          className="anime-dot rounded-full"
          style={{ 
            width: size / 4, 
            height: size / 4, 
            backgroundColor: color,
            opacity: 0.3
          }}
        />
      ))}
    </div>
  );
}
