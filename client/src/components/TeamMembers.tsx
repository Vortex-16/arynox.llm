import React from "react";

interface TeamMembersProps {
  scrollProgress?: number;
}

const TeamMembers: React.FC<TeamMembersProps> = ({ scrollProgress = 0 }) => {
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
    </section>
  );
};

export default TeamMembers;
