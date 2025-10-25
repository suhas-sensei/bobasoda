'use client';

import { BottomNavbar } from "@/components/BottomNavbar";

export default function Profile() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
      {/* Background gradient for desktop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />

      {/* Phone screen container */}
      <div className="relative w-full max-w-[550px] h-screen bg-[#08060b] shadow-2xl">
        {/* Phone screen gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />

        {/* Content */}
        <div className="relative w-full h-full flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white">Profile</h1>
        </div>

        {/* Bottom Navigation Bar */}
        <BottomNavbar />
      </div>
    </div>
  );
}
