import React from 'react';

const Features: React.FC = () => {
  return (
    <section 
      className="relative w-full h-full bg-[#20B2AA] flex flex-col items-center justify-center py-20 px-8"
      id="features"
    >
      <div className="relative z-10 w-full max-w-[1200px] text-center">
        <h2 className="text-[#F9E95C] font-extrabold text-[42px] md:text-[84px] tracking-tighter leading-none mb-12">
          Revolutionary <br /> Features.
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "AI Assistance", desc: "Intelligent study help at your fingertips." },
            { title: "Immersive Notes", desc: "Interactive note-taking with media enrichment." },
            { title: "Adaptive Learning", desc: "Content that grows with your understanding." }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 text-left hover:scale-[1.05] transition-all cursor-default group">
              <h3 className="text-[#F9E95C] font-bold text-[24px] mb-4 transition-colors group-hover:text-white">{feature.title}</h3>
              <p className="text-[#F9E95C]/80 text-[16px]">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
