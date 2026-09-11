import { Link } from 'react-router-dom'
import { Sparkles, ShieldCheck, Users, ArrowRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F7F3EB] text-black antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F7F3EB]/90 backdrop-blur-xl border-b-[1.5px] border-black">
                       <div className="mx-auto max-w-[1200px] px-4 md:px-6 h-36 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ChombuTar" className="w-36 h-36 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="hidden sm:inline-flex px-4 h-[36px] items-center rounded-full text-[13px] font-semibold text-black/70 hover:text-black transition"
            >
              Log in
            </Link>
            <Link
              to="/auth"
              className="inline-flex px-4 h-[36px] items-center rounded-full bg-black text-white text-[13px] font-semibold hover:bg-zinc-800 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-[1200px] px-4 md:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-[1.5px] border-black text-[11px] font-bold tracking-widest mb-6">
            <Sparkles size={12} />
            OWN YOUR SPOTLIGHT
          </div>
          <h1 className="text-[36px] sm:text-[56px] font-black tracking-[-0.02em] leading-[1.05] max-w-[820px] mx-auto">
            The talent marketplace built for real work, real pay.
          </h1>
          <p className="mt-5 text-[15px] sm:text-[17px] text-black/60 max-w-[560px] mx-auto leading-relaxed">
            Showcase your skills, discover collaborators, and get paid safely — every booking on
            ChombuTar is protected by escrow from the first message to final delivery.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 h-[48px] rounded-full bg-black text-white text-[14px] font-bold tracking-wide hover:bg-zinc-800 transition"
            >
              Create your profile
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center px-6 h-[48px] rounded-full bg-white border-[1.5px] border-black text-[14px] font-bold hover:bg-black hover:text-white transition"
            >
              Browse talent
            </Link>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mx-auto max-w-[1200px] px-4 md:px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureCard
              icon={Users}
              title="Wear multiple hats"
              body="One account, many professional identities. Switch between Creator and Employer views instantly."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Escrow-protected bookings"
              body="Funds are held securely and released only on confirmed delivery — for both sides of the deal."
            />
            <FeatureCard
              icon={Sparkles}
              title="A showroom that sells you"
              body="Portfolio, ratings, and bookings in one clean profile that clients can browse and filter."
            />
          </div>
        </section>

        {/* CTA band */}
        <section className="border-t-[1.5px] border-black bg-white">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-14 text-center">
            <h2 className="text-[22px] sm:text-[28px] font-black tracking-tight">
              Ready to own your spotlight?
            </h2>
            <p className="mt-2 text-[14px] text-black/60">
              Join ChombuTar and start booking — or getting booked — today.
            </p>
            <Link
              to="/auth"
              className="mt-6 inline-flex items-center gap-2 px-6 h-[48px] rounded-full bg-black text-white text-[14px] font-bold tracking-wide hover:bg-zinc-800 transition"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-4 md:px-6 py-8 text-center text-[11px] text-black/40">
        © 2026 ChombuTar • Own Your Spotlight
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, body }) {
  return (
    <div className="rounded-[20px] bg-white border-[1.5px] border-black p-5 text-left">
      <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center mb-4">
        <Icon size={16} />
      </div>
      <div className="font-semibold text-[15px] tracking-tight">{title}</div>
      <p className="mt-1.5 text-[13px] text-black/60 leading-relaxed">{body}</p>
    </div>
  )
}
