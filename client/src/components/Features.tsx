import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import blobGradientVideo from '../assets/blob_gradient.mov';

const Features: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Only apply 3D mouse reaction on desktop (lg breakpoint: 1024px)
    if (window.innerWidth < 1024) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!videoRef.current) return;

      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Calculate normalized coordinates from center (-0.5 to 0.5)
      const x = (clientX / innerWidth) - 0.5;
      const y = (clientY / innerHeight) - 0.5;

      // Animate video with tilt and slight translation
      gsap.to(videoRef.current, {
        rotateY: x * 30, 
        rotateX: -y * 30, 
        x: x * 160, // Increased horizontal displacement
        y: y * 160, // Increased vertical displacement
        duration: 0.8,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section 
      className="relative w-full h-full bg-[#20B2AA] flex items-center justify-center overflow-hidden"
      id="features"
      style={{ perspective: '1200px' }} // Add perspective for 3D depth
    >
      {/* Slim white box at the top with black border */}
      <div className="absolute top-0 left-0 w-full h-[32px] bg-white border-b-2 border-black z-50" />

      {/* Centered Loop Video with 3D Mouse Reaction */}
      <video
        ref={videoRef}
        src={blobGradientVideo}
        autoPlay
        muted
        loop
        playsInline
        className="relative z-0 w-[80vw] lg:w-[58vw] max-w-[700px] h-auto object-contain will-change-transform"
      />
    </section>
  );
};

export default Features;
