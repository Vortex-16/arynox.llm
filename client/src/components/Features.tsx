import React from 'react';
import blobGradientVideo from '../assets/blob_gradient.mov';

const Features: React.FC = () => {
  return (
    <section 
      className="relative w-full h-full bg-[#20B2AA] flex items-center justify-center overflow-hidden"
      id="features"
    >
      {/* Slim white box at the top with black border */}
      <div className="absolute top-0 left-0 w-full h-[32px] bg-white border-b-2 border-black z-50" />

      {/* Centered Loop Video */}
      <video
        src={blobGradientVideo}
        autoPlay
        muted
        loop
        playsInline
        className="relative z-0 w-[80vw] lg:w-[58vw] max-w-[700px] h-auto object-contain"
      />
    </section>
  );
};

export default Features;
