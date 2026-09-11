import { Link } from 'react-router-dom'
import { Sparkles, ShieldCheck, Users, ArrowRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F7F3EB] text-black antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F7F3EB]/90 backdrop-blur-xl border-b-[1px] border-black">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 h-[150px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ChombuTar" className="w-[150px] h-[150px] object-contain" />
          </div>
          
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-[1200px] px-4 md:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20 text-justify">
          
          <h1 className="text-[30px] sm:text-[50px] font-black tracking-[-0.02em] leading-[1.05] max-w-[820px] mx-auto">
            A talent-Client marketplace built for real work, real pay. No noise, no luck, just perfect matches.
          </h1>
          
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
