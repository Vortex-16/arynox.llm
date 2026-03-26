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
      {/* Slim white box at the top with black border and centered branding text */}
      <div className="absolute top-0 left-0 w-full h-[32px] bg-white border-b-2 border-black z-50 flex items-center justify-start px-6">
        <span className="text-black font-bold text-[18px] tracking-tight antialiased">
          Content-Isolation
        </span>
      </div>

      {/* Signature Text: Middle-left, #F9E95C aligned with header padding */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 pointer-events-none select-none flex flex-col gap-6">
        <h2 className="text-[#F9E95C] font-black text-[8vw] lg:text-[6.5vw] uppercase leading-none opacity-90 tracking-normal antialiased">
          Content<br />Isolation
        </h2>
        <p className="text-[#F9E95C] font-semibold text-[2.2vw] lg:text-[1.4vw] max-w-[550px] opacity-80 leading-relaxed antialiased">
          Separates content by department for clarity,<br />security, and efficient access.
        </p>
      </div>

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
