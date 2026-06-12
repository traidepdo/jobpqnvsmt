// src/app/_components/Hero/HeroBg.js
export function HeroBg() {
    return (
        <>
            {/* ── Animated green blobs ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="blob-1 absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.25) 0%, transparent 70%)' }} />
                <div className="blob-2 absolute top-1/3 -right-56 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)' }} />
                <div className="blob-3 absolute -bottom-48 left-1/4 w-[550px] h-[550px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.14) 0%, transparent 70%)' }} />
                <div className="blob-4 absolute top-1/4 left-1/2 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)' }} />
                <div className="blob-5 absolute bottom-1/4 -right-20 w-[450px] h-[450px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' }} />

                {/* Light orbs */}
                <div className="orb-1 absolute top-1/3 left-1/4 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)' }} />
                <div className="orb-2 absolute bottom-1/3 right-1/3 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.22) 0%, transparent 70%)' }} />
                <div className="orb-3 absolute top-2/3 left-2/3 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.2) 0%, transparent 70%)' }} />

                {/* Grid */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(34,197,94,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.3) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

                {/* Particles */}
                <div className="p1 absolute top-[18%] left-[12%] w-1.5 h-1.5 rounded-full bg-green-400/70" />
                <div className="p2 absolute top-[65%] left-[7%] w-1 h-1 rounded-full bg-emerald-300/60" />
                <div className="p3 absolute top-[32%] right-[10%] w-2 h-2 rounded-full bg-lime-400/50" />
                <div className="p4 absolute bottom-[22%] left-[42%] w-1.5 h-1.5 rounded-full bg-green-300/60" />
                <div className="p5 absolute top-[78%] right-[28%] w-1 h-1 rounded-full bg-emerald-400/55" />
                <div className="p6 absolute top-[12%] right-[35%] w-2 h-2 rounded-full bg-green-500/40" />
                <div className="p7 absolute top-[48%] right-[6%] w-1.5 h-1.5 rounded-full bg-lime-300/45" />
                <div className="p8 absolute bottom-[15%] left-[22%] w-1 h-1 rounded-full bg-green-400/50" />
            </div>

            {/* Decorative rings */}
            <div className="spin-ring pointer-events-none absolute w-[900px] h-[900px] rounded-full border border-green-400/[0.05]" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            <div className="spin-ring-r pointer-events-none absolute w-[650px] h-[650px] rounded-full border border-emerald-300/[0.06]" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        </>
    );
}