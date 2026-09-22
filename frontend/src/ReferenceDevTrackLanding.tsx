import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  FolderGit2,
  Github,
  GitPullRequest,
  Plus,
  Quote,
  Search,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import './reference-landing.css';
import './reference-refinements.css';

type Props = { onNavigateToDashboard?: () => void };

const weeks = Array.from({ length: 84 }, (_, index) => (index * 11 + index * index * 3) % 5);

const featureCards = [
  { icon: <BarChart3 />, title: 'GitHub Analytics', text: 'Visualise your commits, contributions and coding habits over time.' },
  { icon: <FolderGit2 />, title: 'Repository Overview', text: 'Get a clear view of your projects and contributions in one place.' },
  { icon: <Target />, title: 'Progress Tracking', text: 'Set goals, track milestones and stay consistent.' },
  { icon: <Activity />, title: 'Activity Heatmaps', text: 'See your coding activity patterns beautifully visualised.' },
  { icon: <Award />, title: 'Achievements', text: 'Unlock milestones and celebrate your progress.' },
  { icon: <Users />, title: 'Personalised Dashboard', text: 'A clean, focused space built for developers.' },
];

type ConstellationPoint = { x: number; y: number };
type ConstellationBurst = { startedAt: number; x: number; y: number; points: ConstellationPoint[] };

function ClickConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const bursts: ConstellationBurst[] = [];
    let frameId = 0;
    const duration = 900;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let index = bursts.length - 1; index >= 0; index -= 1) {
        const burst = bursts[index];
        const progress = Math.min((time - burst.startedAt) / duration, 1);
        const opacity = (1 - progress) * .78;
        const scale = .22 + progress * .92;
        const points = burst.points.map(point => ({
          x: burst.x + (point.x - burst.x) * scale,
          y: burst.y + (point.y - burst.y) * scale,
        }));

        context.lineWidth = 1;
        context.strokeStyle = `rgba(178, 111, 255, ${opacity * .55})`;
        points.forEach((point, pointIndex) => {
          const next = points[(pointIndex + 1) % points.length];
          context.beginPath();
          context.moveTo(burst.x, burst.y);
          context.lineTo(point.x, point.y);
          context.lineTo(next.x, next.y);
          context.stroke();
        });

        points.forEach(point => {
          context.beginPath();
          context.fillStyle = `rgba(220, 189, 255, ${opacity})`;
          context.shadowBlur = 12;
          context.shadowColor = 'rgba(139, 75, 255, .95)';
          context.arc(point.x, point.y, 2.1 * (1 - progress * .45), 0, Math.PI * 2);
          context.fill();
        });
        context.shadowBlur = 0;

        if (progress === 1) bursts.splice(index, 1);
      }
      if (bursts.length) frameId = requestAnimationFrame(draw);
      else frameId = 0;
    };

    const createBurst = (event: PointerEvent) => {
      const count = 9;
      const points = Array.from({ length: count }, (_, index) => {
        const angle = (Math.PI * 2 * index) / count + Math.random() * .45;
        const distance = 38 + Math.random() * 66;
        return { x: event.clientX + Math.cos(angle) * distance, y: event.clientY + Math.sin(angle) * distance };
      });
      bursts.push({ startedAt: performance.now(), x: event.clientX, y: event.clientY, points });
      if (!frameId) frameId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointerdown', createBurst);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', createBurst);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="dt-click-constellation" aria-hidden="true" />;
}

export const DevTrackLanding: React.FC<Props> = ({ onNavigateToDashboard }) => {
  const { isAuthenticated, loginWithGithub } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [featuresRequested, setFeaturesRequested] = useState(false);
  const [whyRequested, setWhyRequested] = useState(false);
  const [testimonialsRequested, setTestimonialsRequested] = useState(false);
  const [faqRequested, setFaqRequested] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const start = () => {
    if (isAuthenticated) onNavigateToDashboard?.();
    else loginWithGithub();
  };

  return (
    <main className="dt-page">
      <ClickConstellation />
      <div className="dt-orbit" aria-hidden="true" />
      <div className="dt-planet" aria-hidden="true" />

      <header className={`dt-nav ${scrolled ? 'dt-nav--scrolled' : ''}`}>
        <a className="dt-logo" href="#top" aria-label="DevTrack home">
          <Code2 size={39} strokeWidth={2.5} />
          <span>DevTrack</span>
        </a>
        <nav className="dt-nav-links" aria-label="Main navigation">
          <a href="#features" onClick={() => setFeaturesRequested(true)}>Features</a>
          <a href="#why" onClick={() => setWhyRequested(true)}>Why DevTrack</a>
          <a href="#testimonials" onClick={() => setTestimonialsRequested(true)}>Testimonials</a>
          <a href="#faq" onClick={() => setFaqRequested(true)}>FAQ</a>
        </nav>
        <div className="dt-nav-actions">
          <button className="dt-theme" aria-label="Toggle theme">☼</button>
          <button className="dt-sign-in" onClick={start}>Sign in</button>
          <button className="dt-get-started" onClick={start}>Get Started <span>→</span></button>
        </div>
        <button className="dt-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Menu">☰</button>
        {menuOpen && <nav className="dt-mobile-menu"><a href="#features" onClick={() => { setFeaturesRequested(true); setMenuOpen(false); }}>Features</a><a href="#why" onClick={() => { setWhyRequested(true); setMenuOpen(false); }}>Why DevTrack</a><a href="#testimonials" onClick={() => { setTestimonialsRequested(true); setMenuOpen(false); }}>Testimonials</a><a href="#faq" onClick={() => { setFaqRequested(true); setMenuOpen(false); }}>FAQ</a><button onClick={start}>Get Started →</button></nav>}
      </header>

      <section id="top" className="dt-hero">
        <div className="dt-copy">
          <span className="dt-eyebrow">YOUR CODING JOURNEY, VISUALISED</span>
          <h1>Track. Analyse.<br /><em>Grow.</em></h1>
          <p>Turn your GitHub activity into meaningful insights. Stay consistent, build better habits, and become the developer you want to be.</p>
          <div className="dt-hero-actions">
            <button className="dt-github-button" onClick={start}><Github size={23} fill="currentColor" /> Continue with GitHub <span>→</span></button>
            <a href="#features" className="dt-learn-button"><span className="dt-play">▶</span> Learn more</a>
          </div>
          <div className="dt-proof">
            <div><strong>10K+</strong><span>Developers</span></div>
            <div><strong>50M+</strong><span>Commits Tracked</span></div>
            <div><strong>4.9/5</strong><span>User Rating</span></div>
          </div>
        </div>

        <DashboardMockup />
        <p className="dt-side-copy">Build<br />Track<br />Improve<br />Repeat</p>
        <aside className="dt-reminder"><b>ϟ</b><span>Consistency<br />today, a brighter<br />tomorrow.</span></aside>
      </section>

      <FeaturesSection forceVisible={featuresRequested} />

      <WhyDevTrackSection forceVisible={whyRequested} />
      <TestimonialsSection forceVisible={testimonialsRequested} />
      <FaqSection forceVisible={faqRequested} />
    </main>
  );
};

function FeaturesSection({ forceVisible }: { forceVisible: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: .18 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const isVisible = inView || forceVisible;
  return (
    <section id="features" ref={sectionRef} className={`dt-features-section ${isVisible ? 'is-visible' : ''}`} aria-label="Product features">
      <header className="dt-features-heading">
        <span>FEATURES</span>
        <h2>Everything you need<br />to track your <em>developer journey.</em></h2>
        <p>Powerful tools, simple insights, real progress.</p>
      </header>
      <div className="dt-feature-grid">
        {featureCards.map((feature, index) => (
          <button
            className={`dt-feature-card ${selectedCard === index ? 'is-selected' : ''}`}
            key={feature.title}
            onClick={() => setSelectedCard(selectedCard === index ? null : index)}
            aria-pressed={selectedCard === index}
          >
            <span className="dt-feature-card-icon">{feature.icon}</span>
            <strong>{feature.title}</strong>
            <p>{feature.text}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

const whyCards = [
  { icon: <BarChart3 />, title: 'Meaningful Insights', text: 'Turn your GitHub activity into clear, visual analytics. See your progress, streaks, and growth over time.' },
  { icon: <Target />, title: 'Stay Consistent', text: 'Build better coding habits with personalised insights and gentle nudges that keep you on track.' },
  { icon: <FolderGit2 />, title: 'All Your Work, In One Place', text: 'Get a complete view of your repositories, contributions, and activity — without switching between multiple tools.' },
  { icon: <Users />, title: 'Grow Together', text: 'Be part of a community of developers. Share your journey, get inspired, and keep pushing forward.' },
];

function WhyDevTrackSection({ forceVisible }: { forceVisible: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [sceneActive, setSceneActive] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: .14 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const visible = inView || forceVisible;
  const card = (item: typeof whyCards[number], index: number) => (
    <button
      className={`dt-why-card ${selectedCard === index ? 'is-selected' : ''}`}
      key={item.title}
      onClick={() => setSelectedCard(selectedCard === index ? null : index)}
      aria-pressed={selectedCard === index}
    >
      <span className="dt-why-card-icon">{item.icon}</span>
      <span><strong>{item.title}</strong><p>{item.text}</p></span>
    </button>
  );

  return (
    <section id="why" ref={sectionRef} className={`dt-why-section ${visible ? 'is-visible' : ''}`} aria-label="Why DevTrack">
      <header className="dt-why-heading">
        <span>WHY DEVTRACK</span>
        <h2>Built for Developers,<br />Who Want <em>More.</em></h2>
        <p>DevTrack turns your <b>GitHub activity</b> into meaningful insights,<br />so you can stay consistent, build better habits, and grow with purpose.</p>
      </header>
      <div className="dt-why-layout">
        <div className="dt-why-card-stack dt-why-card-stack--left">{card(whyCards[0], 0)}{card(whyCards[1], 1)}</div>
        <div className={`dt-why-moon-scene ${sceneActive ? 'is-active' : ''}`} onClick={() => setSceneActive(!sceneActive)} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setSceneActive(!sceneActive); }} aria-label="Animate the DevTrack orbit scene">
          <span className="dt-why-orbit dt-why-orbit--one" /><span className="dt-why-orbit dt-why-orbit--two" /><span className="dt-why-orbit dt-why-orbit--three" />
          <div className="dt-why-moon"><img src="/assets/hero-moon-purple-v3.png" alt="" /><Code2 /></div>
        </div>
        <div className="dt-why-card-stack dt-why-card-stack--right">{card(whyCards[2], 2)}{card(whyCards[3], 3)}</div>
      </div>
    </section>
  );
}

type Testimonial = { name: string; role: string; quote: string; avatar?: string };

// Add a photo by setting `avatar` (e.g. '/assets/testimonials/meera.jpg'). Without one, initials are shown.
const testimonials: Testimonial[] = [
  { name: 'Meera Iyer', role: 'DevOps Enthusiast', quote: 'DevTrack keeps me accountable. Seeing my contribution graph grow every week is so satisfying!' },
  { name: 'Karan Verma', role: 'Software Engineer', quote: 'DevTrack has completely changed how I stay consistent. The visual analytics make my progress feel real and motivating!' },
  { name: 'Sneha Rao', role: 'Open Source Contributor', quote: 'Minimal, intuitive and super useful. Exactly what the developer community needed.' },
  { name: 'Arjun Nair', role: 'Backend Developer', quote: 'I check my streak every morning now. It is a small nudge that turned into a real habit.' },
  { name: 'Priya Sharma', role: 'Frontend Developer', quote: 'Finally one place for all my repos and activity. No more jumping between tabs to see how I am doing.' },
];

type FaqItem = { question: string; answer: string };

const faqItems: FaqItem[] = [
  {
    question: 'What is DevTrack?',
    answer: 'DevTrack is a developer analytics dashboard that connects to your GitHub account and turns your commits, pull requests and issues into clear, visual insights — so you can see your progress and coding habits at a glance.',
  },
  {
    question: 'Is DevTrack free to use?',
    answer: 'Yes. The core dashboard, contribution heatmap and analytics are free for every developer. We may introduce optional paid tiers for teams down the line, but your personal tracking stays free.',
  },
  {
    question: 'How does DevTrack connect to my GitHub?',
    answer: 'You sign in with GitHub using a secure OAuth connection. DevTrack only requests read access to the repository and activity data it needs to build your dashboard — it never modifies your code or repositories.',
  },
  {
    question: 'Who can use DevTrack?',
    answer: 'Anyone with a GitHub account — students, hobbyists, freelancers and professional teams alike. Whether you are building your first project or shipping to production every day, DevTrack adapts to your workflow.',
  },
  {
    question: 'Is my data safe and secure?',
    answer: 'Absolutely. Your data is encrypted in transit and at rest, and we never sell or share your activity with third parties. You can revoke DevTrack’s GitHub access at any time from your account settings.',
  },
];

const initialsOf = (name: string) => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();

function TestimonialsSection({ forceVisible }: { forceVisible: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState(1); // starts on the second review, like the reference design
  const total = testimonials.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: .14 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const goPrev = () => setActive(current => (current - 1 + total) % total);
  const goNext = () => setActive(current => (current + 1) % total);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') goPrev();
    if (event.key === 'ArrowRight') goNext();
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 45) return;
    if (distance > 0) goPrev();
    else goNext();
  };

  const visible = inView || forceVisible;

  return (
    <section id="testimonials" ref={sectionRef} className={`dt-testi-section ${visible ? 'is-visible' : ''}`} aria-label="Testimonials">
      <div className="dt-testi-decor" aria-hidden="true">
        <span className="dt-testi-orbit dt-testi-orbit--left" />
        <span className="dt-testi-orbit dt-testi-orbit--right" />
        <img className="dt-testi-moon" src="/assets/hero-moon-purple-v3.png" alt="" />
        <span className="dt-testi-spark" style={{ left: '7%', top: '13%' }} />
        <span className="dt-testi-spark dt-testi-spark--slow" style={{ left: '78.5%', top: '16%' }} />
        <span className="dt-testi-spark dt-testi-spark--small" style={{ left: '26%', top: '34%' }} />
        <span className="dt-testi-spark dt-testi-spark--small dt-testi-spark--slow" style={{ left: '93%', top: '72%' }} />
        <svg className="dt-testi-mountains" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dt-ridge-back" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6d3bd6" stopOpacity=".5" />
              <stop offset="1" stopColor="#1a0b45" stopOpacity=".9" />
            </linearGradient>
            <linearGradient id="dt-ridge-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3a1c85" />
              <stop offset="1" stopColor="#090419" />
            </linearGradient>
          </defs>
          <path d="M0 190 L70 150 L120 172 L190 120 L250 160 L330 138 L410 182 L500 150 L590 188 L690 160 L780 196 L870 158 L960 190 L1050 146 L1130 180 L1210 118 L1280 160 L1350 96 L1410 140 L1440 120 L1440 320 L0 320 Z" fill="url(#dt-ridge-back)" />
          <path d="M0 250 L80 205 L150 232 L230 190 L320 236 L430 214 L540 250 L660 226 L780 258 L900 232 L1010 262 L1120 224 L1200 190 L1270 226 L1340 170 L1400 210 L1440 190 L1440 320 L0 320 Z" fill="url(#dt-ridge-front)" stroke="rgba(176,128,255,.4)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      <header className="dt-testi-heading">
        <span>TESTIMONIALS</span>
        <h2>Loved by <em>developers</em></h2>
      </header>

      <div className="dt-testi-shell" role="region" aria-roledescription="carousel" aria-label="Developer testimonials" onKeyDown={onKeyDown}>
        <div
          className="dt-testi-stage"
          onTouchStart={event => { touchStartX.current = event.touches[0].clientX; }}
          onTouchEnd={onTouchEnd}
        >
          {testimonials.map((item, index) => {
            let offset = (index - active + total) % total;
            if (offset > total / 2) offset -= total; // shortest way round, so the loop wraps smoothly
            const isActive = offset === 0;
            const isNear = Math.abs(offset) === 1;
            return (
              <article
                key={item.name}
                className={`dt-testi-card ${isActive ? 'is-active' : ''} ${!isActive && !isNear ? 'is-far' : ''}`}
                style={{ '--o': offset } as React.CSSProperties}
                aria-hidden={!isActive}
                onClick={() => { if (isNear) setActive(index); }}
              >
                <Quote className="dt-testi-quote-mark" fill="currentColor" strokeWidth={1.5} />
                <div className="dt-testi-stars" role="img" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }, (_, star) => <Star key={star} size={19} fill="currentColor" strokeWidth={0} />)}
                </div>
                <blockquote>{item.quote}</blockquote>
                <footer className="dt-testi-author">
                  <span className="dt-testi-avatar">{item.avatar ? <img src={item.avatar} alt="" /> : initialsOf(item.name)}</span>
                  <span><strong>{item.name}</strong><small>{item.role}</small></span>
                </footer>
              </article>
            );
          })}
        </div>

        <div className="dt-testi-controls">
          <button className="dt-testi-arrow dt-testi-arrow--prev" onClick={goPrev} aria-label="Previous testimonial"><ChevronLeft size={26} strokeWidth={2.4} /></button>
          <div className="dt-testi-dots">
            {testimonials.map((item, index) => (
              <button
                key={item.name}
                className={`dt-testi-dot ${index === active ? 'is-active' : ''}`}
                onClick={() => setActive(index)}
                aria-label={`Show testimonial ${index + 1} of ${total}`}
                aria-current={index === active}
              />
            ))}
          </div>
          <button className="dt-testi-arrow dt-testi-arrow--next" onClick={goNext} aria-label="Next testimonial"><ChevronRight size={26} strokeWidth={2.4} /></button>
        </div>
        <p className="dt-sr-only" aria-live="polite">{`Testimonial ${active + 1} of ${total}, ${testimonials[active].name}`}</p>
      </div>
    </section>
  );
}

function FaqSection({ forceVisible }: { forceVisible: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: .14 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const visible = inView || forceVisible;

  const toggle = (index: number) => setOpenIndex(current => (current === index ? null : index));

  return (
    <section id="faq" ref={sectionRef} className={`dt-faq-section ${visible ? 'is-visible' : ''}`} aria-label="Frequently asked questions">
      <div className="dt-faq-decor" aria-hidden="true">
        <span className="dt-faq-orbit dt-faq-orbit--left" />
        <span className="dt-faq-orbit dt-faq-orbit--right" />
        <span className="dt-faq-spark" style={{ left: '5%', top: '13%' }} />
        <span className="dt-faq-spark dt-faq-spark--slow" style={{ left: '90%', top: '17%' }} />
        <span className="dt-faq-spark dt-faq-spark--small" style={{ left: '13%', top: '46%' }} />
        <span className="dt-faq-spark dt-faq-spark--small dt-faq-spark--slow" style={{ left: '95%', top: '58%' }} />
        <svg className="dt-faq-mountains" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dt-faq-ridge-back" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6d3bd6" stopOpacity=".5" />
              <stop offset="1" stopColor="#1a0b45" stopOpacity=".9" />
            </linearGradient>
            <linearGradient id="dt-faq-ridge-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3a1c85" />
              <stop offset="1" stopColor="#090419" />
            </linearGradient>
          </defs>
          <path d="M0 190 L70 150 L120 172 L190 120 L250 160 L330 138 L410 182 L500 150 L590 188 L690 160 L780 196 L870 158 L960 190 L1050 146 L1130 180 L1210 118 L1280 160 L1350 96 L1410 140 L1440 120 L1440 320 L0 320 Z" fill="url(#dt-faq-ridge-back)" />
          <path d="M0 250 L80 205 L150 232 L230 190 L320 236 L430 214 L540 250 L660 226 L780 258 L900 232 L1010 262 L1120 224 L1200 190 L1270 226 L1340 170 L1400 210 L1440 190 L1440 320 L0 320 Z" fill="url(#dt-faq-ridge-front)" stroke="rgba(176,128,255,.4)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      <header className="dt-faq-heading">
        <span>FAQ</span>
        <h2>Still have <em>questions?</em></h2>
        <p>Find quick answers to the most common questions about DevTrack.<br />Still curious? We’re just a message away.</p>
      </header>

      <div className="dt-faq-list">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div className={`dt-faq-item ${isOpen ? 'is-open' : ''}`} key={item.question}>
              <h3 className="dt-faq-item-heading">
                <button
                  type="button"
                  className="dt-faq-question"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className="dt-faq-toggle-icon">
                    <Plus size={15} strokeWidth={2.6} />
                  </span>
                  <span className="dt-faq-question-text">{item.question}</span>
                  <ChevronDown className="dt-faq-chevron" size={19} strokeWidth={2.2} />
                </button>
              </h3>
              <div
                className="dt-faq-answer-wrap"
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
              >
                <div className="dt-faq-answer-inner">
                  <p className="dt-faq-answer">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="dt-dashboard-wrap" aria-label="DevTrack dashboard preview">
      <div className="dt-dashboard">
        <aside className="dt-sidebar">
          <div className="dt-mini-logo"><Code2 size={23} /> <b>DevTrack</b></div>
          <a className="active"><span>⌂</span> Dashboard</a><a><FolderGit2 size={15} /> Repositories</a><a><Activity size={15} /> Activity</a><a><BarChart3 size={15} /> Analytics</a><a><Users size={15} /> Profile</a>
        </aside>
        <div className="dt-dash-main">
          <div className="dt-dash-top"><div className="dt-search"><Search size={15} /> Search repositories... <kbd>⌘ K</kbd></div><Bell size={18} /><span className="dt-avatar" /></div>
          <div className="dt-welcome"><div><h2>Welcome back, Arushi! <span>👋</span></h2><p>Here’s your GitHub activity at a glance.</p></div><button>Last 7 days⌄</button></div>
          <div className="dt-stats">
            <Stat icon={<FolderGit2 />} label="Repositories" number="18" rise="↑ 12%" />
            <Stat icon={<GitPullRequest />} label="Total Commits" number="462" rise="↑ 5%" />
            <Stat icon={<GitPullRequest />} label="Pull Requests" number="37" rise="↑ 8%" />
            <Stat icon={<Activity />} label="Issues" number="21" rise="↓ 3%" down />
          </div>
          <section className="dt-contributions"><div className="dt-contribution-top"><h3><Github size={21} /> Contribution Activity</h3><button>2025⌄</button></div><div className="dt-months"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span></div><div className="dt-heatmap">{weeks.map((level, i) => <i key={i} className={`dt-level-${level}`} />)}</div><div className="dt-legend">Less <i className="dt-level-1" /><i className="dt-level-2" /><i className="dt-level-3" /><i className="dt-level-4" /> More</div></section>
        </div>
      </div>
      <p className="dt-tagline">“Small commits, big progress.”</p>
    </div>
  );
}

function Stat({ icon, label, number, rise, down }: { icon: React.ReactNode; label: string; number: string; rise: string; down?: boolean }) {
  return <article className="dt-stat"><span className="dt-stat-icon">{icon}</span><div><small>{label}</small><strong>{number}</strong><em className={down ? 'down' : ''}>{rise}</em></div></article>;
}