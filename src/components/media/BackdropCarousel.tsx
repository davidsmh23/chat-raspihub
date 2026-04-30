import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface BackdropCarouselProps {
  backdrops: string[];
}

export function BackdropCarousel({ backdrops }: BackdropCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (backdrops.length <= 1) return;

    const tick = () => {
      const nextIdx = (current + 1) % backdrops.length;
      setNext(nextIdx);

      if (!currentRef.current || !nextRef.current) return;

      gsap.set(nextRef.current, { opacity: 0 });
      gsap.to(nextRef.current, {
        opacity: 1,
        duration: 2,
        ease: "power2.inOut",
        onComplete: () => {
          setCurrent(nextIdx);
          setNext(null);
        },
      });
      gsap.to(currentRef.current, {
        opacity: 0,
        duration: 2,
        ease: "power2.inOut",
      });
    };

    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, [current, backdrops.length]);

  if (!backdrops.length) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        ref={currentRef}
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${backdrops[current]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {next !== null && (
        <div
          ref={nextRef}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backdrops[next]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0,
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,10,15,0.3) 0%, rgba(10,10,15,0.7) 60%, rgba(10,10,15,0.95) 100%)",
        }}
      />
    </div>
  );
}
