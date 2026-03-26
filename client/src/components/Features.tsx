import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import blobGradientVideo from "../assets/blob_gradient.mov";

interface FeaturesProps {
  scrollProgress?: number;
}

const Features: React.FC<FeaturesProps> = ({ scrollProgress = 0 }) => {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const video3Ref = useRef<HTMLVideoElement>(null);
  const video4Ref = useRef<HTMLVideoElement>(null);

  // Each phase spans 100 units of scrollProgress
  // p2: Feature 2 (red) slides over Feature 1 (seagreen)      [100-200]
  // p3: Feature 3 (seagreen) slides over Feature 2 (red)      [200-300]
  // p4: Feature 4 (red) slides over Feature 3 (seagreen)      [300-400]
  const p2 = Math.max(0, Math.min(1, scrollProgress / 100));
  const p3 = Math.max(0, Math.min(1, (scrollProgress - 100) / 100));
  const p4 = Math.max(0, Math.min(1, (scrollProgress - 200) / 100));

  useEffect(() => {
    // Only apply 3D mouse reaction on desktop (lg breakpoint: 1024px)
    if (window.innerWidth < 1024) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = clientX / innerWidth - 0.5;
      const y = clientY / innerHeight - 0.5;

      [video1Ref.current, video2Ref.current, video3Ref.current, video4Ref.current].forEach((vid) => {
        if (!vid) return;
        gsap.to(vid, {
          rotateY: x * 30,
          rotateX: -y * 30,
          x: x * 160,
          y: y * 160,
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // White (#FFFFFF) → Red (#FF5458)
  const toRed = (progress: number) => {
    const g = Math.round(255 - (255 - 84) * progress);
    const b = Math.round(255 - (255 - 88) * progress);
    return `rgb(255, ${g}, ${b})`;
  };

  // White (#FFFFFF) → Seagreen (#20B2AA)  [R:32, G:178, B:170]
  const toSeagreen = (progress: number) => {
    const r = Math.round(255 - (255 - 32) * progress);
    const g = Math.round(255 - (255 - 178) * progress);
    const b = Math.round(255 - (255 - 170) * progress);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const BrandContent = ({ title, desc }: { title: string; desc: string }) => (
    <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 z-10 select-none flex flex-col gap-6 text-center lg:left-6 lg:right-auto lg:text-left">
      <h2 className="text-[#F9E95C] font-black text-[8vw] lg:text-[6.5vw] uppercase leading-none opacity-90 tracking-normal antialiased">
        {title}
      </h2>
      <p className="text-[#F9E95C] font-semibold text-[3.5vw] lg:text-[1.4vw] max-w-[550px] opacity-80 leading-relaxed antialiased mx-auto lg:mx-0">
        {desc}
      </p>
    </div>
  );

  return (
    <section
      className="relative w-full h-full overflow-hidden"
      id="features"
      style={{ perspective: "1200px" }}
    >

      {/* ── FEATURE 1 (Seagreen base, always underneath) ── */}
      <div className="absolute inset-0 bg-[#20B2AA] flex items-center justify-center pointer-events-none">
        <BrandContent title="Content-Isolation" desc="Separates content by department for clarity, security, and efficient access." />
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <video ref={video1Ref} src={blobGradientVideo} autoPlay muted loop playsInline
            className="w-[80vw] lg:w-[58vw] max-w-[700px] h-auto object-contain will-change-transform pointer-events-auto" />
        </div>
      </div>

      {/* Feature 1 header — slides up + turns red as F2 enters */}
      <div className="absolute left-0 w-full h-[32px] border-b-2 border-black z-40 flex items-center justify-start px-6"
        style={{ top: `-${p2 * 100}vh`, backgroundColor: toRed(p2) }}>
        <span className="text-black font-bold text-[18px] tracking-tight antialiased">Content-Isolation</span>
      </div>

      {/* ── FEATURE 2 (Red, slides over F1) ── z-30 */}
      <div className="absolute left-0 w-full h-[100vh] bg-[#FF5458] z-30 overflow-hidden pointer-events-none"
        style={{ top: `${(1 - p2) * 100}vh` }}>
        {/* F2 header — slides out upward + turns seagreen as F3 enters */}
        <div className="absolute left-0 w-full h-[32px] border-b-2 border-black z-40 flex items-center justify-start px-6 pointer-events-auto"
          style={{ top: `-${p3 * 100}vh`, backgroundColor: p3 > 0 ? toSeagreen(p3) : toRed(p2) }}>
          <span className="text-black font-bold text-[18px] tracking-tight antialiased">Confidence-Based Refusal System</span>
        </div>
        <BrandContent title="Confidence-Based Refusal System" desc="Refuses uncertain requests based on confidence level, ensuring accurate and reliable responses." />
        <div className="absolute inset-0 flex items-center justify-center z-0"
          style={{ transform: `translateY(${-(1 - p2) * 100}vh)` }}>
          <video ref={video2Ref} src={blobGradientVideo} autoPlay muted loop playsInline
            className="w-[80vw] lg:w-[58vw] max-w-[700px] h-auto object-contain will-change-transform pointer-events-auto" />
        </div>
      </div>

      {/* ── FEATURE 3 (Seagreen, slides over F2) ── z-40 */}
      {p3 > 0 && (
        <div className="absolute left-0 w-full h-[100vh] bg-[#20B2AA] z-40 overflow-hidden pointer-events-none"
          style={{ top: `${(1 - p3) * 100}vh` }}>
          {/* F3 header — slides out upward + turns red as F4 enters */}
          <div className="absolute left-0 w-full h-[32px] border-b-2 border-black z-50 flex items-center justify-start px-6 pointer-events-auto"
            style={{ top: `-${p4 * 100}vh`, backgroundColor: toRed(p4) }}>
            <span className="text-black font-bold text-[18px] tracking-tight antialiased">Exam-Mode Lock</span>
          </div>
          <BrandContent title="Exam-Mode Lock" desc="Locks the system into exam mode, restricting access to ensure a focused and secure testing environment." />
          <div className="absolute inset-0 flex items-center justify-center z-0"
            style={{ transform: `translateY(${-(1 - p3) * 100}vh)` }}>
            <video ref={video3Ref} src={blobGradientVideo} autoPlay muted loop playsInline
              className="w-[80vw] lg:w-[58vw] max-w-[700px] h-auto object-contain will-change-transform pointer-events-auto" />
          </div>
        </div>
      )}

      {/* ── FEATURE 4 (Red, slides over F3) ── z-50 */}
      {p4 > 0 && (
        <div className="absolute left-0 w-full h-[100vh] bg-[#FF5458] z-50 overflow-hidden pointer-events-none"
          style={{ top: `${(1 - p4) * 100}vh` }}>
          {/* F4 header — turns red as it settles */}
          <div className="absolute top-0 left-0 w-full h-[32px] border-b-2 border-black z-50 flex items-center justify-start px-6 pointer-events-auto"
            style={{ backgroundColor: toRed(p4) }}>
            <span className="text-black font-bold text-[18px] tracking-tight antialiased">Faculty-Controlled AI Scope</span>
          </div>
          <BrandContent title="Faculty-Controlled AI Scope" desc="Faculty-controlled AI scope lets instructors define and limit AI usage, ensuring guided and appropriate assistance." />
          <div className="absolute inset-0 flex items-center justify-center z-0"
            style={{ transform: `translateY(${-(1 - p4) * 100}vh)` }}>
            <video ref={video4Ref} src={blobGradientVideo} autoPlay muted loop playsInline
              className="w-[80vw] lg:w-[58vw] max-w-[700px] h-auto object-contain will-change-transform pointer-events-auto" />
          </div>
        </div>
      )}

    </section>
  );
};

export default Features;
