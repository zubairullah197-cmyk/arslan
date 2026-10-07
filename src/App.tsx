import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Mail, Phone, Play, Plus, Trash2 } from 'lucide-react';
import { SmoothCursor } from '@/components/ui/smooth-cursor';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

type RevealProps = { children: ReactNode; className?: string };
type VideoField = 'title' | 'type' | 'video_url' | 'thumbnail_url';
type Video = { id: string; position: number; title: string; type: string; video_url: string | null; thumbnail_url: string | null };

const services = [
  ['01', 'Video Editing', 'Sharp cuts, clean rhythm, and stories that move.'],
  ['02', 'Color Grading', 'A considered palette that gives every frame a pulse.'],
  ['03', 'Motion Graphics', 'Movement with purpose, built to keep eyes locked.'],
  ['04', 'Sound & Pacing', 'The quiet details that make a film feel finished.'],
];

const process = [
  ['01', 'Brief', 'We find the feeling, the audience, and the point.'],
  ['02', 'Rough Cut', 'The first shape of the story gets its momentum.'],
  ['03', 'Refine', 'We sharpen the moments that deserve attention.'],
  ['04', 'Grade & Sound', 'Color and sound bring the final world to life.'],
  ['05', 'Deliver', 'A polished master, ready for wherever it goes next.'],
];

const createBlankVideo = (position: number): Video => ({ id: crypto.randomUUID(), position, title: 'Untitled project', type: 'VIDEO / PLACEHOLDER', video_url: null, thumbnail_url: null });
const blankVideos = () => Array.from({ length: 10 }, (_, index) => createBlankVideo(index + 1));
const ADMIN_EMAIL = 'mack.in@arslan-portfolio.local';

function Reveal({ children, className = '' }: RevealProps) { return <div className={`reveal ${className}`}>{children}</div>; }

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [workProgress, setWorkProgress] = useState(0);
  const [videos, setVideos] = useState<Video[]>(blankVideos);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draftVideos, setDraftVideos] = useState<Video[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [heroTagline, setHeroTagline] = useState('I cut stories that hold attention.');
  const [draftTagline, setDraftTagline] = useState(heroTagline);
  const [editorMessage, setEditorMessage] = useState('');
  const [adminSession, setAdminSession] = useState<Session | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const workSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    const loadVideos = async () => {
      const { data, error } = await supabase.from('portfolio_videos').select('id, position, title, type, video_url, thumbnail_url').order('position');
      if (!active || error) return;
      if (data.length > 0) {
        setVideos(data as Video[]);
        return;
      }
      const initialVideos = blankVideos();
      const { data: created } = await supabase.from('portfolio_videos').insert(initialVideos).select('id, position, title, type, video_url, thumbnail_url').order('position');
      if (active && created) setVideos(created as Video[]);
    };
    void loadVideos();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (active) setAdminSession(data.session);
    };
    void loadSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAdminSession(session);
    });
    return () => { active = false; authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
    const onScroll = () => {
      const currentScroll = window.scrollY;
      setScrolled(currentScroll > 32);
      setScrollY(currentScroll);
      const section = workSectionRef.current;
      if (section) {
        const range = Math.max(section.offsetHeight - window.innerHeight, 1);
        setWorkProgress(Math.min(1, Math.max(0, (currentScroll - section.offsetTop) / range)));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { revealObserver.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [videos.length]);

  const openEditor = () => { setDraftVideos(videos.map((video) => ({ ...video }))); setDraftTagline(heroTagline); setRemovedIds([]); setEditorMessage(''); setLoginUsername(''); setLoginPassword(''); setEditorOpen(true); };
  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditorMessage('');
    if (loginUsername.trim() !== 'mack.in') { setEditorMessage('Incorrect username or password.'); return; }
    setLoginBusy(true);
    let { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: loginPassword });
    if (error) {
      const signup = await supabase.auth.signUp({ email: ADMIN_EMAIL, password: loginPassword });
      if (!signup.error) {
        const retry = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: loginPassword });
        error = retry.error;
      }
    }
    setLoginBusy(false);
    if (error) { setEditorMessage('Incorrect username or password.'); return; }
    setLoginPassword('');
  };
  const handleLogout = async () => { await supabase.auth.signOut(); setEditorOpen(false); };
  const updateVideo = (index: number, field: VideoField, value: string) => { const nextValue = field === 'video_url' || field === 'thumbnail_url' ? value || null : value; setDraftVideos((current) => current.map((video, videoIndex) => videoIndex === index ? { ...video, [field]: nextValue } : video)); };
  const addVideo = () => setDraftVideos((current) => [...current, createBlankVideo(current.length + 1)]);
  const removeVideo = (index: number) => setDraftVideos((current) => current.filter((_, videoIndex) => videoIndex !== index).map((video, videoIndex) => ({ ...video, position: videoIndex + 1 })));
  const saveEditor = async () => {
    const invalidUrl = draftVideos.some((video) => [video.video_url, video.thumbnail_url].some((value) => value && !/^https?:\/\//i.test(value)));
    if (invalidUrl) { setEditorMessage('Use full links beginning with http:// or https://.'); return; }
    const { error: deleteError } = removedIds.length > 0 ? await supabase.from('portfolio_videos').delete().in('id', removedIds) : { error: null };
    const { error: saveError } = await supabase.from('portfolio_videos').upsert(draftVideos.map((video, index) => ({ ...video, position: index + 1 })), { onConflict: 'id' });
    if (deleteError || saveError) { setEditorMessage('Could not save these changes. Please try again.'); return; }
    setVideos(draftVideos.map((video, index) => ({ ...video, position: index + 1 })));
    setRemovedIds([]);
    setHeroTagline(draftTagline);
    setEditorOpen(false);
  };

  return (
    <>
      <SmoothCursor />
      <main>
        <nav className={`site-nav ${scrolled ? 'is-scrolled' : ''}`} aria-label="Primary navigation">
          <a className="nav-mark" href="#top" aria-label="Arslan home">A<span>/</span>M</a>
          <div className="nav-links"><a href="#work">Work</a><a href="#services">Services</a><a href="#process">Process</a><a href="#contact">Contact</a></div>
          <a className="nav-availability" href="mailto:Arslanwork998@gmail.com">Available <span /></a>
        </nav>

        <section className="hero" id="top" style={{ backgroundPosition: `50% ${35 + Math.min(18, scrollY * 0.018)}%` }}>
          <div className="hero-topline"><span>Creative portfolio</span><span>Based in India / Working worldwide</span></div>
          <div className="hero-word-wrap"><h1 className="hero-word" style={{ transform: `translate3d(0, ${scrollY * 0.08}px, 0)` }}>ARSLAN<br /><em>MACK.</em></h1></div>
          <div className="portrait-wrap" style={{ transform: `translate3d(0, ${scrollY * -0.06}px, 0)` }}><img src="/images/me.png" alt="Arslan wearing sunglasses and a black jacket" /><div className="portrait-blur blur-one" /><div className="portrait-blur blur-two" /><div className="portrait-blur blur-three" /><div className="portrait-blur blur-four" /><div className="portrait-blur blur-five" /></div>
          <div className="hero-info"><div className="hero-intro reveal"><p className="eyebrow">I&apos;M ARSLAN</p><h2>VIDEO<br />EDITOR</h2><p className="hero-tagline">{heroTagline}</p></div><div className="hero-side reveal"><div className="service-list"><span>Short-form</span><span>Long-form</span><span>Color Grading</span><span>Motion Graphics</span></div><div className="spin-badge" aria-label="Available for freelance"><span>AVAILABLE FOR FREELANCE · AVAILABLE FOR FREELANCE · </span><b>↘</b></div></div></div>
          <a className="scroll-cue" href="#services"><span>Scroll to explore</span><ArrowDownRight size={16} strokeWidth={1.5} /></a>
        </section>

        <section className="services section-pad" id="services"><div className="section-heading reveal"><p className="eyebrow">01 / WHAT I DO</p><p className="section-note">Editing is more than cutting clips.<br />It&apos;s knowing what to leave out.</p></div><div className="service-card"><div className="service-card-title reveal"><span>Crafted for<br /><em>attention.</em></span><ArrowUpRight size={25} strokeWidth={1.5} /></div><div className="service-columns">{services.map(([number, title, description], index) => <Reveal key={number} className={`stagger-${index + 1}`}><article className="service-item"><span className="item-number">{number}</span><h3>{title}</h3><p>{description}</p></article></Reveal>)}</div></div></section>

        <section className="work section-pad work-section" id="work" ref={workSectionRef}><div className="section-heading reveal"><p className="eyebrow">02 / SELECTED WORK</p><p className="section-note">A moving shelf for the<br />stories we&apos;ll make together.</p></div><div className="work-carousel-shell"><div className="work-carousel-sticky"><div className="work-grid" style={{ transform: `translate3d(${-workProgress * Math.max(0, videos.length - 2.45) * 30}vw, 0, 0)` }}>{videos.map((video, index) => <Reveal key={video.id} className={`stagger-${(index % 5) + 1}`}><a className={`work-card ${index % 3 === 0 ? 'deep' : index % 3 === 1 ? 'dark' : 'light'}`} href={video.video_url || '#contact'} target={video.video_url ? '_blank' : undefined} rel={video.video_url ? 'noreferrer' : undefined} aria-label={`${video.title} project`} style={video.thumbnail_url ? { backgroundImage: `url(${video.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><div className="work-card-top"><span>{String(index + 1).padStart(2, '0')}</span><span>{video.thumbnail_url ? 'THUMBNAIL' : 'ADD THUMBNAIL'}</span></div><div className="work-placeholder"><span className="placeholder-cross">{video.video_url ? <Play size={28} fill="currentColor" /> : '+'}</span><span>{video.video_url ? 'OPEN VIDEO' : <>DROP<br />THUMBNAIL<br />HERE</>}</span></div><div className="work-card-bottom"><span>{video.type}</span><Play size={14} fill="currentColor" /></div><h3>{video.title}</h3></a></Reveal>)}</div></div></div></section>

        <section className="numbers"><div className="numbers-inner">{['00+', '00+', '00+', '00+'].map((stat, index) => <div className="stat reveal" key={index}><strong>{stat}</strong><span>{['Projects completed', 'Happy clients', 'Years editing', 'Stories told'][index]}</span></div>)}</div></section>
        <section className="process section-pad" id="process"><div className="section-heading reveal"><p className="eyebrow">03 / THE PROCESS</p><p className="section-note">Simple steps. Intentional work.<br />No mystery in the middle.</p></div><div className="process-track">{process.map(([number, title, description], index) => <Reveal key={number} className={`process-step stagger-${index + 1}`}><div className="process-dot">{number}</div><h3>{title}</h3><p>{description}</p></Reveal>)}</div></section>
        <section className="contact section-pad" id="contact"><div className="contact-card reveal"><div className="contact-title"><p className="eyebrow">04 / CONTACT</p><h2>Let&apos;s create<br /><em>something.</em></h2></div><div className="contact-details"><p className="contact-copy">Have a story that deserves<br />to be seen? Let&apos;s talk.</p><a href="https://instagram.com/arslan_mack" target="_blank" rel="noreferrer"><span>Instagram</span><strong>@arslan_mack</strong><ArrowUpRight size={17} /></a><a href="tel:+918881372998"><span>Phone</span><strong>+91 88813 72998</strong><Phone size={16} /></a><a href="https://wa.me/918881372998" target="_blank" rel="noreferrer"><span>WhatsApp</span><strong>Text on WhatsApp</strong><ArrowUpRight size={16} /></a><a href="mailto:Arslanwork998@gmail.com"><span>Email</span><strong>Arslanwork998@gmail.com</strong><Mail size={16} /></a><a className="contact-button" href="mailto:Arslanwork998@gmail.com?subject=Let's%20work%20together">Let&apos;s work together <ArrowUpRight size={17} /></a></div></div></section>
        <footer><span>© 2026 Arslan</span><span>Cut with intention.</span><a href="https://instagram.com/arslan_mack" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={13} /></a><button className="edit-trigger" type="button" onClick={openEditor}>Edit</button></footer>
      </main>
      {editorOpen && <div className="editor-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditorOpen(false)}><section className="editor-panel editor-panel-wide" role="dialog" aria-modal="true" aria-labelledby="editor-title">{adminSession ? <><div className="editor-panel-top"><div><p className="eyebrow">Admin panel</p><h2 id="editor-title">Edit portfolio</h2></div><button type="button" onClick={() => setEditorOpen(false)}>Close</button></div><label htmlFor="hero-tagline">Hero tagline</label><input id="hero-tagline" value={draftTagline} onChange={(event) => setDraftTagline(event.target.value)} /> <div className="editor-video-list">{draftVideos.map((video, index) => <div className="editor-video-row" key={video.id}><div className="editor-video-number">{String(index + 1).padStart(2, '0')}</div><div className="editor-video-fields"><input aria-label={`Video ${index + 1} title`} value={video.title} onChange={(event) => updateVideo(index, 'title', event.target.value)} placeholder="Project title" /><input aria-label={`Video ${index + 1} type`} value={video.type} onChange={(event) => updateVideo(index, 'type', event.target.value)} placeholder="Type label" /><input aria-label={`Video ${index + 1} link`} value={video.video_url ?? ''} onChange={(event) => updateVideo(index, 'video_url', event.target.value)} placeholder="YouTube or Google Drive link" /><input aria-label={`Video ${index + 1} thumbnail`} value={video.thumbnail_url ?? ''} onChange={(event) => updateVideo(index, 'thumbnail_url', event.target.value)} placeholder="Thumbnail link (optional)" /></div><button className="editor-remove" type="button" aria-label={`Remove video ${index + 1}`} onClick={() => { setRemovedIds((current) => [...current, video.id]); removeVideo(index); }}><Trash2 size={15} /></button></div>)}</div><button className="editor-add" type="button" onClick={addVideo}><Plus size={15} /> Add video slot</button>{editorMessage && <p className="editor-message">{editorMessage}</p>}<button className="editor-save" type="button" onClick={() => void saveEditor()}>Save changes <ArrowUpRight size={16} /></button><button className="editor-signout" type="button" onClick={() => void handleLogout()}>Sign out</button></> : <form className="admin-login-form" onSubmit={(event) => void handleLogin(event)}><div className="editor-panel-top"><div><p className="eyebrow">Admin panel</p><h2 id="editor-title">Sign in to edit</h2></div><button type="button" onClick={() => setEditorOpen(false)}>Close</button></div><label htmlFor="admin-username">Username</label><input id="admin-username" autoComplete="username" value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} /><label htmlFor="admin-password">Password</label><input id="admin-password" type="password" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />{editorMessage && <p className="editor-message">{editorMessage}</p>}<button className="editor-save" type="submit" disabled={loginBusy}>{loginBusy ? 'Signing in…' : 'Sign in'} <ArrowUpRight size={16} /></button></form>}</section></div>}
    </>
  );
}

export default App;
