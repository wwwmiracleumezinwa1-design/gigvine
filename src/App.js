import React, { useState, useEffect, useCallback } from "react";
import {
  listenToAuthState, signup, login, logout, getMusicians,
  updateUserProfile, createBooking, getBookingsForMusician,
  getBookingsForClient, updateBookingStatus, resendVerificationEmail,
  resetPassword, refreshEmailVerification, validatePassword,
  submitReview, getReviewsForMusician, getProfileCompleteness,
  recordProfileView, getAdminStats,
} from "./services";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara"
];

const INSTRUMENT_GROUPS = [
  { group: "Strings", items: ["Violin","Viola","Cello","Double Bass","Classical Guitar","Acoustic Guitar","Electric Guitar","Bass Guitar","Harp"] },
  { group: "Keyboards", items: ["Piano","Keyboard","Organ","Synthesizer"] },
  { group: "Woodwinds", items: ["Flute","Clarinet","Oboe","Bassoon","Piccolo","Recorder","Saxophone (Alto)","Saxophone (Tenor)","Saxophone (Soprano)","Saxophone (Baritone)"] },
  { group: "Brass", items: ["Trumpet","Trombone","French Horn","Tuba","Flugelhorn","Euphonium"] },
  { group: "Percussion", items: ["Drums","Talking Drum","Djembe","Congas","Bongos","Xylophone","Marimba","Timpani","Tambourine","Shekere","Gong","Cajon"] },
  { group: "Vocals", items: ["Lead Vocals","Backing Vocals","Soprano","Alto","Tenor","Bass Voice","Choir Director"] },
  { group: "Traditional Nigerian", items: ["Ekwe","Ogene","Udu","Igba","Kakaki","Goje"] },
  { group: "Other", items: ["Banjo","Mandolin","Ukulele","Music Producer","Bandleader","Conductor"] },
];
const INSTRUMENTS = INSTRUMENT_GROUPS.flatMap(g => g.items);

const EVENT_TYPES = ["Church Service","Sunday Worship","Revival/Crusade","Wedding","Wedding Reception","Burial/Funeral","Concert","Live Concert","Outdoor Concert","Private Event","Birthday Party","Dinner Party","House Party","Corporate Event","Conference","Product Launch","Award Ceremony","Live Session","Studio Recording","Music Festival","Cultural Event","Graduation Ceremony","Thanksgiving Service"];
const CATEGORIES = [
  { id: "church", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>, label: "Church Events", img: "https://res.cloudinary.com/dx0nlywdu/image/upload/v1781181236/dezalb-church-1070714_1920_oexigz.jpg" },
  { id: "wedding", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, label: "Weddings", img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80&auto=format&fit=crop" },
  { id: "concert", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, label: "Concerts", img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80&auto=format&fit=crop" },
  { id: "burial", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 1 5 5v3H7V7a5 5 0 0 1 5-5z"/><rect x="3" y="10" width="18" height="12" rx="2"/></svg>, label: "Burials", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop" },
  { id: "private", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: "Private Events", img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80&auto=format&fit=crop" },
  { id: "corporate", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>, label: "Corporate", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80&auto=format&fit=crop" },
  { id: "festival", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: "Festivals", img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&q=80&auto=format&fit=crop" },
  { id: "live", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>, label: "Live Sessions", img: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=400&q=80&auto=format&fit=crop" },
];

const S = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#080c0a;--bg2:#0a0f0d;--bg3:#0f1612;--bg4:#141e1a;
  --gold:#C9A84C;--gold2:#e8c96d;--gold3:rgba(201,168,76,0.12);--gold4:rgba(201,168,76,0.06);
  --green:#1A2F1A;--green2:#2d5a2d;--green3:#3a7a3a;
  --white:#FAFAF8;--off:#F5F2EA;
  --muted:rgba(255,255,255,0.65);--muted2:rgba(255,255,255,0.4);
  --border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.12);--border3:rgba(201,168,76,0.2);
  --card:rgba(255,255,255,0.03);--card2:rgba(255,255,255,0.06);
  --shadow:0 4px 24px rgba(0,0,0,0.5);--shadow2:0 20px 60px rgba(0,0,0,0.7);
  --radius:10px;--radius2:16px;--radius3:24px;
}
.light-mode{
  --bg:#ffffff;--bg2:#f9f9f9;--bg3:#f2f2f2;--bg4:#e8e8e8;
  --white:#111111;--off:#111111;
  --muted:rgba(0,0,0,0.6);--muted2:rgba(0,0,0,0.4);
  --border:rgba(0,0,0,0.08);--border2:rgba(0,0,0,0.15);--border3:rgba(201,168,76,0.4);
  --card:rgba(0,0,0,0.02);--card2:rgba(0,0,0,0.05);
  --shadow:0 4px 24px rgba(0,0,0,0.08);--shadow2:0 20px 60px rgba(0,0,0,0.12);
}
.light-mode body,.light-mode .app{background:#ffffff;color:#111111}
.light-mode .nav{background:rgba(255,255,255,0.97);border-bottom:1px solid rgba(0,0,0,0.08)}
.light-mode .nav-link{color:rgba(0,0,0,0.6)}
.light-mode .nav-link:hover,.light-mode .nav-link.active{color:#111111}
.light-mode .hero{background:#e8e8e8}
.light-mode .hero h1{color:#111111;text-shadow:0 2px 8px rgba(255,255,255,0.3)}
.light-mode .hero-sub{color:rgba(0,0,0,0.75)}
.light-mode .hero-badge{background:rgba(0,0,0,0.08);border-color:rgba(0,0,0,0.15);color:#5a4200}
.light-mode .hero-badge-dot{background:var(--gold)}
.light-mode .btn-ghost{color:#111111;border-color:rgba(0,0,0,0.2)}
.light-mode .btn-ghost:hover{border-color:var(--gold);color:#111111}
.light-mode .hero-search{background:#ffffff;border-color:rgba(0,0,0,0.12);box-shadow:0 2px 12px rgba(0,0,0,0.08)}
.light-mode .hero-search select,.light-mode .hero-search input{color:#111111;background:transparent}
.light-mode .hero-search select option{background:#ffffff;color:#111111}
.light-mode .hero-search select:not(:last-of-type){border-right-color:rgba(0,0,0,0.1)}
.light-mode .hero-search .custom-select-trigger{color:#111111;background:transparent}
.light-mode .trust{background:#f2f2f2;border-color:rgba(0,0,0,0.08)}
.light-mode .trust-badge{color:rgba(0,0,0,0.6);background:#ffffff;border-color:rgba(0,0,0,0.1)}
.light-mode .section-title{color:#111111}
.light-mode .section-sub{color:rgba(0,0,0,0.6)}
.light-mode .section-label{color:var(--gold)}
.light-mode .how-card{background:#ffffff;border-color:rgba(0,0,0,0.08)}
.light-mode .how-card h3{color:#111111}
.light-mode .how-card p{color:rgba(0,0,0,0.6)}
.light-mode .how-card:hover{background:#f9f9f9}
.light-mode .how-number{-webkit-text-fill-color:rgba(0,0,0,0.07);background:none}
.light-mode .musician-card{background:#ffffff;border-color:rgba(0,0,0,0.1)}
.light-mode .musician-card-header{background:#f2f2f2}
.light-mode .musician-card-header h3{color:#111111}
.light-mode .musician-card-header p{color:rgba(0,0,0,0.55)}
.light-mode .musician-bio{color:rgba(0,0,0,0.6)}
.light-mode .tag{background:#f2f2f2;color:rgba(0,0,0,0.65);border-color:rgba(0,0,0,0.1)}
.light-mode .musician-card-footer{color:#111111}
.light-mode .why-card{background:#ffffff;border-color:rgba(0,0,0,0.1)}
.light-mode .why-card h3{color:#111111}
.light-mode .why-card p{color:rgba(0,0,0,0.6)}
.light-mode .category-card{background:#f2f2f2;border-color:rgba(0,0,0,0.1)}
.light-mode .profile-section{background:#ffffff;border-color:rgba(0,0,0,0.08)}
.light-mode .profile-section h3{color:#111111;border-bottom-color:rgba(0,0,0,0.08)}
.light-mode .profile-section p{color:rgba(0,0,0,0.65)}
.light-mode .profile-name{color:#111111}
.light-mode .profile-location{color:rgba(0,0,0,0.55)}
.light-mode .profile-hero-card{background:#ffffff}
.light-mode .profile-meta-item p{color:#111111}
.light-mode .profile-meta-item h4{color:rgba(0,0,0,0.45)}
.light-mode .dashboard{background:#ffffff;color:#111111}
.light-mode .dash-welcome h2{color:#111111}
.light-mode .dash-welcome p{color:rgba(0,0,0,0.6)}
.light-mode .dash-tabs{background:#f2f2f2;border-color:rgba(0,0,0,0.08)}
.light-mode .dash-tab{color:rgba(0,0,0,0.5);background:transparent}
.light-mode .dash-tab.active{background:#ffffff;color:var(--gold)}
.light-mode .booking-card{background:#ffffff;border-color:rgba(0,0,0,0.08)}
.light-mode .booking-card:hover{background:#f9f9f9}
.light-mode .booking-info h4{color:#111111}
.light-mode .booking-info p{color:rgba(0,0,0,0.55)}
.light-mode .profile-form{background:#ffffff;border-color:rgba(0,0,0,0.08)}
.light-mode .form-group label{color:rgba(0,0,0,0.5)}
.light-mode .form-control{background:#f2f2f2;color:#111111;border-color:rgba(0,0,0,0.12)}
.light-mode .form-control:focus{background:#ffffff;border-color:rgba(201,168,76,0.4)}
.light-mode .form-control::placeholder{color:rgba(0,0,0,0.35)}
.light-mode select.form-control option{background:#ffffff;color:#111111}
.light-mode .instrument-toggle{background:#f2f2f2;color:#111111;border-color:rgba(0,0,0,0.12)}
.light-mode .instrument-toggle:hover{background:#e8e8e8}
.light-mode .instrument-toggle.selected{background:rgba(201,168,76,0.15);color:#8a6a00;border-color:rgba(201,168,76,0.4)}
.light-mode .modal{background:#ffffff;border-color:rgba(0,0,0,0.1)}
.light-mode .modal-title{color:#111111}
.light-mode .modal-sub{color:rgba(0,0,0,0.6)}
.light-mode .modal-close{color:rgba(0,0,0,0.4)}
.light-mode .modal-close:hover{color:#111111;background:rgba(0,0,0,0.06)}
.light-mode .modal-footer{color:rgba(0,0,0,0.5)}
.light-mode .role-card{background:#f2f2f2;border-color:rgba(0,0,0,0.1)}
.light-mode .role-card:hover{background:#e8e8e8}
.light-mode .role-card.active{background:rgba(201,168,76,0.1);border-color:rgba(201,168,76,0.4)}
.light-mode .role-card h4{color:#111111}
.light-mode .role-card p{color:rgba(0,0,0,0.55)}
.light-mode .analytics-card{background:#ffffff;border-color:rgba(0,0,0,0.08)}
.light-mode .analytics-number{color:var(--gold)}
.light-mode .analytics-label{color:rgba(0,0,0,0.6)}
.light-mode .analytics-sub{color:rgba(0,0,0,0.45)}
.light-mode .profile-complete-wrap{background:#ffffff;border-color:rgba(0,0,0,0.08)}
.light-mode .profile-complete-title{color:#111111}
.light-mode .profile-complete-bar{background:rgba(0,0,0,0.08)}
.light-mode .profile-complete-tag{color:rgba(0,0,0,0.55);border-color:rgba(0,0,0,0.1);background:#f2f2f2}
.light-mode .review-card{background:#f2f2f2;border-color:rgba(0,0,0,0.08)}
.light-mode .review-author{color:#111111}
.light-mode .review-date{color:rgba(0,0,0,0.4)}
.light-mode .review-comment{color:rgba(0,0,0,0.6)}
.light-mode .empty h3{color:#111111}
.light-mode .empty{color:rgba(0,0,0,0.5)}
.light-mode .payment-note{background:rgba(201,168,76,0.08);color:#8a6a00;border-color:rgba(201,168,76,0.2)}
.light-mode .alert.error{background:rgba(239,68,68,0.06);color:#b91c1c;border-color:rgba(239,68,68,0.2)}
.light-mode .alert.success{background:rgba(34,197,94,0.06);color:#15803d;border-color:rgba(34,197,94,0.2)}
.light-mode .skeleton-card{background:#f2f2f2;border-color:rgba(0,0,0,0.08)}
.light-mode .skeleton-header{background:#e8e8e8}
.light-mode .skeleton{background:linear-gradient(90deg,#e8e8e8 25%,#f2f2f2 50%,#e8e8e8 75%);background-size:200% 100%}
.light-mode .loading-screen{color:rgba(0,0,0,0.5)}
.light-mode .spinner-lg{border-color:rgba(0,0,0,0.1);border-top-color:var(--gold)}
.light-mode .chorale-badge{background:rgba(201,168,76,0.1);color:#8a6a00;border-color:rgba(201,168,76,0.3)}
.light-mode .theme-toggle{color:rgba(0,0,0,0.5);border-color:rgba(0,0,0,0.15)}
.light-mode .theme-toggle:hover{color:#111111}

/* Theme toggle button */
.theme-toggle{background:none;border:1px solid var(--border2);border-radius:20px;cursor:pointer;display:flex;align-items:center;gap:6px;padding:6px 12px;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:13px;transition:all .2s}
.theme-toggle:hover{border-color:var(--border3);color:var(--white)}
html{scroll-behavior:smooth}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--white);min-height:100vh;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.app{min-height:100vh;display:flex;flex-direction:column}

@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(201,168,76,0.1)}50%{box-shadow:0 0 40px rgba(201,168,76,0.25)}}
@keyframes borderGlow{0%,100%{border-color:rgba(201,168,76,0.15)}50%{border-color:rgba(201,168,76,0.35)}}
@keyframes scaleIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}

.nav{position:sticky;top:0;z-index:100;background:rgba(8,12,10,0.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:64px;transition:background .2s}
.nav-logo{display:flex;align-items:center;gap:10px;background:none;border:none;cursor:pointer}
.nav-logo-icon{display:flex;align-items:flex-end;gap:2.5px;height:26px}
.nav-logo-icon span{display:block;border-radius:3px;background:var(--gold)}
.nav-logo-text{font-family:'Playfair Display',serif;font-size:20px;font-weight:700}
.nav-logo-text em{color:var(--gold);font-style:normal}
.nav-logo-text span{color:var(--white)}
.nav-links{display:flex;align-items:center;gap:4px}
.nav-link{color:var(--muted);background:none;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;padding:8px 16px;border-radius:8px;transition:color .15s;position:relative}
.nav-link:hover{color:var(--white)}
.nav-link.active{color:var(--white)}
.nav-btn{background:var(--gold);color:#080c0a;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;padding:9px 22px;border-radius:8px;transition:opacity .15s}
.nav-btn:hover{opacity:0.9}

.hero{position:relative;overflow:hidden;padding:80px 32px 70px;text-align:center;background:var(--bg2);min-height:65vh;display:flex;align-items:center;justify-content:center}
.hero-bg{position:absolute;inset:0;pointer-events:none}
.hero-gradient{position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 0%,rgba(45,90,45,0.12) 0%,transparent 60%)}
.hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);background-size:80px 80px;opacity:0.6}
.hero-orb{position:absolute;border-radius:50%;filter:blur(60px)}
.hero-orb-1{width:350px;height:350px;background:rgba(45,90,45,0.1);top:-80px;left:-80px}
.hero-orb-2{width:250px;height:250px;background:rgba(201,168,76,0.06);bottom:-40px;right:-40px}
.hero-orb-3{display:none}
.hero-content{position:relative;z-index:1;max-width:800px;margin:0 auto}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);color:var(--gold2);font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:7px 18px;border-radius:20px;margin-bottom:28px}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--gold)}
.hero h1{font-family:'Playfair Display',serif;font-size:clamp(36px,6vw,68px);font-weight:900;line-height:1.05;color:var(--white);margin-bottom:8px;letter-spacing:-0.02em}
.hero h1 em{color:var(--gold);font-style:normal;display:block}
.hero-sub{font-size:17px;font-weight:300;color:var(--muted);line-height:1.75;max-width:540px;margin:20px auto 36px}
.hero-ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:44px}

.btn-gold{background:var(--gold);color:#080c0a;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;padding:14px 32px;border-radius:var(--radius);transition:opacity .15s;letter-spacing:0.02em}
.btn-gold:hover{opacity:0.9}
.btn-ghost{background:transparent;color:var(--white);border:1px solid rgba(255,255,255,0.2);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;padding:14px 32px;border-radius:var(--radius);transition:all .2s}
.btn-ghost:hover{border-color:rgba(201,168,76,0.4);color:var(--gold)}

.hero-search{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:var(--radius2);padding:6px;display:flex;flex-wrap:wrap;max-width:760px;margin:0 auto;transition:border .2s}
.hero-search:focus-within{border-color:rgba(201,168,76,0.3)}
.hero-search select{flex:1;min-width:130px;background:transparent;border:none;outline:none;color:var(--white);font-family:'DM Sans',sans-serif;font-size:14px;padding:11px 16px;appearance:none;-webkit-appearance:none}
.hero-search select:not(:last-of-type){border-right:1px solid var(--border)}
.hero-search select option{background:#0a0f0d;color:#ffffff}
.hero-search button{background:var(--gold);color:#080c0a;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;padding:11px 28px;border-radius:9px;transition:opacity .15s;white-space:nowrap}
.hero-search button:hover{opacity:0.9}
.hero-search .custom-select{flex:1;min-width:130px;border-right:1px solid var(--border)}
.hero-search .custom-select-trigger{background:transparent!important;border:none!important;border-radius:0;padding:11px 32px 11px 16px;color:var(--white);font-size:14px;width:100%}
.light-mode .hero-search{background:rgba(255,255,255,0.95);border-color:rgba(0,0,0,0.12);box-shadow:0 2px 12px rgba(0,0,0,0.06)}
.light-mode .hero-search select{color:#111111;background:transparent}
.light-mode .hero-search select option{background:#ffffff;color:#111111}
.light-mode .hero-search select:not(:last-of-type){border-right-color:rgba(0,0,0,0.1)}
.light-mode .hero-search .custom-select{border-right-color:rgba(0,0,0,0.1)}
.light-mode .hero-search .custom-select-trigger{color:#111111!important;background:transparent!important}

.trust{background:var(--bg3);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:18px 32px}
.trust-inner{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
.trust-badge{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--muted);padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:var(--card)}
.trust-badge-icon{width:15px;height:15px;flex-shrink:0}

.section{padding:80px 32px;max-width:1120px;margin:0 auto;width:100%}
.section-label{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.section-label::before{content:'';width:20px;height:1px;background:var(--gold)}
.section-title{font-family:'Playfair Display',serif;font-size:clamp(26px,4vw,42px);font-weight:700;color:var(--white);margin-bottom:12px;letter-spacing:-0.02em;line-height:1.15}
.section-sub{font-size:15px;color:var(--muted);max-width:500px;line-height:1.7}
.section-header.center{text-align:center}
.section-header.center .section-label{justify-content:center}
.section-header.center .section-sub{margin:0 auto}

.how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--radius2);overflow:hidden}
.how-card{background:var(--bg2);padding:40px 32px;position:relative;overflow:hidden;transition:background .3s}
.how-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(201,168,76,0.04) 0%,transparent 60%);opacity:0;transition:opacity .3s}
.how-card:hover{background:var(--bg3)}
.how-card:hover::before{opacity:1}
.how-number{font-family:'Playfair Display',serif;font-size:56px;font-weight:900;background:linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;margin-bottom:20px}
.how-icon-wrap{width:44px;height:44px;background:var(--gold3);border:1px solid var(--border3);border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;transition:all .3s}
.how-card:hover .how-icon-wrap{background:rgba(201,168,76,0.2);transform:scale(1.05)}
.how-card h3{font-size:17px;font-weight:700;color:var(--white);margin-bottom:10px}
.how-card p{font-size:14px;color:var(--muted);line-height:1.7}

.musician-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:20px}
.musician-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);overflow:hidden;transition:all .3s cubic-bezier(.4,0,.2,1);cursor:pointer;position:relative}
.musician-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(201,168,76,0.06) 0%,transparent 50%);opacity:0;transition:opacity .3s;z-index:0;pointer-events:none}
.musician-card:hover{border-color:rgba(201,168,76,0.25);transform:translateY(-6px);box-shadow:0 24px 60px rgba(0,0,0,0.6),0 0 0 1px rgba(201,168,76,0.1)}
.musician-card:hover::before{opacity:1}
.musician-card>*{position:relative;z-index:1}
.musician-card-header{background:linear-gradient(135deg,var(--bg4) 0%,rgba(26,47,26,0.5) 100%);padding:24px 20px 18px;display:flex;align-items:center;gap:14px;border-bottom:1px solid var(--border)}
.musician-avatar{width:54px;height:54px;border-radius:50%;border:2px solid rgba(201,168,76,0.25);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:var(--gold);background:linear-gradient(135deg,var(--bg2),var(--bg4));flex-shrink:0;overflow:hidden;transition:border-color .3s}
.musician-card:hover .musician-avatar{border-color:rgba(201,168,76,0.5)}
.musician-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.musician-card-header h3{font-size:15px;font-weight:600;color:var(--white);margin-bottom:2px}
.musician-card-header p{font-size:12px;color:var(--muted)}
.musician-verified{position:absolute;top:14px;right:14px;background:linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.08));border:1px solid rgba(201,168,76,0.2);color:var(--gold);font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;letter-spacing:.06em}
.musician-card-body{padding:16px 20px 20px}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.tag{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.65);font-size:11px;font-weight:500;padding:4px 10px;border-radius:20px;border:1px solid var(--border);transition:all .2s}
.tag:hover{background:rgba(255,255,255,0.08);color:var(--white)}
.tag.gold{background:var(--gold3);color:var(--gold);border-color:var(--border3)}
.musician-bio{font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:18px}
.musician-card-footer{display:flex;justify-content:space-between;align-items:center}
.musician-rating{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--muted)}
.musician-rating .star{color:var(--gold);font-size:13px}
.card-actions{display:flex;gap:8px}
.btn-card-primary{background:linear-gradient(135deg,var(--gold),var(--gold2));color:#080c0a;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;padding:8px 18px;border-radius:7px;transition:all .2s}
.btn-card-primary:hover{box-shadow:0 4px 16px rgba(201,168,76,0.4);transform:translateY(-1px)}
.btn-card-ghost{background:transparent;color:var(--muted);border:1px solid var(--border2);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:8px 16px;border-radius:7px;transition:all .2s}
.btn-card-ghost:hover{color:var(--white);border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.04)}

.categories-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none}
.categories-scroll::-webkit-scrollbar{display:none}
.category-card{border:1px solid var(--border);border-radius:var(--radius2);padding:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer;transition:all .3s;flex-shrink:0;min-width:140px;height:160px;text-align:center;position:relative;overflow:hidden;background:var(--bg3)}
.category-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(0.45);transition:transform .4s ease;z-index:0}
.category-card:hover img{transform:scale(1.08);filter:brightness(0.6)}
.category-card::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.2) 60%,transparent 100%);z-index:1}
.category-card:hover{border-color:rgba(201,168,76,0.4);transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.5)}
.category-card.active{border-color:var(--gold)}
.category-card-content{position:relative;z-index:2;padding:16px 12px;display:flex;flex-direction:column;align-items:center;gap:6px;width:100%}
.category-icon-wrap{width:36px;height:36px;border-radius:10px;background:rgba(201,168,76,0.2);border:1px solid rgba(201,168,76,0.3);display:flex;align-items:center;justify-content:center;transition:all .3s;color:var(--gold)}
.category-card:hover .category-icon-wrap{background:rgba(201,168,76,0.3);transform:scale(1.08)}
.category-label{font-size:12px;font-weight:700;color:#fff;letter-spacing:0.02em;text-shadow:0 1px 4px rgba(0,0,0,0.5)}

.why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
.why-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:32px 28px;transition:all .3s;position:relative;overflow:hidden}
.why-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold2));transform:scaleX(0);transform-origin:left;transition:transform .3s}
.why-card:hover{border-color:var(--border3);transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.5)}
.why-card:hover::after{transform:scaleX(1)}
.why-icon{width:48px;height:48px;background:var(--gold3);border:1px solid var(--border3);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;transition:all .3s}
.why-card:hover .why-icon{background:rgba(201,168,76,0.2);transform:scale(1.08) rotate(3deg)}
.why-card h3{font-size:16px;font-weight:700;color:var(--white);margin-bottom:10px}
.why-card p{font-size:14px;color:var(--muted);line-height:1.7}

.search-page{max-width:1120px;margin:0 auto;padding:48px 32px}
.search-page-header{margin-bottom:32px}
.search-page-header h2{font-family:'Playfair Display',serif;font-size:34px;font-weight:700;color:var(--white);margin-bottom:6px;letter-spacing:-0.02em}
.search-page-header p{color:var(--muted);font-size:15px}
.search-filters{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:20px 24px;display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:36px}
.filter-group{display:flex;flex-direction:column;gap:6px;min-width:150px}
.filter-group label{font-size:11px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em}
.filter-group select,.filter-group input{background:rgba(255,255,255,0.04);border:1px solid var(--border2);border-radius:8px;padding:10px 14px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--white);outline:none;transition:all .2s}
.filter-group select option{background:#0a0f0d}
.filter-group select:focus,.filter-group input:focus{border-color:rgba(201,168,76,0.35);box-shadow:0 0 0 3px rgba(201,168,76,0.08)}
.filter-group input::placeholder{color:var(--muted2)}

.profile-page{max-width:820px;margin:0 auto;padding:40px 32px}
.profile-hero-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius3);overflow:hidden;margin-bottom:20px}
.profile-cover{height:160px;background:linear-gradient(135deg,#0f2a1a 0%,#1a3020 30%,#0a1f12 60%,#142014 100%);position:relative;overflow:hidden}
.profile-cover::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(201,168,76,0.02) 0,rgba(201,168,76,0.02) 1px,transparent 0,transparent 50%);background-size:20px 20px}
.profile-cover::after{content:'';position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(transparent,var(--bg3))}
.profile-info{padding:0 32px 32px}
.profile-big-avatar{width:92px;height:92px;border-radius:50%;border:3px solid var(--bg3);background:linear-gradient(135deg,var(--bg2),var(--bg4));display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:var(--gold);margin-top:-46px;margin-bottom:16px;overflow:hidden;flex-shrink:0;box-shadow:0 4px 20px rgba(0,0,0,0.5)}
.profile-big-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.profile-name-row{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px}
.profile-name{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--white);margin-bottom:4px;letter-spacing:-0.01em}
.profile-location{font-size:14px;color:var(--muted);margin-bottom:12px}
.profile-section{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:24px 28px;margin-bottom:16px;transition:border-color .2s}
.profile-section:hover{border-color:var(--border2)}
.profile-section h3{font-size:13px;font-weight:700;color:var(--white);margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.08em}
.profile-section p{font-size:14px;color:var(--muted);line-height:1.75}
.profile-meta-grid{display:flex;gap:32px;flex-wrap:wrap}
.profile-meta-item h4{font-size:11px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}
.profile-meta-item p{font-size:15px;color:var(--white);font-weight:500}

.dashboard{max-width:1000px;margin:0 auto;padding:48px 32px}
.dash-welcome{margin-bottom:36px}
.dash-welcome h2{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:var(--white);margin-bottom:4px;letter-spacing:-0.01em}
.dash-welcome p{color:var(--muted);font-size:15px}
.dash-tabs{display:flex;gap:2px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:4px;margin-bottom:28px;width:fit-content}
.dash-tab{padding:9px 24px;border-radius:9px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;color:var(--muted);background:none;transition:all .2s}
.dash-tab.active{background:linear-gradient(135deg,rgba(201,168,76,0.12),rgba(201,168,76,0.06));color:var(--gold);font-weight:700;box-shadow:inset 0 0 0 1px rgba(201,168,76,0.2)}
.booking-list{display:flex;flex-direction:column;gap:12px}
.booking-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;transition:all .2s}
.booking-card:hover{border-color:var(--border2);background:var(--bg4)}
.booking-info h4{font-weight:600;color:var(--white);margin-bottom:4px;font-size:15px}
.booking-info p{font-size:13px;color:var(--muted)}
.booking-actions{display:flex;gap:8px;align-items:center}
.status-badge{font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:.05em}
.status-badge.pending{background:rgba(201,168,76,0.1);color:var(--gold);border:1px solid rgba(201,168,76,0.2)}
.status-badge.accepted{background:rgba(34,197,94,0.08);color:#4ade80;border:1px solid rgba(34,197,94,0.15)}
.status-badge.declined{background:rgba(239,68,68,0.08);color:#f87171;border:1px solid rgba(239,68,68,0.15)}
.btn-accept{background:rgba(34,197,94,0.1);color:#4ade80;border:1px solid rgba(34,197,94,0.2);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;padding:7px 16px;border-radius:7px;transition:all .2s}
.btn-accept:hover{background:rgba(34,197,94,0.18);transform:translateY(-1px)}
.btn-decline{background:rgba(239,68,68,0.06);color:#f87171;border:1px solid rgba(239,68,68,0.15);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;padding:7px 16px;border-radius:7px;transition:all .2s}
.btn-decline:hover{background:rgba(239,68,68,0.12);transform:translateY(-1px)}

.profile-form{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:32px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.form-group{margin-bottom:18px}
.form-group label{display:block;font-size:11px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
.form-control{width:100%;background:rgba(255,255,255,0.04);border:1px solid var(--border2);border-radius:9px;padding:12px 16px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--white);outline:none;transition:all .2s}
.form-control:focus{border-color:rgba(201,168,76,0.35);background:rgba(255,255,255,0.06);box-shadow:0 0 0 3px rgba(201,168,76,0.08)}
.form-control::placeholder{color:var(--muted2)}
textarea.form-control{resize:vertical;min-height:100px}
.instruments-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.instrument-toggle{padding:8px 16px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:var(--white);transition:all .2s}
.instrument-toggle:hover{border-color:rgba(201,168,76,0.3);background:rgba(201,168,76,0.08);color:var(--white)}
.instrument-toggle.selected{border-color:rgba(201,168,76,0.5);background:var(--gold3);color:var(--gold);font-weight:600}

/* ── CUSTOM DROPDOWN ── */
.custom-select{position:relative;width:100%}
.custom-select-trigger{width:100%;background:transparent;border:none;border-radius:0;padding:12px 36px 12px 18px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--white);cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all .2s;text-align:left;user-select:none}
.custom-select-trigger:focus,.custom-select-trigger.open{outline:none;box-shadow:none;border:none}
.custom-select-arrow{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none;transition:transform .2s;font-size:10px}
.custom-select-trigger.open ~ .custom-select-arrow,.custom-select.open .custom-select-arrow{transform:translateY(-50%) rotate(180deg)}
.custom-select-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#0f1612;border:1px solid var(--border2);border-radius:10px;box-shadow:0 16px 48px rgba(0,0,0,0.7);z-index:300;max-height:260px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(201,168,76,0.2) transparent;animation:fadeUp .15s ease}
.custom-select-dropdown::-webkit-scrollbar{width:4px}
.custom-select-dropdown::-webkit-scrollbar-track{background:transparent}
.custom-select-dropdown::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:2px}
.custom-select-group-label{padding:10px 14px 4px;font-size:10px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;border-top:1px solid var(--border)}
.custom-select-group-label:first-child{border-top:none}
.custom-select-option{padding:9px 14px;font-size:13px;color:var(--muted);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:8px}
.custom-select-option:hover{background:rgba(255,255,255,0.05);color:var(--white)}
.custom-select-option.selected{color:var(--gold);background:var(--gold3)}
.custom-select-option.all-option{color:var(--white);font-weight:500;border-bottom:1px solid var(--border);padding-bottom:10px;margin-bottom:2px}

.overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .15s ease}
.modal{background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius3);padding:36px;width:100%;max-width:460px;box-shadow:0 24px 60px rgba(0,0,0,0.7);animation:scaleIn .2s ease;max-height:90vh;overflow-y:auto}
.modal-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:var(--white);margin-bottom:6px;letter-spacing:-0.01em}
.modal-sub{color:var(--muted);font-size:14px;margin-bottom:28px;line-height:1.6}
.modal-close{background:none;border:none;cursor:pointer;color:var(--muted);font-size:18px;padding:6px;border-radius:6px;transition:all .2s;line-height:1}
.modal-close:hover{color:var(--white);background:rgba(255,255,255,0.06)}
.modal-footer{text-align:center;margin-top:20px;font-size:13px;color:var(--muted)}
.modal-footer button{background:none;border:none;color:var(--gold);font-weight:600;cursor:pointer;font-size:13px;transition:color .2s}
.modal-footer button:hover{color:var(--gold2)}
.role-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
.role-card{border:1px solid var(--border2);border-radius:var(--radius);padding:18px;text-align:center;cursor:pointer;transition:all .2s;background:rgba(255,255,255,0.02)}
.role-card:hover{border-color:rgba(201,168,76,0.2);background:rgba(255,255,255,0.04)}
.role-card.active{border-color:rgba(201,168,76,0.4);background:var(--gold3)}
.role-card .role-icon{display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);margin:0 auto 10px;transition:all .2s}
.role-card.active .role-icon{background:var(--gold3);border-color:var(--border3)}
.role-card h4{font-size:13px;font-weight:700;color:var(--white);margin-bottom:4px}
.role-card p{font-size:11px;color:var(--muted)}
.btn-full{width:100%;padding:14px;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#080c0a;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;border-radius:var(--radius);transition:all .2s;margin-top:4px;letter-spacing:0.02em}
.btn-full:hover{box-shadow:0 6px 24px rgba(201,168,76,0.4);transform:translateY(-1px)}
.btn-full:disabled{opacity:0.5;cursor:not-allowed;transform:none}
.btn-full.outline{background:transparent;color:var(--white);border:1px solid var(--border2)}
.btn-full.outline:hover{border-color:rgba(201,168,76,0.3);color:var(--gold);box-shadow:none;transform:none}

.verify-banner{background:linear-gradient(90deg,rgba(201,168,76,0.08),rgba(201,168,76,0.05),rgba(201,168,76,0.08));border-bottom:1px solid rgba(201,168,76,0.12);padding:12px 32px;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--gold)}
.verify-banner button{background:linear-gradient(135deg,var(--gold),var(--gold2));color:#080c0a;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;padding:6px 16px;border-radius:6px;transition:all .2s}
.verify-banner button:hover{box-shadow:0 3px 12px rgba(201,168,76,0.4);transform:translateY(-1px)}
.verify-banner .btn-check{background:rgba(255,255,255,0.06);color:var(--white);border:1px solid var(--border2)}
.verify-banner .btn-check:hover{background:rgba(255,255,255,0.1);box-shadow:none}

.password-strength{height:3px;border-radius:2px;background:var(--border);overflow:hidden;margin-top:8px}
.password-strength-bar{height:100%;border-radius:2px;transition:width .3s,background .3s}
.password-rules{display:flex;flex-direction:column;gap:4px;margin-top:8px}
.password-rule{font-size:12px;display:flex;align-items:center;gap:6px}
.password-rule.pass{color:#4ade80}
.password-rule.fail{color:rgba(255,255,255,0.3)}

.alert{padding:12px 16px;border-radius:9px;font-size:13px;margin-bottom:16px;border:1px solid transparent}
.alert.success{background:rgba(34,197,94,0.06);color:#4ade80;border-color:rgba(34,197,94,0.12)}
.alert.error{background:rgba(239,68,68,0.06);color:#f87171;border-color:rgba(239,68,68,0.12)}

.payment-note{background:var(--gold3);border:1px solid rgba(201,168,76,0.12);border-radius:9px;padding:14px 18px;font-size:13px;color:rgba(201,168,76,0.9);display:flex;gap:10px;align-items:flex-start;margin-top:12px;line-height:1.6}

.review-card{background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:var(--radius);padding:18px 20px;margin-bottom:12px;transition:border-color .2s}
.review-card:hover{border-color:var(--border2)}
.review-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.review-author{font-weight:600;color:var(--white);font-size:14px}
.review-date{font-size:12px;color:var(--muted2)}
.stars{color:var(--gold);font-size:15px;margin-bottom:8px;letter-spacing:1px}
.review-comment{font-size:13px;color:var(--muted);line-height:1.7}
.star-input{display:flex;gap:2px;margin:10px 0}
.star-input button{background:none;border:none;cursor:pointer;font-size:30px;padding:0;transition:all .15s;line-height:1}
.star-input button:hover{transform:scale(1.2)}

.empty{text-align:center;padding:64px 24px;color:var(--muted)}
.empty-icon{font-size:48px;margin-bottom:16px;opacity:0.4}
.empty h3{font-weight:700;color:var(--white);margin-bottom:8px;font-size:18px}
.loading-screen{min-height:50vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;color:var(--muted)}
.spinner-lg{width:36px;height:36px;border:2px solid var(--border2);border-top-color:var(--gold);border-radius:50%;animation:spin .7s linear infinite}
.spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(8,12,10,0.3);border-top-color:#080c0a;border-radius:50%;animation:spin .6s linear infinite}

.chorale-badge{background:var(--gold3);color:var(--gold);font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;display:inline-block;border:1px solid rgba(201,168,76,0.2);letter-spacing:.05em}

/* ── PROFILE COMPLETENESS ── */
.profile-complete-wrap{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:20px 24px;margin-bottom:20px}
.profile-complete-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.profile-complete-title{font-size:14px;font-weight:700;color:var(--white)}
.profile-complete-pct{font-size:20px;font-weight:900;font-family:'Playfair Display',serif;color:var(--gold)}
.profile-complete-bar{height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:10px}
.profile-complete-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--gold),var(--gold2));transition:width .6s ease}
.profile-complete-missing{display:flex;flex-wrap:wrap;gap:6px}
.profile-complete-tag{font-size:11px;color:var(--muted);background:rgba(255,255,255,0.04);border:1px solid var(--border2);padding:3px 10px;border-radius:20px}

/* ── SKELETON LOADING ── */
.skeleton{background:linear-gradient(90deg,var(--bg3) 25%,var(--bg4) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmerSkeleton 1.4s infinite;border-radius:6px}
@keyframes shimmerSkeleton{0%{background-position:200% 0}100%{background-position:-200% 0}}
.skeleton-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);overflow:hidden;padding:0}
.skeleton-header{height:80px;background:var(--bg4);display:flex;align-items:center;gap:14px;padding:20px}
.skeleton-circle{width:54px;height:54px;border-radius:50%;flex-shrink:0}
.skeleton-lines{flex:1;display:flex;flex-direction:column;gap:8px}
.skeleton-line{height:12px;border-radius:4px}
.skeleton-body{padding:16px 20px;display:flex;flex-direction:column;gap:10px}
.skeleton-tags{display:flex;gap:6px}
.skeleton-tag{height:24px;width:70px;border-radius:20px}

/* ── ANALYTICS CARDS ── */
.analytics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:28px}
.analytics-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:20px;transition:all .2s;position:relative;overflow:hidden}
.analytics-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold2))}
.analytics-card:hover{border-color:var(--border3);transform:translateY(-2px)}
.analytics-number{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:var(--gold);line-height:1;margin-bottom:6px}
.analytics-label{font-size:12px;color:var(--muted);font-weight:500}
.analytics-sub{font-size:11px;color:var(--muted2);margin-top:4px}

/* ── AVAILABILITY BADGE ── */
.available-badge{background:rgba(34,197,94,0.1);color:#4ade80;border:1px solid rgba(34,197,94,0.2);font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;display:inline-flex;align-items:center;gap:4px;letter-spacing:.04em}
.available-dot{width:5px;height:5px;border-radius:50%;background:#4ade80;animation:pulse 2s infinite}

/* ── RESPONSE TIME ── */
.response-time{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:5px;margin-top:6px}

.breadcrumb{background:var(--bg2);border-bottom:1px solid var(--border);padding:12px 32px;display:flex;align-items:center;gap:8px;font-size:13px}
.breadcrumb-item{color:var(--muted);cursor:pointer;transition:color .2s;background:none;border:none;font-family:'DM Sans',sans-serif;font-size:13px;padding:0}
.breadcrumb-item:hover{color:var(--gold)}
.breadcrumb-sep{color:var(--muted2)}
.breadcrumb-current{color:var(--white);font-weight:500}

.bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:100;background:rgba(8,12,10,0.96);backdrop-filter:blur(24px);border-top:1px solid var(--border);padding:8px 0 env(safe-area-inset-bottom);height:64px}
.bottom-nav-inner{display:flex;align-items:center;justify-content:space-around;height:100%}
.bottom-nav-item{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:4px 16px;border-radius:10px;background:none;border:none;transition:all .2s;min-width:60px}
.bottom-nav-item .nav-icon{font-size:20px;line-height:1;transition:transform .2s}
.bottom-nav-item .nav-label{font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;color:var(--muted);transition:color .2s;letter-spacing:.02em}
.bottom-nav-item.active .nav-icon{transform:translateY(-2px)}
.bottom-nav-item.active .nav-label{color:var(--gold);font-weight:700}
.bottom-nav-item:hover .nav-label{color:var(--white)}
.app-with-bottom-nav{padding-bottom:64px}

.footer{background:var(--bg2);border-top:1px solid var(--border);padding:64px 32px 32px;margin-top:auto}
.footer-inner{max-width:1120px;margin:0 auto}
.footer-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:52px;margin-bottom:52px}
.footer-brand p{font-size:14px;color:var(--muted);line-height:1.75;margin-top:14px;max-width:260px}
.footer-tagline{font-size:13px;color:var(--muted2);margin-top:16px;font-style:italic}
.footer-col h4{font-size:11px;font-weight:700;color:var(--white);text-transform:uppercase;letter-spacing:.1em;margin-bottom:18px}
.footer-col a{display:block;font-size:14px;color:var(--muted);margin-bottom:10px;cursor:pointer;transition:color .2s;text-decoration:none}
.footer-col a:hover{color:var(--gold)}
.footer-bottom{display:flex;align-items:center;justify-content:space-between;padding-top:24px;border-top:1px solid var(--border);flex-wrap:wrap;gap:12px}
.footer-bottom p{font-size:13px;color:var(--muted2)}
.footer-bottom strong{color:var(--gold)}

.cta-section{position:relative;overflow:hidden;padding:100px 32px;text-align:center;background:var(--bg2)}
.cta-section::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 50% 50%,rgba(45,90,45,0.12) 0%,transparent 70%)}
.cta-inner{position:relative;z-index:1;max-width:600px;margin:0 auto}

@media(max-width:768px){
  .nav-links .nav-link{display:none}
  .hero{padding:90px 20px 80px;min-height:auto}
  .hero-search{flex-direction:column;gap:8px;padding:10px}
  .hero-search select{max-width:100%;border-right:none;border-bottom:1px solid var(--border)}
  .trust-inner{gap:10px}
  .footer-top{grid-template-columns:1fr 1fr}
  .booking-card{flex-direction:column;align-items:flex-start}
  .form-grid{grid-template-columns:1fr}
  .profile-name-row{flex-direction:column}
  .bottom-nav{display:block}
  .app-with-bottom-nav{padding-bottom:72px}
  .nav-btn{display:none}
  .section{padding:64px 20px}
}
@media(max-width:480px){
  .footer-top{grid-template-columns:1fr}
  .how-grid{grid-template-columns:1fr}
  .role-grid{grid-template-columns:1fr}
  .hero h1{font-size:38px}
}
`;

// ─── InstrumentSelect ─────────────────────────────────────────────────────────
function InstrumentSelect({ value, onChange, placeholder = "All Instruments" }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = value || "";
  const label = selected || placeholder;

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className={`custom-select-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: selected ? "var(--white)" : "var(--muted2)" }}>{label}</span>
      </button>
      <span className="custom-select-arrow">▼</span>
      {open && (
        <div className="custom-select-dropdown">
          <div className="custom-select-option all-option" onClick={() => { onChange(""); setOpen(false); }}>
            All Instruments
          </div>
          {INSTRUMENT_GROUPS.map(g => (
            <div key={g.group}>
              <div className="custom-select-group-label">{g.group}</div>
              {g.items.map(i => (
                <div
                  key={i}
                  className={`custom-select-option ${selected === i ? "selected" : ""}`}
                  onClick={() => { onChange(i); setOpen(false); }}
                >
                  {i}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────
function BottomNav({ page, setPage, currentUser, setModal }) {
  const items = [
    { id: "home", label: "Home" },
    { id: "search", label: "Discover" },
    { id: "dashboard", icon: "📋", label: "Dashboard", authRequired: true },
    { id: "login", icon: "👤", label: "Account", isModal: true, hideWhenAuth: false },
  ];

  const HomeIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  const SearchIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  const DashIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
  const UserIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map(item => {
          if (item.authRequired && !currentUser) return null;
          if (item.id === "login" && currentUser) return (
            <button key="account" className={`bottom-nav-item ${page === "dashboard" ? "active" : ""}`}
              onClick={() => setPage("dashboard")}>
              <span className="nav-icon"><UserIcon /></span>
              <span className="nav-label">Account</span>
            </button>
          );
          const icons = { home: <HomeIcon />, search: <SearchIcon />, dashboard: <DashIcon />, login: <UserIcon /> };
          return (
            <button key={item.id} className={`bottom-nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => item.isModal ? setModal(item.id) : setPage(item.id)}>
              <span className="nav-icon">{icons[item.id]}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({ items, setPage }) {
  return (
    <div className="breadcrumb">
      <button className="breadcrumb-item" onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Home
      </button>
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="breadcrumb-sep">›</span>
          {item.page ? (
            <button className="breadcrumb-item" onClick={() => setPage(item.page)}>{item.label}</button>
          ) : (
            <span className="breadcrumb-current">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── Logo Component ───────────────────────────────────────────────────────────
function Logo({ size = "md" }) {
  const h = size === "sm" ? 20 : size === "lg" ? 32 : 24;
  const fs = size === "sm" ? 16 : size === "lg" ? 24 : 19;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5, height: h }}>
        {[0.45, 0.65, 1, 0.65, 0.45].map((op, i) => (
          <span key={i} style={{
            display: "block", width: 3.5, borderRadius: 3,
            height: [h * 0.54, h * 0.77, h, h * 0.77, h * 0.54][i],
            background: "var(--gold)", opacity: op,
          }} />
        ))}
      </div>
      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: fs, fontWeight: 700, lineHeight: 1 }}>
        <em style={{ color: "var(--gold)", fontStyle: "normal" }}>Gig</em>
        <span style={{ color: "var(--white)" }}>Vine</span>
      </span>
    </div>
  );
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, background: "#080c0a", color: "#FAFAF8", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
          <h2 style={{ fontFamily: "Playfair Display,serif", color: "#C9A84C", marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>Please refresh the page to continue.</p>
          <button onClick={() => window.location.reload()} style={{ background: "#C9A84C", color: "#080c0a", border: "none", borderRadius: 8, padding: "12px 28px", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function GigVineApp() {
  return <ErrorBoundary><GigVine /></ErrorBoundary>;
}

function GigVine() {
  const [page, setPage] = useState("home");
  const [currentUser, setCurrentUser] = useState(undefined);
  const [modal, setModal] = useState(null);
  const [selectedMusician, setSelectedMusician] = useState(null);
  const [bookingTarget, setBookingTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState({ instrument: "", location: "" });
  const [featuredMusicians, setFeaturedMusicians] = useState([]);
  const [lightMode, setLightMode] = useState(() => localStorage.getItem("gigvine-theme") === "light");

  useEffect(() => {
    localStorage.setItem("gigvine-theme", lightMode ? "light" : "dark");
  }, [lightMode]);

  useEffect(() => {
    const unsub = listenToAuthState(u => setCurrentUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    getMusicians({ pageSize: 6 }).then(r => setFeaturedMusicians(r.musicians)).catch(console.error);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  useEffect(() => {
    window.history.pushState({ page }, "", window.location.pathname);
  }, [page]);

  useEffect(() => {
    const handleBack = (e) => {
      if (e.state && e.state.page) { setPage(e.state.page); }
      else { setPage("home"); }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, []);

  const handleLogout = async () => { await logout(); setCurrentUser(null); setPage("home"); };

  if (currentUser === undefined) return (
    <div className="app">
      <style>{S}</style>
      <div className="loading-screen"><div className="spinner-lg" /><p>Loading GigVine…</p></div>
    </div>
  );

  return (
    <div className={`app app-with-bottom-nav${lightMode ? " light-mode" : ""}`}>
      <style>{S}</style>

      {/* Navbar */}
      <nav className="nav">
        <button className="nav-logo" onClick={() => setPage("home")} style={{ background: "none", border: "none" }}>
          <Logo />
        </button>
        <div className="nav-links">
          <button className="nav-link" style={{ color: page === "home" ? "var(--white)" : "" }} onClick={() => setPage("home")}>Home</button>
          <button className="nav-link" style={{ color: page === "search" ? "var(--white)" : "" }} onClick={() => setPage("search")}>Find Musicians</button>
          {currentUser ? (
            <>
              <button className="nav-link" style={{ color: page === "dashboard" ? "var(--white)" : "" }} onClick={() => setPage("dashboard")}>Dashboard</button>
              <button className="nav-link" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="nav-link" onClick={() => setModal("login")}>Login</button>
              <button className="nav-btn" onClick={() => setModal("signup")}>Get Started</button>
            </>
          )}
          <button className="theme-toggle" onClick={() => setLightMode(m => !m)} title="Toggle theme">
            {lightMode ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            )}
            {lightMode ? "Dark" : "Light"}
          </button>
        </div>
      </nav>

      {/* Verify banner */}
      {currentUser && !currentUser.emailVerified && (
        <VerifyBanner currentUser={currentUser} setCurrentUser={setCurrentUser} />
      )}

      {/* Pages */}
      {page === "home" && (
        <HomePage
          setPage={setPage} setModal={setModal} musicians={featuredMusicians}
          setSelectedMusician={m => { setSelectedMusician(m); setPage("musician-profile"); }}
          setBookingTarget={m => { setBookingTarget(m); setModal("booking"); }}
          currentUser={currentUser} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        />
      )}
      {page === "search" && (
        <>
          <Breadcrumb items={[{ label: "Find Musicians" }]} setPage={setPage} />
          <SearchPage
          setSelectedMusician={m => { setSelectedMusician(m); setPage("musician-profile"); }}
          setBookingTarget={m => { setBookingTarget(m); setModal("booking"); }}
          currentUser={currentUser} setModal={setModal} initialQuery={searchQuery}
        />
        </>
      )}
      {page === "musician-profile" && selectedMusician && (
        <>
          <Breadcrumb items={[{ label: "Find Musicians", page: "search" }, { label: selectedMusician.name }]} setPage={setPage} />
          <MusicianProfilePage
          musician={selectedMusician} currentUser={currentUser}
          onBook={() => { setBookingTarget(selectedMusician); setModal("booking"); }}
          onBack={() => setPage("search")} setModal={setModal}
        />
        </>
      )}
      {page === "dashboard" && currentUser && (
        <>
          <Breadcrumb items={[{ label: "Dashboard" }]} setPage={setPage} />
          <Dashboard currentUser={currentUser} setCurrentUser={setCurrentUser} />
        </>
      )}

      {page === "about" && (
        <>
          <Breadcrumb items={[{ label: "About GigVine" }]} setPage={setPage} />
          <AboutPage setPage={setPage} setModal={setModal} />
        </>
      )}
      {page === "contact" && (
        <>
          <Breadcrumb items={[{ label: "Contact" }]} setPage={setPage} />
          <ContactPage />
        </>
      )}
      {page === "privacy" && (
        <>
          <Breadcrumb items={[{ label: "Privacy Policy" }]} setPage={setPage} />
          <PrivacyPage />
        </>
      )}
      {page === "terms" && (
        <>
          <Breadcrumb items={[{ label: "Terms of Service" }]} setPage={setPage} />
          <TermsPage />
        </>
      )}

      {/* Modals */}
      {modal === "login" && <LoginModal onClose={() => setModal(null)} onLogin={u => { setCurrentUser(u); setModal(null); }} switchToSignup={() => setModal("signup")} switchToForgot={() => setModal("forgot")} />}
      {modal === "signup" && <SignupModal onClose={() => setModal(null)} onSignup={u => { setCurrentUser(u); setModal(null); }} switchToLogin={() => setModal("login")} />}
      {modal === "forgot" && <ForgotPasswordModal onClose={() => setModal(null)} switchToLogin={() => setModal("login")} />}
      {modal === "booking" && currentUser && bookingTarget && <BookingModal musician={bookingTarget} client={currentUser} onClose={() => setModal(null)} />}
      {modal === "booking" && !currentUser && <LoginModal onClose={() => setModal(null)} onLogin={u => { setCurrentUser(u); }} switchToSignup={() => setModal("signup")} switchToForgot={() => setModal("forgot")} hint="Log in to send a booking request." />}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <Logo size="md" />
              <p>A modern platform connecting musicians with people and organizations that need live music services.</p>
              <p className="footer-tagline">Connecting talent with opportunity.</p>
            </div>
            <div className="footer-col">
              <h4>Discover</h4>
              <a onClick={() => setPage("search")}>Find Musicians</a>
              <a onClick={() => setPage("search")}>Chorale Groups</a>
              <a onClick={() => setPage("search")}>By Instrument</a>
              <a onClick={() => setPage("search")}>By Location</a>
            </div>
            <div className="footer-col">
              <h4>Musicians</h4>
              <a onClick={() => setModal("signup")}>Join as Musician</a>
              <a onClick={() => setPage("dashboard")}>Dashboard</a>
              <a>How it Works</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a onClick={() => setPage("about")}>About GigVine</a>
              <a onClick={() => setPage("contact")}>Contact</a>
              <a onClick={() => setPage("privacy")}>Privacy Policy</a>
              <a onClick={() => setPage("terms")}>Terms of Service</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 <strong>GigVine</strong>. All rights reserved.</p>
            <p style={{ color: "var(--muted2)", fontSize: 13 }}>Built for Africa's music community.</p>
          </div>
        </div>
      </footer>
      {/* Bottom Navigation */}
      <BottomNav page={page} setPage={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} currentUser={currentUser} setModal={setModal} />

    </div>
  );
}
function HomePage({ setPage, setModal, musicians, setSelectedMusician, setBookingTarget, currentUser, searchQuery, setSearchQuery }) {
  const [heroInstrument, setHeroInstrument] = useState("");
  const [heroLocation, setHeroLocation] = useState("");
  const [heroEventType, setHeroEventType] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  const handleSearch = () => {
    setSearchQuery({ instrument: heroInstrument, location: heroLocation, eventType: heroEventType });
    setPage("search");
  };

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-grid" />
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", opacity: 0.12, zIndex: 0,
            }}
          >
            <source src="https://res.cloudinary.com/dx0nlywdu/video/upload/v1781167486/user-ai-generation-3a2mFBfeIe0N-1080p_toavzo.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay over video */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(to bottom, rgba(8,12,10,0.6) 0%, rgba(8,12,10,0.3) 50%, rgba(8,12,10,0.7) 100%)"
          }} />
        </div>
        <div className="hero-content" style={{ position: "relative", zIndex: 2 }}>
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Live Music. Your Event.
          </div>
          <h1>
            Find the Right<br />
            <em>Musician</em>
            <span style={{ display: "block", fontSize: "0.88em", color: "var(--white)" }}>for Your Event.</span>
          </h1>
          <p className="hero-sub">
            Discover, connect, and book trusted musicians for worship experiences, weddings, concerts, private events, and live performances across Nigeria.
          </p>
          <div className="hero-ctas">
            <button className="btn-gold" style={{ fontSize: 16, padding: "15px 36px" }} onClick={() => setPage("search")}>
              I Need Musicians
            </button>
            <button className="btn-ghost" style={{ fontSize: 16, padding: "15px 36px" }} onClick={() => setModal("signup")}>
              I Am a Musician
            </button>
          </div>
          <div className="hero-search">
            <div style={{ flex: 1, minWidth: 150, borderRight: "1px solid var(--border)" }}>
              <InstrumentSelect value={heroInstrument} onChange={setHeroInstrument} />
            </div>
            <select value={heroLocation} onChange={e => setHeroLocation(e.target.value)} style={{ flex: 1, minWidth: 130, borderRight: "1px solid var(--border)" }}>
              <option value="">All States</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={heroEventType} onChange={e => setHeroEventType(e.target.value)} style={{ flex: 1, minWidth: 130 }}>
              <option value="">Event Type</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={handleSearch}>Search</button>
          </div>
        </div>
      </section>

      {/* Trust */}
      <div className="trust">
        <div className="trust-inner">
          {[
            { icon: <svg className="trust-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, text: "Verified Musicians" },
            { icon: <svg className="trust-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, text: "Direct Booking" },
            { icon: <svg className="trust-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, text: "No Commission" },
            { icon: <svg className="trust-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, text: "Direct Communication" },
            { icon: <svg className="trust-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, text: "Built for Nigeria" },
            { icon: <svg className="trust-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, text: "All Event Types" },
          ].map(b => (
            <div className="trust-badge" key={b.text}>
              <span style={{ color: "var(--gold)", display: "flex" }}>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}>
        <div className="section" style={{ paddingTop: 52, paddingBottom: 52 }}>
          <div className="section-header">
            <div className="section-label">Browse by event</div>
            <h2 className="section-title">What's the occasion?</h2>
          </div>
          <div className="categories-scroll">
            {CATEGORIES.map(c => (
              <div
                key={c.id}
                className={`category-card ${activeCategory === c.id ? "active" : ""}`}
                onClick={() => { setActiveCategory(c.id); setPage("search"); }}
              >
                {c.img ? (
                  <img
                    src={c.img}
                    alt={c.label}
                    style={{
                      position: "absolute", inset: 0, width: "100%", height: "100%",
                      objectFit: "cover", filter: "brightness(0.45)",
                      transition: "transform .4s ease",
                    }}
                  />
                ) : (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: c.gradient || "linear-gradient(135deg,#1a3a1a,#2d5a2d)",
                  }} />
                )}
                <div className="category-card-content">
                  <div className="category-icon-wrap">{c.svg}</div>
                  <div className="category-label">{c.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: "var(--bg)" }}>
        <div className="section">
          <div className="section-header center">
            <div className="section-label">Simple process</div>
            <h2 className="section-title">How GigVine Works</h2>
            <p className="section-sub">From discovery to performance in four simple steps.</p>
          </div>
          <div className="how-grid">
            {[
              { n: "01", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, title: "Discover", desc: "Search and compare musicians by instrument, location, experience, and event type." },
              { n: "02", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, title: "Connect", desc: "Send booking details directly to your chosen musician or chorale group." },
              { n: "03", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, title: "Confirm", desc: "Finalize arrangements and coordinate payment directly between both parties." },
              { n: "04", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, title: "Perform", desc: "Experience world-class live music at your event." },
            ].map(h => (
              <div className="how-card" key={h.n}>
                <div className="how-number">{h.n}</div>
                <div className="how-icon-wrap" style={{ color: "var(--gold)" }}>{h.svg}</div>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meet Musicians CTA */}
      <div style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)" }}>
        <div className="section" style={{ paddingTop: 60, paddingBottom: 60, textAlign: "center" }}>
          <div className="section-label" style={{ justifyContent: "center" }}>Our Musicians</div>
          <h2 className="section-title" style={{ marginBottom: 12 }}>Meet Talented Musicians</h2>
          <p className="section-sub" style={{ margin: "0 auto 32px" }}>
            Browse verified musicians, chorale groups, worship teams, and instrumental ensembles available for your next event.
          </p>
          <button className="btn-gold" style={{ fontSize: 16, padding: "15px 40px" }} onClick={() => setPage("search")}>
            Meet Our Musicians →
          </button>
        </div>
      </div>

      {/* Why GigVine */}
      <div style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        <div className="section">
          <div className="section-header center">
            <div className="section-label">Why us</div>
            <h2 className="section-title">Why Professionals Choose GigVine</h2>
          </div>
          <div className="why-grid">
            {[
              { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>, title: "Trusted Talent", desc: "Every musician on GigVine is reviewed and rated by real clients. You only see the best." },
              { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, title: "Fast Discovery", desc: "Find and contact the right musician in minutes, not days. Filter by instrument, location, and more." },
              { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: "Simple Coordination", desc: "Direct communication between clients and musicians. No middlemen, no complications." },
              { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, title: "Built for Live", desc: "Designed specifically for live music experiences, from intimate worship to major concerts." },
            ].map(w => (
              <div className="why-card" key={w.title}>
                <div className="why-icon" style={{ color: "var(--gold)" }}>{w.svg}</div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", padding: "80px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="section-label" style={{ textAlign: "center", marginBottom: 16 }}>Join GigVine</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 700, color: "var(--white)", marginBottom: 16 }}>
            Ready to find your next musician?
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
            Join hundreds of event organizers and churches already using GigVine to book trusted musicians across Africa.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-gold" style={{ fontSize: 16, padding: "16px 36px" }} onClick={() => setPage("search")}>Find a Musician</button>
            <button className="btn-ghost" style={{ fontSize: 16, padding: "16px 36px" }} onClick={() => setModal("signup")}>Join as Musician</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MusicianCard ─────────────────────────────────────────────────────────────
function MusicianCard({ musician, onView, onBook }) {
  const initials = musician.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";
  const isGroup = musician.profileType === "group";
  const completeness = getProfileCompleteness(musician);
  const isComplete = completeness && completeness.score >= 80;

  return (
    <div className="musician-card" onClick={onView}>
      <div className="musician-card-header">
        <div className="musician-avatar">
          {musician.photoURL
            ? <img src={musician.photoURL} alt={musician.name} />
            : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <h3 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{musician.name}</h3>
            {isComplete && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" fill="#C9A84C"/>
                <polyline points="9 12 11 14 15 10" stroke="#080c0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {musician.location || "Location not set"}
          </p>
          {isGroup && <span className="chorale-badge" style={{ marginTop: 4, display: "inline-block" }}>Chorale Group</span>}
        </div>
      </div>
      <div className="musician-card-body">
        <div className="tags">
          {(musician.instruments || []).slice(0, 3).map(i => <span key={i} className="tag">{i}</span>)}
          {(musician.instruments || []).length > 3 && <span className="tag">+{musician.instruments.length - 3}</span>}
        </div>
        <p className="musician-bio">
          {musician.bio ? musician.bio.slice(0, 90) + (musician.bio.length > 90 ? "…" : "") : "Available for professional engagements."}
        </p>
        {/* Trust signals */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          {musician.avgRating ? (
            <span style={{ fontSize: 12, color: "var(--gold)", display: "flex", alignItems: "center", gap: 3 }}>
              ★ {musician.avgRating} <span style={{ color: "var(--muted)" }}>({musician.reviewCount})</span>
            </span>
          ) : null}
          {musician.inquiryCount > 0 && (
            <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              {musician.inquiryCount} inquiries
            </span>
          )}
          {musician.experience > 0 && (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {musician.experience} yrs exp
            </span>
          )}
        </div>
        <div className="musician-card-footer">
          <div style={{ fontSize: 11, color: "var(--muted2)" }}>
            {completeness && completeness.score < 80 ? `Profile ${completeness.score}% complete` : ""}
          </div>
          <div className="card-actions">
            <button className="btn-card-ghost" onClick={e => { e.stopPropagation(); onView(); }}>Profile</button>
            <button className="btn-card-primary" onClick={e => { e.stopPropagation(); onBook(); }}>Book</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SearchPage ───────────────────────────────────────────────────────────────
function SearchPage({ setSelectedMusician, setBookingTarget, currentUser, setModal, initialQuery }) {
  const [instrument, setInstrument] = useState(initialQuery?.instrument || "");
  const [location, setLocation] = useState(initialQuery?.location || "");
  const [minExp, setMinExp] = useState("");
  const [musicians, setMusicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const doSearch = async (reset = true) => {
    if (reset) { setLoading(true); setLastVisible(null); }
    else setLoadingMore(true);
    try {
      const result = await getMusicians({ instrument, location, minExp, lastDoc: reset ? null : lastVisible });
      if (reset) setMusicians(result.musicians);
      else setMusicians(prev => [...prev, ...result.musicians]);
      setHasMore(result.hasMore);
      setLastVisible(result.lastVisible);
    } catch (e) { console.error(e); }
    if (reset) setLoading(false);
    else setLoadingMore(false);
  };

  useEffect(() => { doSearch(true); }, []);

  const SkeletonGrid = () => (
    <div className="musician-grid">
      {[1,2,3,4,5,6].map(i => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-header">
            <div className="skeleton skeleton-circle" />
            <div className="skeleton-lines">
              <div className="skeleton skeleton-line" style={{ width: "60%" }} />
              <div className="skeleton skeleton-line" style={{ width: "40%" }} />
            </div>
          </div>
          <div className="skeleton-body">
            <div className="skeleton-tags">
              <div className="skeleton skeleton-tag" />
              <div className="skeleton skeleton-tag" />
            </div>
            <div className="skeleton skeleton-line" style={{ width: "100%" }} />
            <div className="skeleton skeleton-line" style={{ width: "75%" }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="search-page">
      <div className="search-page-header">
        <h2>Find a Musician</h2>
        <p>{loading ? "Searching…" : `${musicians.length} musician${musicians.length !== 1 ? "s" : ""} available`}</p>
      </div>
      <div className="search-filters">
        <div className="filter-group">
          <label>Instrument</label>
          <InstrumentSelect value={instrument} onChange={setInstrument} />
        </div>
        <div className="filter-group">
          <label>Location</label>
          <select value={location} onChange={e => setLocation(e.target.value)}>
            <option value="">All States</option>
            {NIGERIAN_STATES.map(s => <option key={s} value={s}>🇳🇬 {s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Experience</label>
          <select value={minExp} onChange={e => setMinExp(e.target.value)}>
            <option value="">Any level</option>
            <option value="2">2+ years</option>
            <option value="5">5+ years</option>
            <option value="8">8+ years</option>
          </select>
        </div>
        <button className="btn-gold" style={{ height: 42, alignSelf: "flex-end" }} onClick={() => doSearch(true)}>Search</button>
      </div>

      {loading ? <SkeletonGrid /> : musicians.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .4 }}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>
          <h3>No musicians found</h3>
          <p>Try adjusting your filters or broadening your search.</p>
        </div>
      ) : (
        <>
          <div className="musician-grid">
            {musicians.map(m => (
              <MusicianCard key={m.id} musician={m}
                onView={() => setSelectedMusician(m)}
                onBook={() => { if (!currentUser) { setModal("booking"); return; } setBookingTarget(m); }}
              />
            ))}
          </div>
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button className="btn-ghost" style={{ padding: "12px 32px" }} onClick={() => doSearch(false)} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load More Musicians"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── MusicianProfilePage ──────────────────────────────────────────────────────
function MusicianProfilePage({ musician, currentUser, onBook, onBack, setModal }) {
  const initials = musician.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";
  const isGroup = musician.profileType === "group";
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [eligibleBooking, setEligibleBooking] = useState(null);

  useEffect(() => {
    getReviewsForMusician(musician.id).then(setReviews).catch(console.error);
    // Track profile view
    recordProfileView(musician.id, currentUser?.id).catch(console.error);
    if (currentUser?.role === "client") {
      getBookingsForClient(currentUser.id).then(bookings => {
        const eligible = bookings.find(b => b.musicianId === musician.id && b.status === "accepted" && !b.reviewed);
        setEligibleBooking(eligible || null);
      });
    }
  }, [musician.id, currentUser]);

  return (
    <div className="profile-page">
      <div className="profile-hero-card">
        <div className="profile-cover">
          <div className="profile-cover-pattern" />
        </div>
        <div className="profile-info">
          <div className="profile-big-avatar">
            {musician.photoURL
              ? <img src={musician.photoURL} alt={musician.name} />
              : initials}
          </div>
          <div className="profile-name-row">
            <div>
              <h1 className="profile-name">{musician.name}</h1>
              <p className="profile-location" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {musician.location || "Location not set"}
          </p>
              {isGroup && <span className="chorale-badge">🎶 Chorale Group{musician.memberCount ? ` · ${musician.memberCount} members` : ""}</span>}
              {musician.avgRating && (
                <p style={{ color: "var(--gold)", fontSize: 14, marginTop: 8 }}>
                  ★ {musician.avgRating} / 5 · {musician.reviewCount} review{musician.reviewCount !== 1 ? "s" : ""}
                </p>
              )}
              <div className="tags" style={{ marginTop: 12 }}>
                {(musician.instruments || []).map(i => <span key={i} className="tag">{i}</span>)}
              </div>
            </div>
            <button className="btn-gold" style={{ padding: "13px 28px", fontSize: 15, alignSelf: "flex-start" }}
              onClick={() => currentUser ? onBook() : setModal("booking")}>
              Request Booking
            </button>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3>About</h3>
        <p>{musician.bio || "No bio provided yet."}</p>
      </div>

      <div className="profile-section">
        <h3>Details</h3>
        <div className="profile-meta-grid">
          <div className="profile-meta-item">
            <h4>Experience</h4>
            <p>{musician.experience || 0} years</p>
          </div>
          <div className="profile-meta-item">
            <h4>Availability</h4>
            <p>{musician.availability || "Contact to confirm"}</p>
          </div>
          {isGroup && musician.memberCount > 0 && (
            <div className="profile-meta-item">
              <h4>Members</h4>
              <p>{musician.memberCount} members</p>
            </div>
          )}
        </div>
      </div>

      {musician.videoURL && (
        <div className="profile-section">
          <h3>Performance</h3>
          {musician.videoURL.includes("youtube.com") || musician.videoURL.includes("youtu.be") ? (
            <a href={musician.videoURL} target="_blank" rel="noreferrer"
              style={{ color: "var(--gold)", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
              Watch on YouTube →
            </a>
          ) : (
            <video src={musician.videoURL} controls style={{ width: "100%", borderRadius: 10, maxHeight: 320 }} />
          )}
        </div>
      )}

      {musician.mediaLink && (
        <div className="profile-section">
          <h3>Media</h3>
          <a href={musician.mediaLink} target="_blank" rel="noreferrer"
            style={{ color: "var(--gold)", fontWeight: 600, fontSize: 14 }}>
            Listen / Watch →
          </a>
        </div>
      )}

      <div className="profile-section">
        <h3>Payment</h3>
        <div className="payment-note">
          <span>💳</span>
          <div>
            <strong>Once your booking is confirmed, you and the musician will agree on payment terms directly.</strong> GigVine does not process payments at this stage. We recommend agreeing on a clear amount and payment method before the event.
            {musician.bank && <p style={{ marginTop: 4, opacity: 0.8 }}>{musician.bank}</p>}
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
          <h3 style={{ borderBottom: "none", paddingBottom: 0, margin: 0 }}>Reviews {reviews.length > 0 && `(${reviews.length})`}</h3>
          {eligibleBooking && !showReviewForm && (
            <button className="btn-card-primary" onClick={() => setShowReviewForm(true)}>Leave a Review</button>
          )}
        </div>
        <div style={{ borderBottom: "1px solid var(--border)", margin: "14px 0" }} />

        {showReviewForm && (
          <ReviewForm musician={musician} client={currentUser} bookingId={eligibleBooking.id}
            onDone={() => { setShowReviewForm(false); setEligibleBooking(null); getReviewsForMusician(musician.id).then(setReviews); }} />
        )}

        {reviews.length === 0 && !showReviewForm ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No reviews yet.</p>
        ) : (
          reviews.map(r => (
            <div className="review-card" key={r.id}>
              <div className="review-header">
                <span className="review-author">{r.clientName}</span>
                <span className="review-date">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : ""}</span>
              </div>
              <div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              <p className="review-comment">{r.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── ReviewForm ───────────────────────────────────────────────────────────────
function ReviewForm({ musician, client, bookingId, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!comment.trim()) { setError("Please write a short comment."); return; }
    setLoading(true); setError("");
    try {
      await submitReview({ musicianId: musician.id, clientId: client.id, clientName: client.name, bookingId, rating, comment });
      onDone();
    } catch (e) { setError("Failed to submit. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid var(--border)" }}>
      <h4 style={{ color: "var(--white)", marginBottom: 12, fontSize: 15 }}>Your Review</h4>
      {error && <div className="alert error">{error}</div>}
      <div className="star-input">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)}
            style={{ color: s <= (hover || rating) ? "var(--gold)" : "rgba(255,255,255,0.15)" }}>★</button>
        ))}
      </div>
      <div className="form-group">
        <textarea className="form-control" placeholder="Share your experience…" value={comment} onChange={e => setComment(e.target.value)} rows={3} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-card-primary" onClick={submit} disabled={loading} style={{ padding: "9px 20px" }}>
          {loading ? <span className="spinner" /> : "Submit"}
        </button>
        <button className="btn-card-ghost" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ currentUser, setCurrentUser }) {
  const [tab, setTab] = useState(currentUser.role === "musician" ? "overview" : "sent");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState(null);
  const isAdmin = currentUser.email === "gigvineafrica@gmail.com";

  // Profile completeness
  const completeness = currentUser.role === "musician" ? getProfileCompleteness(currentUser) : null;

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const data = currentUser.role === "musician"
      ? await getBookingsForMusician(currentUser.id)
      : await getBookingsForClient(currentUser.id);
    setBookings(data);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    if (tab === "requests" || tab === "sent") loadBookings();
    if (tab === "admin" && isAdmin) getAdminStats().then(setAdminStats);
  }, [tab, loadBookings]);

  const handleStatus = async (id, status) => {
    await updateBookingStatus(id, status);
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
  };

  const initials = currentUser.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";

  const musicianTabs = [
    { id: "overview", label: "Overview" },
    { id: "requests", label: "Bookings" },
    { id: "profile", label: "Edit Profile" },
    ...(isAdmin ? [{ id: "admin", label: "Admin" }] : []),
  ];
  const clientTabs = [
    { id: "sent", label: "My Bookings" },
    ...(isAdmin ? [{ id: "admin", label: "Admin" }] : []),
  ];
  const tabs = currentUser.role === "musician" ? musicianTabs : clientTabs;

  return (
    <div className="dashboard">
      <div className="dash-welcome">
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div className="musician-avatar" style={{ width: 52, height: 52, fontSize: 18 }}>
            {currentUser.photoURL ? <img src={currentUser.photoURL} alt={currentUser.name} /> : initials}
          </div>
          <div>
            <h2 style={{ marginBottom: 2 }}>Welcome, {currentUser.name?.split(" ")[0]}</h2>
            <p style={{ textTransform: "capitalize" }}>{currentUser.role} account</p>
          </div>
        </div>
      </div>

      {/* Profile completeness banner for musicians */}
      {currentUser.role === "musician" && completeness && completeness.score < 100 && (
        <div className="profile-complete-wrap">
          <div className="profile-complete-header">
            <span className="profile-complete-title">Profile Completeness</span>
            <span className="profile-complete-pct">{completeness.score}%</span>
          </div>
          <div className="profile-complete-bar">
            <div className="profile-complete-fill" style={{ width: `${completeness.score}%` }} />
          </div>
          {completeness.missing.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Complete your profile to get more bookings:</p>
              <div className="profile-complete-missing">
                {completeness.missing.map(m => (
                  <span key={m} className="profile-complete-tag">+ {m}</span>
                ))}
              </div>
              <button className="btn-card-primary" style={{ marginTop: 12 }} onClick={() => setTab("profile")}>
                Complete Profile
              </button>
            </>
          )}
        </div>
      )}

      <div className="dash-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`dash-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab — musician analytics */}
      {tab === "overview" && currentUser.role === "musician" && (
        <div>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-number">{currentUser.profileViews || 0}</div>
              <div className="analytics-label">Profile Views</div>
              <div className="analytics-sub">Total visits to your profile</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-number">{currentUser.inquiryCount || 0}</div>
              <div className="analytics-label">Inquiries Received</div>
              <div className="analytics-sub">Booking requests sent to you</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-number">{currentUser.avgRating ? `${currentUser.avgRating}★` : "—"}</div>
              <div className="analytics-label">Average Rating</div>
              <div className="analytics-sub">{currentUser.reviewCount || 0} review{currentUser.reviewCount !== 1 ? "s" : ""}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-number">{completeness ? `${completeness.score}%` : "—"}</div>
              <div className="analytics-label">Profile Score</div>
              <div className="analytics-sub">Higher score = more visibility</div>
            </div>
          </div>
          <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius2)", padding: "24px 28px" }}>
            <h3 style={{ color: "var(--white)", fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Tips to get more bookings</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { done: !!(currentUser.photoURL), tip: "Add a professional profile photo" },
                { done: !!(currentUser.bio && currentUser.bio.length > 50), tip: "Write a detailed bio (at least 50 characters)" },
                { done: !!(currentUser.instruments && currentUser.instruments.length > 0), tip: "Add your instruments" },
                { done: !!(currentUser.location), tip: "Set your location" },
                { done: !!(currentUser.availability), tip: "Set your availability" },
                { done: !!(currentUser.bank), tip: "Add your bank details so clients can pay you" },
              ].map(t => (
                <div key={t.tip} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: t.done ? "rgba(34,197,94,0.15)" : "var(--border)", border: `1px solid ${t.done ? "rgba(34,197,94,0.3)" : "var(--border2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {t.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ color: t.done ? "var(--muted)" : "var(--white)", textDecoration: t.done ? "line-through" : "none" }}>{t.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bookings tab */}
      {(tab === "requests" || tab === "sent") && (
        loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner-lg" /></div>
        ) : bookings.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .4 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
            <h3>No bookings yet</h3>
            <p>{currentUser.role === "musician" ? "Booking requests will appear here." : "Your sent requests will appear here."}</p>
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map(bk => (
              <div className="booking-card" key={bk.id}>
                <div className="booking-info">
                  <h4>{currentUser.role === "musician" ? `Request from ${bk.clientName}` : `Booking: ${bk.musicianName}`}</h4>
                  <p>📅 {bk.date} &nbsp;·&nbsp; {(bk.message || "").slice(0, 80)}{(bk.message || "").length > 80 ? "…" : ""}</p>
                </div>
                <div className="booking-actions">
                  <span className={`status-badge ${bk.status || "pending"}`}>{(bk.status || "pending").charAt(0).toUpperCase() + (bk.status || "pending").slice(1)}</span>
                  {currentUser.role === "musician" && bk.status === "pending" && (
                    <>
                      <button className="btn-accept" onClick={() => handleStatus(bk.id, "accepted")}>Accept</button>
                      <button className="btn-decline" onClick={() => handleStatus(bk.id, "declined")}>Decline</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "profile" && <EditProfileForm currentUser={currentUser} setCurrentUser={setCurrentUser} />}

      {/* Admin tab */}
      {tab === "admin" && isAdmin && (
        <div>
          <h3 style={{ color: "var(--white)", fontFamily: "Playfair Display,serif", fontSize: 22, marginBottom: 8 }}>Platform Health</h3>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Live marketplace metrics</p>
          {!adminStats ? (
            <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner-lg" /></div>
          ) : (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Users</p>
              <div className="analytics-grid" style={{ marginBottom: 24 }}>
                <div className="analytics-card">
                  <div className="analytics-number">{adminStats.totalUsers}</div>
                  <div className="analytics-label">Total Users</div>
                  <div className="analytics-sub">{adminStats.totalMusicians} musicians · {adminStats.totalClients} clients</div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-number">{adminStats.activeMusicians}</div>
                  <div className="analytics-label">Active Musicians</div>
                  <div className="analytics-sub">Profiles with bio filled</div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-number">{adminStats.avgCompletion || 0}%</div>
                  <div className="analytics-label">Avg Profile Score</div>
                  <div className="analytics-sub">Across all musicians</div>
                </div>
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Discovery</p>
              <div className="analytics-grid" style={{ marginBottom: 24 }}>
                <div className="analytics-card">
                  <div className="analytics-number">{adminStats.totalViews || 0}</div>
                  <div className="analytics-label">Total Profile Views</div>
                  <div className="analytics-sub">Across all musicians</div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-number">{adminStats.totalInquiries || 0}</div>
                  <div className="analytics-label">Total Inquiries</div>
                  <div className="analytics-sub">Booking requests sent</div>
                </div>
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Bookings</p>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="analytics-number">{adminStats.totalBookings}</div>
                  <div className="analytics-label">Total Bookings</div>
                  <div className="analytics-sub">{adminStats.pendingBookings} pending</div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-number">{adminStats.acceptedBookings}</div>
                  <div className="analytics-label">Accepted</div>
                  <div className="analytics-sub">Confirmed bookings</div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-number">{adminStats.conversionRate}%</div>
                  <div className="analytics-label">Conversion Rate</div>
                  <div className="analytics-sub">Inquiries to bookings</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── EditProfileForm ──────────────────────────────────────────────────────────
function EditProfileForm({ currentUser, setCurrentUser }) {
  const [form, setForm] = useState({
    name: currentUser.name || "", location: currentUser.location || "",
    bio: currentUser.bio || "", experience: currentUser.experience || "",
    availability: currentUser.availability || "", bank: currentUser.bank || "",
    mediaLink: currentUser.mediaLink || "", instruments: currentUser.instruments || [],
    memberCount: currentUser.memberCount || "", photoURL: currentUser.photoURL || "",
    videoURL: currentUser.videoURL || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const isGroup = currentUser.profileType === "group";

  const toggleInstrument = i => setForm(f => ({
    ...f, instruments: f.instruments.includes(i) ? f.instruments.filter(x => x !== i) : [...f.instruments, i]
  }));

  const save = async () => {
    setSaving(true); setError("");
    try {
      await updateUserProfile(currentUser.id, form);
      setCurrentUser(u => ({ ...u, ...form }));
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError("Failed to save. Please try again."); }
    setSaving(false);
  };

  return (
    <div className="profile-form">
      {saved && <div className="alert success">Profile saved successfully!</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label>{isGroup ? "Group Name" : "Full Name"}</label>
          <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Location</label>
          <select className="form-control" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
            <option value="">Select your state…</option>
            {NIGERIAN_STATES.map(s => <option key={s} value={s}>🇳🇬 {s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Years of Experience</label>
          <input className="form-control" type="number" min="0" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: Number(e.target.value) }))} />
        </div>
        <div className="form-group">
          <label>Availability</label>
          <input className="form-control" placeholder="e.g. Weekends only" value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))} />
        </div>
        {isGroup && (
          <div className="form-group">
            <label>Number of Members</label>
            <input className="form-control" type="number" min="1" value={form.memberCount} onChange={e => setForm(f => ({ ...f, memberCount: Number(e.target.value) }))} />
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Bio</label>
        <textarea className="form-control" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
      </div>

      <div className="form-group">
        <label>Instruments</label>
        {INSTRUMENT_GROUPS.map(g => (
          <div key={g.group} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{g.group}</p>
            <div className="instruments-grid">
              {g.items.map(i => (
                <button key={i} type="button" className={`instrument-toggle ${form.instruments.includes(i) ? "selected" : ""}`} onClick={() => toggleInstrument(i)}>{i}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="form-group">
        <label>Profile Photo</label>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", border: "2px solid var(--border2)",
            background: "var(--bg2)", overflow: "hidden", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "var(--gold)"
          }}>
            {form.photoURL
              ? <img src={form.photoURL} alt="preview" onError={e => e.target.style.display = "none"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (currentUser.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?")}
          </div>
          <div style={{ flex: 1 }}>
            <input
              className="form-control"
              placeholder="Paste your photo link here…"
              value={form.photoURL}
              onChange={e => setForm(f => ({ ...f, photoURL: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--white)", marginBottom: 8 }}>How to get your photo link:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              "1. Upload your photo to Google Drive",
              "2. Right-click the photo → click 'Share'",
              "3. Set access to 'Anyone with the link'",
              "4. Click 'Copy link' and paste it above",
            ].map(s => <p key={s} style={{ fontSize: 12, color: "var(--muted)" }}>{s}</p>)}
          </div>
          <p style={{ fontSize: 11, color: "var(--gold)", marginTop: 10 }}>
            💡 You can also use a direct image URL from any public website.
          </p>
        </div>
      </div>

      <div className="form-group">
        <label>Performance Video URL</label>
        <input className="form-control" placeholder="YouTube or Google Drive link" value={form.videoURL} onChange={e => setForm(f => ({ ...f, videoURL: e.target.value }))} />
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>Paste a YouTube or Google Drive link. Make sure it's set to public.</p>
      </div>

      <div className="form-group">
        <label>Bank Transfer Details</label>
        <input className="form-control" placeholder="e.g. GTBank – 0123456789 – Your Name" value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} />
        <div className="payment-note" style={{ marginTop: 8 }}>
          <span>💳</span>
          <span>Clients will see these details after a booking is accepted.</span>
        </div>
      </div>

      <div className="form-group">
        <label>External Media Link</label>
        <input className="form-control" placeholder="https://soundcloud.com/…" value={form.mediaLink} onChange={e => setForm(f => ({ ...f, mediaLink: e.target.value }))} />
      </div>

      <button className="btn-full" onClick={save} disabled={saving}>
        {saving ? <span className="spinner" /> : "Save Profile"}
      </button>
    </div>
  );
}

// ─── VerifyBanner ─────────────────────────────────────────────────────────────
function VerifyBanner({ currentUser, setCurrentUser }) {
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);

  const resend = async () => {
    await resendVerificationEmail();
    setSent(true); setTimeout(() => setSent(false), 5000);
  };

  const checkVerified = async () => {
    setChecking(true);
    const verified = await refreshEmailVerification();
    if (verified) setCurrentUser(u => ({ ...u, emailVerified: true }));
    else alert("Not verified yet. Please check your inbox and click the link.");
    setChecking(false);
  };

  return (
    <div className="verify-banner">
      <span>📧 Please verify your email address. Check your inbox.</span>
      {sent ? <span style={{ color: "#4ade80", fontWeight: 700 }}>✅ Sent!</span> : <button onClick={resend}>Resend Email</button>}
      <button className="btn-check" onClick={checkVerified} disabled={checking}>{checking ? "Checking…" : "I've Verified"}</button>
    </div>
  );
}

// ─── ForgotPasswordModal ──────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose, switchToLogin }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.trim()) return;
    setLoading(true); setError("");
    try { await resetPassword(email.trim()); setDone(true); }
    catch (e) { setError("No account found with that email."); }
    setLoading(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><h2 className="modal-title">Reset Password</h2><p className="modal-sub">We'll send a reset link to your email.</p></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
            <h3 style={{ color: "var(--white)", fontFamily: "Playfair Display", marginBottom: 8 }}>Check your inbox!</h3>
            <p style={{ color: "var(--muted)", marginBottom: 20 }}>Reset link sent to <strong>{email}</strong>.</p>
            <button className="btn-full" onClick={switchToLogin}>Back to Login</button>
          </div>
        ) : (
          <>
            {error && <div className="alert error">{error}</div>}
            <div className="form-group">
              <label>Email Address</label>
              <input className="form-control" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
            </div>
            <button className="btn-full" onClick={submit} disabled={loading || !email.trim()}>
              {loading ? <span className="spinner" /> : "Send Reset Link"}
            </button>
            <div className="modal-footer">Remember your password? <button onClick={switchToLogin}>Log in</button></div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── LoginModal ───────────────────────────────────────────────────────────────
function LoginModal({ onClose, onLogin, switchToSignup, switchToForgot, hint }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try { const user = await login(email.trim(), password); onLogin(user); }
    catch (e) { setError("Invalid email or password."); }
    setLoading(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><h2 className="modal-title">Welcome back</h2><p className="modal-sub">{hint || "Log in to your GigVine account"}</p></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="form-group"><label>Email</label><input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <div className="form-group"><label>Password</label><input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} /></div>
        <button className="btn-full" onClick={submit} disabled={loading}>{loading ? <span className="spinner" /> : "Log In"}</button>
        <div style={{ textAlign: "right", marginTop: 10 }}>
          <button onClick={switchToForgot} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>Forgot password?</button>
        </div>
        <div className="modal-footer">Don't have an account? <button onClick={switchToSignup}>Sign up free</button></div>
      </div>
    </div>
  );
}

// ─── SignupModal ──────────────────────────────────────────────────────────────
function SignupModal({ onClose, onSignup, switchToLogin }) {
  const [role, setRole] = useState("");
  const [profileType, setProfileType] = useState("individual");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name || !form.email || !form.password || !role) { setError("Please fill all fields and choose a role."); return; }
    const pwErrors = validatePassword(form.password);
    if (pwErrors.length > 0) { setError("Password doesn't meet requirements."); return; }
    setLoading(true); setError("");
    try {
      const user = await signup({ ...form, role, profileType: role === "musician" ? profileType : "individual" });
      onSignup(user);
    } catch (e) {
      setError(e.message?.includes("email-already-in-use") ? "This email is already registered." : e.message || "Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><h2 className="modal-title">Create Account</h2><p className="modal-sub">The stage is set. Let's find your musician.</p></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert error">{error}</div>}

        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>I am joining as…</p>
        <div className="role-grid">
          {[
            { id: "client", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: "Client", desc: "I want to book musicians" },
            { id: "musician", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, title: "Musician / Group", desc: "I offer music services" }
          ].map(r => (
            <div key={r.id} className={`role-card ${role === r.id ? "active" : ""}`} onClick={() => setRole(r.id)}>
              <div className="role-icon" style={{ color: role === r.id ? "var(--gold)" : "var(--muted)" }}>{r.icon}</div>
              <h4>{r.title}</h4>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>

        {role === "musician" && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Profile type</p>
            <div className="role-grid" style={{ marginBottom: 18 }}>
              {[
                { id: "individual", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>, title: "Individual", desc: "Solo musician" },
                { id: "group", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: "Chorale Group", desc: "Ensemble or choir" }
              ].map(r => (
                <div key={r.id} className={`role-card ${profileType === r.id ? "active" : ""}`} onClick={() => setProfileType(r.id)}>
                  <div className="role-icon" style={{ color: profileType === r.id ? "var(--gold)" : "var(--muted)" }}>{r.icon}</div>
                  <h4>{r.title}</h4><p>{r.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="form-group">
          <label>{role === "musician" && profileType === "group" ? "Group Name" : "Full Name"}</label>
          <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && submit()} />
          {form.password.length > 0 && (() => {
            const errors = validatePassword(form.password);
            const strength = 4 - errors.length;
            const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
            const rules = [
              { label: "8+ characters", pass: form.password.length >= 8 },
              { label: "Uppercase letter", pass: /[A-Z]/.test(form.password) },
              { label: "Number", pass: /[0-9]/.test(form.password) },
              { label: "Special character", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) },
            ];
            return (
              <>
                <div className="password-strength"><div className="password-strength-bar" style={{ width: `${strength * 25}%`, background: colors[strength - 1] || "#333" }} /></div>
                <div className="password-rules">{rules.map(r => <span key={r.label} className={`password-rule ${r.pass ? "pass" : "fail"}`}>{r.pass ? "✓" : "✗"} {r.label}</span>)}</div>
              </>
            );
          })()}
        </div>

        <button className="btn-full" onClick={submit} disabled={loading}>{loading ? <span className="spinner" style={{ borderTopColor: "#0a0f0d" }} /> : "Create Account"}</button>
        <div className="modal-footer">Already have an account? <button onClick={switchToLogin}>Log in</button></div>
      </div>
    </div>
  );
}

// ─── BookingModal ─────────────────────────────────────────────────────────────
function BookingModal({ musician, client, onClose }) {
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [eventType, setEventType] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!date || !message.trim()) return;
    setLoading(true); setError("");
    try {
      await createBooking({
        musicianId: musician.id,
        musicianName: musician.name,
        musicianEmail: musician.email || "",
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email || "",
        date,
        message: `[${eventType || "Event"}] ${message}`
      });
      setDone(true);
    } catch (e) { setError("Failed to send request. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div><h2 className="modal-title">Request Booking</h2><p className="modal-sub">Sending to <strong style={{ color: "var(--white)" }}>{musician.name}</strong></p></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {done ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
            <h3 style={{ color: "var(--white)", fontFamily: "Playfair Display", marginBottom: 10, fontSize: 22 }}>Request Sent!</h3>
            <p style={{ color: "var(--muted)", marginBottom: 20, lineHeight: 1.6 }}>{musician.name} will review your request and respond. Track the status in your dashboard.</p>
            <div className="payment-note"><span>💳</span><span>Once your booking is confirmed, you and the musician will agree on payment terms directly. We recommend discussing the amount and payment method before the event.</span></div>
            <button className="btn-full" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            {error && <div className="alert error">{error}</div>}
            <div className="form-group">
              <label>Event Type</label>
              <select className="form-control" value={eventType} onChange={e => setEventType(e.target.value)}>
                <option value="">Select event type…</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Event Date</label>
              <input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="form-group">
              <label>Event Details & Special Requests</label>
              <textarea className="form-control" placeholder="Describe the event, duration, location, and any special requests…" value={message} onChange={e => setMessage(e.target.value)} rows={4} />
            </div>
            <div className="payment-note"><span>💳</span><span>Payment is arranged directly between you and the musician after confirmation.</span></div>
            <button className="btn-full" style={{ marginTop: 16 }} onClick={submit} disabled={loading || !date || !message.trim()}>
              {loading ? <span className="spinner" style={{ borderTopColor: "#0a0f0d" }} /> : "Send Booking Request"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── About Page ───────────────────────────────────────────────────────────────
function AboutPage({ setPage, setModal }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 32px" }}>
      <div style={{ marginBottom: 48 }}>
        <div className="section-label">Our story</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, color: "var(--white)", lineHeight: 1.1, margin: "12px 0 20px" }}>
          Connecting Talent<br /><em style={{ color: "var(--gold)", fontStyle: "normal" }}>With Opportunity.</em>
        </h1>
        <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.8, maxWidth: 600 }}>
          GigVine was built to solve a real problem. Churches, event organizers, and private clients across Africa struggle to find reliable, skilled musicians quickly. Musicians, on the other hand, struggle to get discovered beyond their immediate network.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 48 }}>
        {[
          { icon: "🎵", title: "Our Mission", desc: "To make live music accessible to every event and every budget across Africa. We connect the right talent with the right opportunity." },
          { icon: "🌍", title: "Our Vision", desc: "A future where every church, wedding, concert, and private event in Africa has access to world-class musicians at the tap of a button." },
          { icon: "💡", title: "Our Approach", desc: "Simple, direct, human. No complexity. Musicians list their services, clients find and book them, and arrangements happen directly between both parties." },
        ].map(c => (
          <div key={c.title} className="why-card">
            <div className="why-icon">{c.icon}</div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="profile-section" style={{ marginBottom: 24 }}>
        <h3>What is GigVine?</h3>
        <p style={{ marginBottom: 14 }}>GigVine is a modern marketplace that connects musicians: soloists, instrumentalists, vocalists, and chorale groups, with people and organizations that need live music services.</p>
        <p style={{ marginBottom: 14 }}>Whether you need a keyboardist for a Sunday service, a full choir for a wedding, or a live band for a corporate event, GigVine helps you find, contact, and book the right musician in minutes.</p>
        <p>We serve churches, event organizers, wedding planners, corporate clients, concert promoters, and private individuals across Nigeria and Africa.</p>
      </div>

      <div className="profile-section" style={{ marginBottom: 24 }}>
        <h3>Why the name GigVine?</h3>
        <p>A <strong style={{ color: "var(--white)" }}>gig</strong> is a live music performance. A <strong style={{ color: "var(--white)" }}>vine</strong> grows naturally, connecting and spreading. GigVine represents a living ecosystem where music opportunities flow naturally between musicians and clients, growing organically, like a vine.</p>
      </div>

      <div className="profile-section" style={{ marginBottom: 48 }}>
        <h3>Built for Africa</h3>
        <p style={{ marginBottom: 14 }}>GigVine is built specifically for the African music and events market, starting with Nigeria and expanding across the continent. We understand the unique needs of African churches, events, and musicians.</p>
        <p>Our platform is designed to work even on slower connections, with a simple and intuitive interface that anyone can use.</p>
      </div>

      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius2)", padding: "40px 32px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "var(--white)", marginBottom: 12 }}>
          Ready to get started?
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: 28, fontSize: 15 }}>
          Join hundreds of musicians and clients already using GigVine across Africa.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-gold" onClick={() => setPage("search")}>Find a Musician</button>
          <button className="btn-ghost" onClick={() => setModal("signup")}>Join as Musician</button>
        </div>
      </div>
    </div>
  );
}

// ─── Contact Page ─────────────────────────────────────────────────────────────
function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = () => {
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    // Open email client with pre-filled content
    const subject = encodeURIComponent(form.subject || "Message from GigVine Contact Form");
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`);
    window.open(`mailto:gigvineafrica@gmail.com?subject=${subject}&body=${body}`);
    setTimeout(() => { setSending(false); setSent(true); }, 500);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 32px" }}>
      <div style={{ marginBottom: 48 }}>
        <div className="section-label">Get in touch</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "var(--white)", margin: "12px 0 16px" }}>Contact Us</h1>
        <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.7 }}>Have a question, feedback, or want to partner with GigVine? We'd love to hear from you.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 48 }}>
        <div>
          {sent ? (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", color: "var(--white)", marginBottom: 10, fontSize: 22 }}>Message ready!</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>Your email client opened with your message. Just hit send and we'll get back to you within 24 hours.</p>
              <button className="btn-gold" style={{ marginTop: 24 }} onClick={() => setSent(false)}>Send another</button>
            </div>
          ) : (
            <div className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-control" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input className="form-control" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input className="form-control" placeholder="What is this about?" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea className="form-control" placeholder="Tell us how we can help…" rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
              </div>
              <button className="btn-full" onClick={submit} disabled={sending || !form.name || !form.email || !form.message}>
                {sending ? <span className="spinner" style={{ borderTopColor: "#0a0f0d" }} /> : "Send Message"}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { icon: "📧", title: "Email Us", desc: "gigvineafrica@gmail.com", sub: "We respond within 24 hours" },
            { icon: "🌍", title: "Based in", desc: "Abuja, Nigeria", sub: "Serving all of Africa" },
            { icon: "⏰", title: "Response Time", desc: "Within 24 hours", sub: "Monday to Saturday" },
          ].map(c => (
            <div key={c.title} className="why-card" style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{c.icon}</div>
              <h3 style={{ fontSize: 14, marginBottom: 4 }}>{c.title}</h3>
              <p style={{ color: "var(--white)", fontSize: 14, marginBottom: 2 }}>{c.desc}</p>
              <p style={{ fontSize: 12 }}>{c.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Privacy Page ─────────────────────────────────────────────────────────────
function PrivacyPage() {
  const Section = ({ title, children }) => (
    <div className="profile-section" style={{ marginBottom: 16 }}>
      <h3>{title}</h3>
      <div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.8 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 32px" }}>
      <div style={{ marginBottom: 40 }}>
        <div className="section-label">Legal</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "var(--white)", margin: "12px 0 12px" }}>Privacy Policy</h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Last updated: June 2025</p>
      </div>

      <Section title="1. Introduction">
        <p>Welcome to GigVine ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform at gigvine.africa.</p>
      </Section>

      <Section title="2. Information We Collect">
        <p style={{ marginBottom: 10 }}>We collect information you provide directly to us, including:</p>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>Name and email address when you create an account</li>
          <li>Profile information such as location, bio, instruments, and availability</li>
          <li>Booking requests and messages exchanged on the platform</li>
          <li>Reviews and ratings you submit</li>
          <li>Payment details you choose to display (bank transfer information)</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <p style={{ marginBottom: 10 }}>We use the information we collect to:</p>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>Create and manage your account</li>
          <li>Facilitate bookings between musicians and clients</li>
          <li>Send you email notifications about your account and bookings</li>
          <li>Improve our platform and user experience</li>
          <li>Respond to your inquiries and support requests</li>
          <li>Comply with legal obligations</li>
        </ul>
      </Section>

      <Section title="4. Information Sharing">
        <p style={{ marginBottom: 10 }}>We do not sell your personal information. We may share your information in the following circumstances:</p>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li><strong style={{ color: "var(--white)" }}>With other users:</strong> Musician profiles are publicly visible. Booking requests are shared between the relevant musician and client.</li>
          <li><strong style={{ color: "var(--white)" }}>Service providers:</strong> We use Firebase (Google) for authentication, database, and hosting services.</li>
          <li><strong style={{ color: "var(--white)" }}>Legal requirements:</strong> We may disclose information if required by law.</li>
        </ul>
      </Section>

      <Section title="5. Data Security">
        <p>We use industry-standard security measures to protect your data, including Firebase Authentication and Firestore security rules. However, no method of transmission over the internet is 100% secure.</p>
      </Section>

      <Section title="6. Your Rights">
        <p style={{ marginBottom: 10 }}>You have the right to:</p>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>Access and update your personal information through your dashboard</li>
          <li>Delete your account by contacting us at gigvineafrica@gmail.com</li>
          <li>Opt out of non-essential communications</li>
        </ul>
      </Section>

      <Section title="7. Cookies">
        <p>GigVine uses essential cookies and local storage to maintain your login session. We do not use tracking cookies or third-party advertising cookies.</p>
      </Section>

      <Section title="8. Children's Privacy">
        <p>GigVine is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.</p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated date.</p>
      </Section>

      <Section title="10. Contact Us">
        <p>If you have questions about this Privacy Policy, please contact us at <strong style={{ color: "var(--gold)" }}>gigvineafrica@gmail.com</strong>.</p>
      </Section>
    </div>
  );
}

// ─── Terms Page ───────────────────────────────────────────────────────────────
function TermsPage() {
  const Section = ({ title, children }) => (
    <div className="profile-section" style={{ marginBottom: 16 }}>
      <h3>{title}</h3>
      <div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.8 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 32px" }}>
      <div style={{ marginBottom: 40 }}>
        <div className="section-label">Legal</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "var(--white)", margin: "12px 0 12px" }}>Terms of Service</h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Last updated: June 2025</p>
      </div>

      <Section title="1. Acceptance of Terms">
        <p>By accessing or using GigVine ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.</p>
      </Section>

      <Section title="2. Description of Service">
        <p>GigVine is an online marketplace that connects musicians and musical groups ("Musicians") with individuals and organizations seeking live music services ("Clients"). GigVine provides the platform for these connections but is not a party to any agreements made between Musicians and Clients.</p>
      </Section>

      <Section title="3. User Accounts">
        <p style={{ marginBottom: 10 }}>To use GigVine, you must:</p>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>Provide accurate and complete registration information</li>
          <li>Verify your email address</li>
          <li>Maintain the security of your account and password</li>
          <li>Be at least 18 years of age</li>
          <li>Not create multiple accounts for the same person</li>
        </ul>
      </Section>

      <Section title="4. Musician Responsibilities">
        <p style={{ marginBottom: 10 }}>If you register as a musician, you agree to:</p>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>Provide accurate information about your skills, experience, and availability</li>
          <li>Respond to booking requests in a timely manner</li>
          <li>Honor confirmed bookings</li>
          <li>Conduct yourself professionally with clients</li>
          <li>Not post false or misleading information about your services</li>
        </ul>
      </Section>

      <Section title="5. Client Responsibilities">
        <p style={{ marginBottom: 10 }}>If you register as a client, you agree to:</p>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>Provide accurate information about your event and requirements</li>
          <li>Honor confirmed bookings and agreed payment arrangements</li>
          <li>Treat musicians with respect and professionalism</li>
          <li>Only submit genuine booking requests</li>
        </ul>
      </Section>

      <Section title="6. Payments">
        <p>GigVine does not process payments. All payment arrangements are made directly between Musicians and Clients. GigVine is not responsible for any payment disputes. We recommend agreeing on clear payment terms before confirming a booking.</p>
      </Section>

      <Section title="7. Reviews and Ratings">
        <p>Clients who have completed bookings may leave reviews. Reviews must be honest and based on genuine experience. GigVine reserves the right to remove reviews that violate our community guidelines.</p>
      </Section>

      <Section title="8. Prohibited Conduct">
        <p style={{ marginBottom: 10 }}>You agree not to:</p>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>Post false, misleading, or fraudulent information</li>
          <li>Harass, abuse, or threaten other users</li>
          <li>Use the platform for any illegal purpose</li>
          <li>Attempt to circumvent the platform to avoid future bookings</li>
          <li>Spam other users with unsolicited messages</li>
        </ul>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>GigVine provides the platform "as is" without warranties of any kind. We are not liable for any disputes between Musicians and Clients, including payment disputes, cancellations, or quality of service. Our liability is limited to the maximum extent permitted by applicable law.</p>
      </Section>

      <Section title="10. Termination">
        <p>GigVine reserves the right to suspend or terminate any account that violates these Terms of Service. You may also delete your account at any time by contacting us.</p>
      </Section>

      <Section title="11. Changes to Terms">
        <p>We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new terms.</p>
      </Section>

      <Section title="12. Governing Law">
        <p>These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in Nigerian courts.</p>
      </Section>

      <Section title="13. Contact">
        <p>For questions about these Terms, contact us at <strong style={{ color: "var(--gold)" }}>gigvineafrica@gmail.com</strong>.</p>
      </Section>
    </div>
  );
}