import React from "react";
import { Link } from "react-router-dom";
import logoSvg from "../assets/logo.svg";

interface TeamMembersProps {
  scrollProgress?: number;
  footerProgress?: number;
}

const TeamMembers: React.FC<TeamMembersProps> = ({ scrollProgress = 0, footerProgress = 0 }) => {
  const cl = (v: number) => Math.max(0, Math.min(1, v));

  // Phase 1: Grid divider lines draw (0-200)
  const line1P = cl(scrollProgress / 100);
  const line2P = cl((scrollProgress - 100) / 100);

  // Phase 2: Letters appear (200-500)
  const rP = cl((scrollProgress - 200) / 100);
  const aP = cl((scrollProgress - 300) / 100);
  const gP = cl((scrollProgress - 400) / 100);

  // Phase 3: Full names reveal (500-800)
  const rNameP = cl((scrollProgress - 500) / 100);
  const aNameP = cl((scrollProgress - 600) / 100);
  const gNameP = cl((scrollProgress - 700) / 100);

  // Phase 4: Role reveal (800-1100)
  const rRoleP = cl((scrollProgress - 800) / 100);
  const aRoleP = cl((scrollProgress - 900) / 100);
  const gRoleP = cl((scrollProgress - 1000) / 100);

  const members = [
    { letter: "R", letterP: rP, name: "Rajdeep Das",      nameP: rNameP, role: "UI/UX",   roleP: rRoleP },
    { letter: "A", letterP: aP, name: "Ayush Chowdhury",  nameP: aNameP, role: "Backend",  roleP: aRoleP },
    { letter: "G", letterP: gP, name: "Vikash Kr. Gupta", nameP: gNameP, role: "AI Model", roleP: gRoleP },
  ];

  const dividerPs = [line1P, line2P];

  return (
    <section
      className="relative w-full h-full bg-[#20B2AA] overflow-hidden"
      id="team"
    >
      {/* Slim white header bar */}
      <div className="absolute top-0 left-0 w-full h-[32px] bg-white border-b-2 border-black z-50 flex items-center justify-start px-6">
        <span className="text-black font-bold text-[18px] tracking-tight antialiased">
          Meet the crew
        </span>
      </div>

      {/* Grid area — sits below 32px header */}
      <div className="absolute left-0 right-0 bottom-0" style={{ top: "32px" }}>
        
        {/* Desktop: 3 columns | Mobile/Tablet: 3 rows stacked */}
        <div className="relative flex flex-col lg:flex-row h-full w-full">

          {members.map(({ letter, letterP, name, nameP, role, roleP }, i) => (
            <React.Fragment key={i}>

              {/* Cell */}
              <div className="relative flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  {/* Large letter */}
                  <span
                    className="font-black text-[#F9E95C] text-[28vw] lg:text-[9vw] leading-none select-none"
                    style={{ opacity: letterP }}
                  >
                    {letter}
                  </span>
                  {/* Full name */}
                  <span
                    className="font-bold text-[#F9E95C] text-[4vw] lg:text-[1.6vw] tracking-wide antialiased text-center"
                    style={{ opacity: nameP }}
                  >
                    {name}
                  </span>
                  {/* Role */}
                  <span
                    className="font-semibold text-[#F9E95C] text-[3vw] lg:text-[1.1vw] tracking-widest uppercase antialiased text-center opacity-80"
                    style={{ opacity: roleP * 0.8 }}
                  >
                    {role}
                  </span>
                </div>
              </div>

              {/* Dividers between cells */}
              {i < 2 && (
                <>
                  {/* Desktop: vertical line grows top-to-bottom */}
                  <div
                    className="hidden lg:block absolute top-0 w-[2px] overflow-hidden"
                    style={{ left: `${(i + 1) * 33.333}%`, height: "100%" }}
                  >
                    <div
                      className="w-full bg-black"
                      style={{ height: `${dividerPs[i] * 100}%` }}
                    />
                  </div>

                  {/* Mobile/Tablet: horizontal line grows left-to-right */}
                  <div className="lg:hidden overflow-hidden h-[2px] w-full">
                    <div
                      className="h-full bg-black"
                      style={{ width: `${dividerPs[i] * 100}%` }}
                    />
                  </div>
                </>
              )}

            </React.Fragment>
          ))}

        </div>
      </div>

      {/* ── FOOTER LAYER (black, slides up over Team Members) ── */}
      {footerProgress > 0 && (
        <div
          className="absolute left-0 w-full h-full bg-black z-50 flex flex-col items-center justify-between px-8 py-12"
          style={{ top: `${(1 - footerProgress / 100) * 100}vh` }}
        >
          {/* Logo with Login/SignUp — single row */}
          <div className="flex items-center justify-center gap-6 w-full">
            <Link to="/login" className="px-8 py-3 rounded-full border border-[#F9E95C]/30 text-[#F9E95C] hover:bg-[#F9E95C] hover:text-[#FF5458] transition-all font-bold text-[15px] shadow-lg backdrop-blur-sm">Login</Link>
            <img src={logoSvg} alt="Arynox Logo" className="w-[140px] lg:w-[200px] h-auto opacity-90" />
            <Link to="/signup" className="px-6 py-3 md:px-8 rounded-full bg-[#F9E95C] text-[#FF5458] shadow-xl hover:bg-white hover:scale-[1.05] transition-all font-bold text-[15px] whitespace-nowrap">Sign Up</Link>
          </div>

          {/* Nav links — left / center / right */}
          <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-6 lg:gap-0 w-full max-w-4xl">
            {[
              { label: "Terms of Use",   href: "/terms.pdf"   },
              { label: "Privacy Policy", href: "/privacy.pdf" },
              { label: "GDPR Notice",    href: "/gdpr.pdf"    },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative overflow-hidden group inline-block px-4 py-2"
              >
                {/* #FF5458 rectangle that rises from bottom on hover */}
                <span className="absolute inset-0 bg-[#FF5458] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 text-[#F9E95C] font-semibold text-[3.5vw] lg:text-[1.3vw] tracking-wide">
                  {label}
                </span>
              </a>
            ))}
          </div>

          {/* Copyright — bottom */}
          <p className="text-[#F9E95C] text-[2.5vw] lg:text-[0.85vw] font-medium tracking-widest text-center opacity-70">
            © ARYNOX.LLM ALL RIGHTS RESERVED 2026
          </p>
        </div>
      )}

    </section>
  );
};

export default TeamMembers;
