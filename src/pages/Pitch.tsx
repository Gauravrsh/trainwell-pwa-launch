import { motion } from "framer-motion";
import { ArrowRight, Users, Target, TrendingUp, Calendar, Utensils, BarChart3, Star, Zap, UsersRound, CheckCircle2, Clock, Rocket } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

/* ─── Section wrapper ─── */
const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-80px" }}
    variants={stagger}
    className={`min-h-[60vh] flex flex-col justify-center px-6 py-16 md:py-24 max-w-4xl mx-auto ${className}`}
  >
    {children}
  </motion.section>
);

/* ═══════════════════════════════════════════
   1. TITLE
   ═══════════════════════════════════════════ */
const TitleSection = () => (
  <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
    {/* Subtle gradient orb */}
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
    
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
      <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
        <Star className="w-4 h-4 text-primary" />
        <span className="text-sm text-primary font-medium">Founding Team Opportunity</span>
      </div>
    </motion.div>

    <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.1]"
    >
      Join <span className="text-primary">TrainWell</span>
      <br />
      <span className="text-muted-foreground">as Co-Builder</span>
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
    >
      I'm building something that can transform how independent trainers in India grow their careers. 
      I need a co-builder who owns <span className="text-primary font-semibold">Community & Social</span> — and I think that's you.
    </motion.p>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 1 }}
      className="mt-16 flex flex-col items-center gap-2 text-muted-foreground"
    >
      <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
      <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        <ArrowRight className="w-5 h-5 rotate-90" />
      </motion.div>
    </motion.div>
  </section>
);

/* ═══════════════════════════════════════════
   2. THE PROBLEM
   ═══════════════════════════════════════════ */
const ProblemSection = () => (
  <Section>
    <motion.p variants={fadeUp} className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">The Problem</motion.p>
    <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
      Trainers are losing clients.<br />
      <span className="text-muted-foreground">And it's not their fault.</span>
    </motion.h2>
    <motion.p variants={fadeUp} className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
      India's independent personal trainers — the ones doing 1:1 coaching, not gym floor reps — face a brutal reality. Their clients stay 3-6 months, see no results, and drop off. No referrals, no testimonials, no growth.
    </motion.p>

    <motion.div variants={stagger} className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { stat: "3-6 mo", label: "Average client retention", icon: Clock },
        { stat: "₹40K-1.5L", label: "Monthly trainer earnings at stake", icon: TrendingUp },
        { stat: "0", label: "Tools built for this trainer", icon: Target },
      ].map((item) => (
        <motion.div
          key={item.label}
          variants={fadeUp}
          className="bg-card border border-border rounded-xl p-6 text-center"
        >
          <item.icon className="w-6 h-6 text-primary mx-auto mb-3" />
          <p className="text-3xl font-bold text-foreground">{item.stat}</p>
          <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
        </motion.div>
      ))}
    </motion.div>
  </Section>
);

/* ═══════════════════════════════════════════
   3. THE SOLUTION
   ═══════════════════════════════════════════ */
const SolutionSection = () => (
  <Section>
    <motion.p variants={fadeUp} className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">The Solution</motion.p>
    <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
      Whatever gets tracked,<br />
      <span className="text-primary">gets done.</span>
    </motion.h2>
    <motion.p variants={fadeUp} className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
      TrainWell is a dead-simple tool that gets trainers and clients to log every workout and every meal, every single day. 
      The calendar becomes a mirror — showing up green or red. No hiding, no excuses.
    </motion.p>

    <motion.div variants={stagger} className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { icon: Calendar, title: "Daily Calendar", desc: "Color-coded workout & diet tracking. Green = done. Red = missed. The mirror doesn't lie." },
        { icon: Utensils, title: "Food Logging", desc: "AI-powered meal analysis. Log what you eat, see calories & macros instantly." },
        { icon: BarChart3, title: "Progress Charts", desc: "Weight trends, calorie balance, workout consistency — all visible at a glance." },
      ].map((item) => (
        <motion.div
          key={item.title}
          variants={fadeUp}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <item.icon className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
        </motion.div>
      ))}
    </motion.div>

    <motion.div variants={fadeUp} className="mt-8 bg-card border border-primary/20 rounded-xl p-6">
      <p className="text-muted-foreground leading-relaxed">
        <span className="text-primary font-semibold">The flywheel:</span> Client logs → sees data → stays accountable → gets results → stays longer → refers others → <span className="text-foreground font-medium">Trainer wins.</span>
      </p>
    </motion.div>
  </Section>
);

/* ═══════════════════════════════════════════
   4. THE TRIAD
   ═══════════════════════════════════════════ */
const TriadSection = () => (
  <Section className="items-center text-center">
    <motion.p variants={fadeUp} className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">The Founding Team</motion.p>
    <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4">
      Three roles.<br />
      <span className="text-muted-foreground">One mission.</span>
    </motion.h2>
    <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-xl mb-12">
      TrainWell isn't a solo act. It takes three complementary builders, each owning a pillar.
    </motion.p>

    {/* Triangle layout */}
    <motion.div variants={fadeUp} className="relative w-full max-w-lg mx-auto" style={{ height: 380 }}>
      {/* Connecting lines via SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 380" fill="none" preserveAspectRatio="xMidYMid meet">
        <line x1="200" y1="40" x2="60" y2="320" stroke="hsl(75 100% 50% / 0.2)" strokeWidth="1.5" strokeDasharray="6 4" />
        <line x1="200" y1="40" x2="340" y2="320" stroke="hsl(75 100% 50% / 0.2)" strokeWidth="1.5" strokeDasharray="6 4" />
        <line x1="60" y1="320" x2="340" y2="320" stroke="hsl(75 100% 50% / 0.2)" strokeWidth="1.5" strokeDasharray="6 4" />
      </svg>

      {/* Top node — Product */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center mb-2">
          <Zap className="w-7 h-7 text-primary" />
        </div>
        <p className="text-foreground font-semibold text-sm">Product & Strategy</p>
        <p className="text-muted-foreground text-xs">Founder</p>
      </div>

      {/* Bottom-left — Community */}
      <div className="absolute left-0 bottom-0 flex flex-col items-center w-32">
        <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-2 ring-4 ring-primary/10">
          <UsersRound className="w-7 h-7 text-primary" />
        </div>
        <p className="text-primary font-bold text-sm">Community & Social</p>
        <p className="text-muted-foreground text-xs">← Your role</p>
      </div>

      {/* Bottom-right — AI */}
      <div className="absolute right-0 bottom-0 flex flex-col items-center w-32">
        <div className="w-16 h-16 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center mb-2">
          <Rocket className="w-7 h-7 text-primary" />
        </div>
        <p className="text-foreground font-semibold text-sm">AI & Automation</p>
        <p className="text-muted-foreground text-xs">Third co-builder</p>
      </div>
    </motion.div>
  </Section>
);

/* ═══════════════════════════════════════════
   5. YOUR ROLE
   ═══════════════════════════════════════════ */
const RoleSection = () => {
  const responsibilities = [
    { title: "Logging Compliance", desc: "Personally ensure every trainer's clients hit 100% daily food and workout logging. This is THE metric." },
    { title: "Trainer Onboarding", desc: "Handhold each new trainer through setup, first client plan, and first week of logging." },
    { title: "Community Engagement", desc: "Workshops, contests, webinars, community sessions — keep trainers connected and motivated." },
    { title: "Social Media Strategy", desc: "Instagram reels, Facebook posts, engagement campaigns. Build the brand trainers want to be part of." },
    { title: "Referral Activation", desc: "Drive trainer-to-trainer referrals. When one trainer succeeds, they bring others." },
    { title: "Feedback Loop", desc: "You're the voice of trainers to product. What's working, what's broken, what they need next." },
  ];

  return (
    <Section>
      <motion.p variants={fadeUp} className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Your Role</motion.p>
      <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
        Community & Social<br />
        <span className="text-muted-foreground">Owner.</span>
      </motion.h2>
      <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
        You're not an employee. You <span className="text-foreground font-medium">own</span> this pillar. 
        The success of every trainer on the platform flows through you.
      </motion.p>

      <motion.div variants={stagger} className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        {responsibilities.map((r) => (
          <motion.div
            key={r.title}
            variants={fadeUp}
            className="flex gap-4 bg-card border border-border rounded-xl p-5"
          >
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-foreground font-semibold text-sm">{r.title}</h3>
              <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{r.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
};

/* ═══════════════════════════════════════════
   6. THE PLAYBOOK
   ═══════════════════════════════════════════ */
const PlaybookSection = () => {
  const phases = [
    {
      phase: "Phase 1: Days 0-90",
      subtitle: "Validate the proposition",
      color: "border-primary",
      goals: [
        "Onboard 20 trainers personally",
        "150-200 active clients logging daily",
        "100% logging adherence — the non-negotiable",
        "Run 100% cashback contest for engagement",
        "Validate product-proposition fit",
      ],
    },
    {
      phase: "Phase 2: Days 90-180",
      subtitle: "Prove product-market fit",
      color: "border-primary/50",
      goals: [
        "Scale to 500 paying trainers",
        "Prove retention: clients staying 12+ months",
        "Community self-sustains with trainer referrals",
        "Data shows clear correlation: logging → results → retention",
        "We know we have PMF — or we pivot",
      ],
    },
  ];

  return (
    <Section>
      <motion.p variants={fadeUp} className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">The Playbook</motion.p>
      <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
        180 days to<br />
        <span className="text-primary">product-market fit.</span>
      </motion.h2>
      <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
        We're not guessing. Here's the roadmap — and your role is central to every milestone.
      </motion.p>

      <motion.div variants={stagger} className="mt-10 space-y-6">
        {phases.map((p) => (
          <motion.div
            key={p.phase}
            variants={fadeUp}
            className={`bg-card border-l-4 ${p.color} rounded-xl p-6`}
          >
            <h3 className="text-xl font-bold text-foreground">{p.phase}</h3>
            <p className="text-muted-foreground text-sm mb-4">{p.subtitle}</p>
            <ul className="space-y-2">
              {p.goals.map((g) => (
                <li key={g} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground text-sm">{g}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>

      {/* Trainer nurturing diagram */}
      <motion.div variants={fadeUp} className="mt-8 bg-card border border-border rounded-xl p-6">
        <p className="text-foreground font-semibold mb-3">Your daily rhythm:</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">You</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          {["T1", "T2", "T3", "T4", "T5", "T6"].map((t) => (
            <span key={t} className="bg-secondary text-foreground px-3 py-1 rounded-full">{t}</span>
          ))}
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">each with 5-15 clients</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-primary font-medium">100% logging</span>
        </div>
      </motion.div>
    </Section>
  );
};

/* ═══════════════════════════════════════════
   7. COMPENSATION
   ═══════════════════════════════════════════ */
const CompensationSection = () => (
  <Section>
    <motion.p variants={fadeUp} className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Compensation</motion.p>
    <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
      Founding opportunity.<br />
      <span className="text-muted-foreground">Not a job listing.</span>
    </motion.h2>

    <motion.div variants={stagger} className="mt-10 space-y-4">
      <motion.div variants={fadeUp} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-foreground font-semibold">Months 0-6: Validation Phase</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          A monthly stipend to cover your basics while we validate product-market fit together. 
          This isn't a salary — it's a safety net while we build something bigger.
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="bg-card border border-primary/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-foreground font-semibold">Post-PMF: Growth Phase</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Once we prove PMF, we sit down and structure a proper compensation package — 
          <span className="text-foreground font-medium"> salary + company equity</span>. 
          You're a co-builder from day one, and the upside reflects that.
        </p>
      </motion.div>
    </motion.div>

    <motion.div variants={fadeUp} className="mt-6 bg-primary/5 border border-primary/10 rounded-xl p-5">
      <p className="text-muted-foreground text-sm leading-relaxed italic">
        "I'm not offering you a job. I'm offering you a seat at the table before the table gets crowded. 
        The product is built. The first trainers are signing up. What's missing is someone who can own the community side with the same intensity I bring to product."
      </p>
    </motion.div>
  </Section>
);

/* ═══════════════════════════════════════════
   8. WHY NOW
   ═══════════════════════════════════════════ */
const WhyNowSection = () => (
  <Section>
    <motion.p variants={fadeUp} className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Why Now</motion.p>
    <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
      The product is live.<br />
      <span className="text-primary">The window is open.</span>
    </motion.h2>

    <motion.div variants={stagger} className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { icon: CheckCircle2, text: "Full app built and deployed — calendar, logging, progress tracking, plans, payments" },
        { icon: Users, text: "First trainers are onboarding and setting up client plans" },
        { icon: Target, text: "No competitor is solving this specific problem for independent Indian PTs" },
        { icon: Star, text: "Ground floor — join before anyone else does" },
      ].map((item, i) => (
        <motion.div key={i} variants={fadeUp} className="flex gap-4 items-start">
          <item.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-foreground text-sm leading-relaxed">{item.text}</p>
        </motion.div>
      ))}
    </motion.div>
  </Section>
);

/* ═══════════════════════════════════════════
   9. CTA
   ═══════════════════════════════════════════ */
const CTASection = () => (
  <section className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center relative">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
    
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={stagger}
      className="relative z-10"
    >
      <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
        Let's build this<br />
        <span className="text-primary">together.</span>
      </motion.h2>
      <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
        If this resonates, let's talk next steps. No pressure — just a conversation between two people who want to build something meaningful.
      </motion.p>
      <motion.div variants={fadeUp} className="mt-8">
        <a
          href="mailto:contact@trainwell.app"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors"
        >
          Let's Talk <ArrowRight className="w-4 h-4" />
        </a>
      </motion.div>
    </motion.div>

    {/* Footer */}
    <motion.p
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="absolute bottom-8 text-xs text-muted-foreground"
    >
      TrainWell © 2025 — Whatever gets tracked, gets done.
    </motion.p>
  </section>
);

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
const Pitch = () => (
  <div className="bg-background text-foreground min-h-screen overflow-x-hidden">
    <TitleSection />
    <ProblemSection />
    <SolutionSection />
    <TriadSection />
    <RoleSection />
    <PlaybookSection />
    <CompensationSection />
    <WhyNowSection />
    <CTASection />
  </div>
);

export default Pitch;
