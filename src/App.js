import { useState, useEffect, useCallback } from "react";
import {
  listenToAuthState,
  signup,
  login,
  logout,
  getMusicians,
  getUserProfile,
  updateUserProfile,
  createBooking,
  getBookingsForMusician,
  getBookingsForClient,
  updateBookingStatus,
} from "./services";

// ─── Constants ────────────────────────────────────────────────────────────────
const INSTRUMENTS = ["Keyboard/Piano", "Drums", "Vocals", "Guitar", "Bass", "Choir Director", "Saxophone", "Trumpet"];

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --purple: #1A2F1A;
    --purple-mid: #223d22;
    --purple-light: #2d5a2d;
    --gold: #C9A84C;
    --gold-light: #e8c96d;
    --white: #FAFAF8;
    --off: #F5F2EA;
    --muted: #6B7B5A;
    --text: #1a2a0f;
    --border: rgba(26,47,26,0.12);
    --card-bg: rgba(255,255,255,0.95);
    --shadow: 0 4px 32px rgba(26,47,26,0.10);
    --shadow-lg: 0 12px 56px rgba(26,47,26,0.18);
  }

  html { scroll-behavior: smooth; }
  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--off);
    color: var(--text);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .app { min-height: 100vh; display: flex; flex-direction: column; }

  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(15,31,15,0.97);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(201,168,76,0.18);
    padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between;
    height: 64px;
  }
  .nav-logo {
    font-family: 'Playfair Display', serif;
    font-size: 22px; font-weight: 700;
    color: var(--gold);
    display: flex; align-items: center; gap: 8px;
    cursor: pointer; background: none; border: none;
  }
  .nav-logo span { color: var(--white); }
  .nav-links { display: flex; align-items: center; gap: 8px; }
  .nav-link {
    color: rgba(255,255,255,0.75);
    background: none; border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500;
    cursor: pointer; padding: 6px 14px;
    border-radius: 6px;
    transition: color .2s, background .2s;
  }
  .nav-link:hover { color: var(--white); background: rgba(255,255,255,0.08); }
  .nav-btn {
    background: var(--gold); color: var(--purple);
    border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 600;
    padding: 8px 18px; border-radius: 8px;
    transition: background .2s, transform .15s;
  }
  .nav-btn:hover { background: var(--gold-light); transform: translateY(-1px); }

  .hero {
    background: linear-gradient(135deg, #1A2F1A 0%, #0f1f0f 50%, #243824 100%);
    position: relative; overflow: hidden;
    padding: 90px 24px 80px; text-align: center;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.10) 0%, transparent 70%);
  }
  .hero-pattern {
    position: absolute; inset: 0; opacity: 0.04;
    background-image: repeating-linear-gradient(45deg, var(--gold) 0, var(--gold) 1px, transparent 0, transparent 50%);
    background-size: 24px 24px;
  }
  .hero-content { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(201,168,76,0.15);
    border: 1px solid rgba(201,168,76,0.35);
    color: var(--gold-light);
    font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
    padding: 5px 14px; border-radius: 20px; margin-bottom: 24px;
  }
  .hero h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(34px, 6vw, 62px);
    font-weight: 900; line-height: 1.1;
    color: var(--white); margin-bottom: 20px;
  }
  .hero h1 em { color: var(--gold); font-style: normal; }
  .hero p {
    font-size: 18px; font-weight: 300;
    color: rgba(255,255,255,0.72);
    line-height: 1.7; margin-bottom: 40px;
  }
  .hero-ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 48px; }

  .btn-primary {
    background: var(--gold); color: var(--purple);
    border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 700;
    padding: 14px 28px; border-radius: 10px;
    transition: all .2s;
    box-shadow: 0 4px 20px rgba(201,168,76,0.35);
  }
  .btn-primary:hover { background: var(--gold-light); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(201,168,76,0.45); }
  .btn-outline {
    background: transparent; color: var(--white);
    border: 1.5px solid rgba(255,255,255,0.35);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 600;
    padding: 14px 28px; border-radius: 10px;
    transition: all .2s;
  }
  .btn-outline:hover { border-color: var(--gold); color: var(--gold); }

  .search-bar {
    display: flex; max-width: 560px; margin: 0 auto;
    background: var(--white); border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.25);
    border: 2px solid transparent; transition: border .2s;
  }
  .search-bar:focus-within { border-color: var(--gold); }
  .search-bar select, .search-bar input {
    flex: 1; border: none; outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; padding: 14px 16px;
    background: transparent; color: var(--text);
  }
  .search-bar select { border-right: 1px solid var(--border); max-width: 160px; }
  .search-bar button {
    background: var(--purple); color: var(--white);
    border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 600;
    padding: 14px 22px; transition: background .2s;
  }
  .search-bar button:hover { background: var(--purple-light); }

  .section { padding: 72px 24px; max-width: 1100px; margin: 0 auto; width: 100%; }
  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(26px, 4vw, 38px);
    font-weight: 700; color: var(--purple); margin-bottom: 8px;
  }
  .section-sub { color: var(--muted); font-size: 16px; margin-bottom: 48px; }

  .how-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 28px; }
  .how-card {
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: 16px; padding: 32px 24px; text-align: center;
    box-shadow: var(--shadow); transition: transform .2s, box-shadow .2s;
  }
  .how-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
  .how-icon {
    width: 56px; height: 56px;
    background: linear-gradient(135deg, #1A2F1A, #2d5a2d);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; font-size: 26px;
  }
  .how-card h3 { font-weight: 700; margin-bottom: 8px; color: var(--purple); }
  .how-card p { font-size: 14px; color: var(--muted); line-height: 1.6; }

  .musician-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }
  .musician-card {
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: 18px; overflow: hidden;
    box-shadow: var(--shadow); transition: transform .2s, box-shadow .2s;
  }
  .musician-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
  .musician-card-header {
    background: linear-gradient(135deg, #1A2F1A, #2d5a2d);
    padding: 24px 20px 16px;
    display: flex; align-items: center; gap: 14px;
  }
  .musician-avatar {
    width: 58px; height: 58px; border-radius: 50%;
    border: 3px solid rgba(201,168,76,0.5);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; flex-shrink: 0;
    font-family: 'Playfair Display', serif;
    color: var(--gold); font-weight: 700;
    background: #142014;
  }
  .musician-card-header h3 { color: var(--white); font-size: 17px; font-weight: 700; }
  .musician-card-header p { color: rgba(255,255,255,0.65); font-size: 13px; }
  .musician-card-body { padding: 16px 20px 20px; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .tag {
    background: rgba(26,47,26,0.08); color: var(--purple);
    font-size: 12px; font-weight: 600;
    padding: 3px 10px; border-radius: 20px;
  }
  .musician-card-body p { font-size: 13px; color: var(--muted); line-height: 1.6; margin-bottom: 16px; }
  .card-footer { display: flex; justify-content: space-between; align-items: center; }
  .exp-badge { font-size: 12px; color: var(--muted); font-weight: 500; }
  .btn-book {
    background: var(--purple); color: var(--white);
    border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    padding: 8px 18px; border-radius: 8px; transition: all .2s;
  }
  .btn-book:hover { background: var(--purple-light); transform: translateY(-1px); }

  .overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(10,6,30,0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px; animation: fadeIn .2s ease;
  }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  .modal {
    background: var(--white); border-radius: 20px;
    padding: 36px; width: 100%; max-width: 440px;
    box-shadow: 0 24px 80px rgba(45,27,94,0.25);
    animation: slideUp .25s ease;
    max-height: 90vh; overflow-y: auto;
  }
  @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: none; opacity: 1 } }
  .modal-title {
    font-family: 'Playfair Display', serif;
    font-size: 26px; font-weight: 700;
    color: var(--purple); margin-bottom: 6px;
  }
  .modal-sub { color: var(--muted); font-size: 14px; margin-bottom: 28px; }
  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .form-control {
    width: 100%; border: 1.5px solid var(--border);
    border-radius: 10px; padding: 11px 14px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    color: var(--text); background: var(--off);
    outline: none; transition: border .2s;
  }
  .form-control:focus { border-color: var(--purple); background: var(--white); }
  textarea.form-control { resize: vertical; min-height: 90px; }
  .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .role-card {
    border: 2px solid var(--border); border-radius: 12px;
    padding: 16px; text-align: center; cursor: pointer;
    transition: all .2s; background: var(--off);
  }
  .role-card.active { border-color: var(--purple); background: rgba(45,27,94,0.06); }
  .role-card .role-icon { font-size: 28px; margin-bottom: 8px; }
  .role-card h4 { font-size: 14px; font-weight: 700; color: var(--purple); }
  .role-card p { font-size: 12px; color: var(--muted); }
  .btn-full {
    width: 100%; padding: 13px;
    background: var(--purple); color: var(--white);
    border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 700;
    border-radius: 10px; transition: all .2s; margin-top: 6px;
  }
  .btn-full:hover { background: var(--purple-light); }
  .btn-full.gold { background: var(--gold); color: var(--purple); }
  .btn-full.gold:hover { background: var(--gold-light); }
  .btn-full:disabled { opacity: 0.6; cursor: not-allowed; }
  .modal-footer { text-align: center; margin-top: 18px; font-size: 13px; color: var(--muted); }
  .modal-footer button { background: none; border: none; color: var(--purple); font-weight: 600; cursor: pointer; }
  .modal-close {
    background: none; border: none; cursor: pointer;
    color: var(--muted); font-size: 20px; padding: 8px;
  }

  .dashboard { max-width: 960px; margin: 0 auto; padding: 40px 24px; }
  .dash-header { margin-bottom: 36px; }
  .dash-header h2 { font-family: 'Playfair Display', serif; font-size: 28px; color: var(--purple); margin-bottom: 4px; }
  .dash-header p { color: var(--muted); font-size: 15px; }
  .dash-tabs {
    display: flex; gap: 4px;
    background: rgba(45,27,94,0.06); border-radius: 10px;
    padding: 4px; margin-bottom: 28px; width: fit-content;
  }
  .dash-tab {
    padding: 8px 20px; border-radius: 8px;
    border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500;
    color: var(--muted); background: none; transition: all .2s;
  }
  .dash-tab.active { background: var(--white); color: var(--purple); font-weight: 700; box-shadow: var(--shadow); }

  .booking-list { display: flex; flex-direction: column; gap: 14px; }
  .booking-card {
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: 14px; padding: 20px 24px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; box-shadow: var(--shadow);
  }
  .booking-info h4 { font-weight: 700; color: var(--purple); margin-bottom: 4px; }
  .booking-info p { font-size: 13px; color: var(--muted); }
  .booking-actions { display: flex; gap: 8px; align-items: center; }
  .status-badge { font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; }
  .status-badge.pending { background: rgba(201,168,76,0.15); color: #7a5c10; }
  .status-badge.accepted { background: rgba(22,163,74,0.12); color: #15803d; }
  .status-badge.declined { background: rgba(220,38,38,0.10); color: #b91c1c; }
  .btn-sm {
    font-size: 13px; font-weight: 600; padding: 6px 14px;
    border-radius: 8px; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all .15s;
  }
  .btn-sm.accept { background: #dcfce7; color: #15803d; }
  .btn-sm.accept:hover { background: #bbf7d0; }
  .btn-sm.decline { background: #fee2e2; color: #b91c1c; }
  .btn-sm.decline:hover { background: #fecaca; }

  .profile-form { background: var(--card-bg); border-radius: 16px; padding: 28px; box-shadow: var(--shadow); }
  .instruments-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
  .instrument-toggle {
    padding: 6px 14px; border-radius: 20px;
    border: 1.5px solid var(--border);
    background: var(--off); cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    color: var(--muted); transition: all .15s;
  }
  .instrument-toggle.selected { border-color: var(--purple); background: rgba(45,27,94,0.07); color: var(--purple); font-weight: 600; }

  .empty { text-align: center; padding: 48px 24px; color: var(--muted); }
  .empty .empty-icon { font-size: 48px; margin-bottom: 12px; }
  .empty h3 { font-weight: 700; color: var(--purple); margin-bottom: 6px; }

  .payment-note {
    background: rgba(201,168,76,0.10);
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 10px; padding: 14px 18px;
    font-size: 13px; color: #7a5c10;
    display: flex; gap: 10px; align-items: flex-start; margin-top: 12px;
  }
  .payment-note .note-icon { flex-shrink: 0; font-size: 16px; }

  .footer {
    background: #0f1f0f; color: rgba(255,255,255,0.55);
    text-align: center; padding: 32px 24px;
    font-size: 13px; margin-top: auto;
  }
  .footer strong { color: var(--gold); }

  .profile-page { max-width: 760px; margin: 40px auto; padding: 0 24px; }
  .profile-hero {
    background: linear-gradient(135deg, #1A2F1A, #2d5a2d);
    border-radius: 20px; padding: 36px;
    display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .profile-big-avatar {
    width: 96px; height: 96px; border-radius: 50%;
    background: var(--purple-mid);
    border: 4px solid rgba(201,168,76,0.5);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 36px; color: var(--gold); font-weight: 700; flex-shrink: 0;
  }
  .profile-hero-info h2 { font-family: 'Playfair Display', serif; font-size: 28px; color: var(--white); margin-bottom: 4px; }
  .profile-hero-info p { color: rgba(255,255,255,0.65); font-size: 15px; margin-bottom: 12px; }
  .profile-section { background: var(--card-bg); border-radius: 16px; padding: 24px 28px; margin-bottom: 16px; box-shadow: var(--shadow); }
  .profile-section h3 { font-weight: 700; color: var(--purple); margin-bottom: 12px; font-size: 16px; }

  .alert { padding: 12px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 14px; }
  .alert.success { background: #dcfce7; color: #15803d; }
  .alert.error { background: #fee2e2; color: #b91c1c; }

  .search-page { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
  .search-filters {
    background: var(--card-bg); border-radius: 14px; padding: 20px 24px;
    display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-end;
    box-shadow: var(--shadow); margin-bottom: 32px; border: 1px solid var(--border);
  }
  .filter-group { display: flex; flex-direction: column; gap: 5px; min-width: 160px; }
  .filter-group label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
  .filter-group select, .filter-group input {
    border: 1.5px solid var(--border); border-radius: 8px;
    padding: 9px 12px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: var(--text); outline: none;
    background: var(--off); transition: border .2s;
  }
  .filter-group select:focus, .filter-group input:focus { border-color: var(--purple); }

  .spinner {
    display: inline-block; width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin .6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-screen {
    min-height: 60vh; display: flex;
    align-items: center; justify-content: center;
    flex-direction: column; gap: 16px; color: var(--muted);
  }
  .loading-screen .big-spinner {
    width: 40px; height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--purple);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }

  @media (max-width: 600px) {
    .nav-links .nav-link { display: none; }
    .hero { padding: 60px 16px 60px; }
    .booking-card { flex-direction: column; align-items: flex-start; }
    .profile-hero { flex-direction: column; }
  }
`;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function GigMinistry() {
  const [page, setPage] = useState("home");
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = loading
  const [modal, setModal] = useState(null);
  const [selectedMusician, setSelectedMusician] = useState(null);
  const [bookingTarget, setBookingTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState({ instrument: "", location: "" });
  const [featuredMusicians, setFeaturedMusicians] = useState([]);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = listenToAuthState((user) => setCurrentUser(user || null));
    return () => unsub();
  }, []);

  // Load featured musicians for homepage
  useEffect(() => {
    getMusicians().then(setFeaturedMusicians).catch(console.error);
  }, []);

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setPage("home");
  };

  // Still checking auth state
  if (currentUser === undefined) {
    return (
      <div className="app">
        <style>{STYLES}</style>
        <div className="loading-screen">
          <div className="big-spinner" />
          <p>Loading Gigvine…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{STYLES}</style>

      {/* Navbar */}
      <nav className="nav">
        <button className="nav-logo" onClick={() => setPage("home")}>
          <svg width="22" height="22" viewBox="0 0 44 44" fill="none" style={{marginRight:4}}>
            <path d="M22 38 Q16 30 18 22 Q20 14 19 8" stroke="#2d5a2d" strokeWidth="2.5" strokeLinecap="round"/>
            <ellipse cx="16" cy="28" rx="7" ry="4" fill="#2d5a2d" transform="rotate(-30 16 28)"/>
            <ellipse cx="20" cy="18" rx="7" ry="4" fill="#2d5a2d" transform="rotate(20 20 18)"/>
            <ellipse cx="19" cy="8" rx="6" ry="4" fill="#C9A84C" transform="rotate(-20 19 8)"/>
            <line x1="25" y1="6" x2="25" y2="0" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
            <path d="M25 0 Q33 3 30 9" stroke="#C9A84C" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
          <span>Gig</span>vine
        </button>
        <div className="nav-links">
          <button className="nav-link" onClick={() => setPage("search")}>Find Musicians</button>
          {currentUser ? (
            <>
              <button className="nav-link" onClick={() => setPage("dashboard")}>Dashboard</button>
              <button className="nav-link" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="nav-link" onClick={() => setModal("login")}>Login</button>
              <button className="nav-btn" onClick={() => setModal("signup")}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      {/* Pages */}
      {page === "home" && (
        <HomePage
          setPage={setPage}
          setModal={setModal}
          musicians={featuredMusicians}
          setSelectedMusician={(m) => { setSelectedMusician(m); setPage("musician-profile"); }}
          setBookingTarget={(m) => { setBookingTarget(m); setModal("booking"); }}
          currentUser={currentUser}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}
      {page === "search" && (
        <SearchPage
          setSelectedMusician={(m) => { setSelectedMusician(m); setPage("musician-profile"); }}
          setBookingTarget={(m) => { setBookingTarget(m); setModal("booking"); }}
          currentUser={currentUser}
          setModal={setModal}
          initialQuery={searchQuery}
        />
      )}
      {page === "musician-profile" && selectedMusician && (
        <MusicianProfilePage
          musician={selectedMusician}
          currentUser={currentUser}
          onBook={() => { setBookingTarget(selectedMusician); setModal("booking"); }}
          onBack={() => setPage("search")}
          setModal={setModal}
        />
      )}
      {page === "dashboard" && currentUser && (
        <Dashboard currentUser={currentUser} setCurrentUser={setCurrentUser} />
      )}

      {/* Modals */}
      {modal === "login" && (
        <LoginModal
          onClose={() => setModal(null)}
          onLogin={(user) => { setCurrentUser(user); setModal(null); }}
          switchToSignup={() => setModal("signup")}
        />
      )}
      {modal === "signup" && (
        <SignupModal
          onClose={() => setModal(null)}
          onSignup={(user) => { setCurrentUser(user); setModal(null); }}
          switchToLogin={() => setModal("login")}
        />
      )}
      {modal === "booking" && currentUser && bookingTarget && (
        <BookingModal
          musician={bookingTarget}
          client={currentUser}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "booking" && !currentUser && (
        <LoginModal
          onClose={() => setModal(null)}
          onLogin={(user) => { setCurrentUser(user); }}
          switchToSignup={() => setModal("signup")}
          hint="Log in to send a booking request."
        />
      )}

      <footer className="footer">
        © 2025 <strong>Gigvine</strong>. Connecting churches and musicians for His glory.
      </footer>
    </div>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────
function HomePage({ setPage, setModal, musicians, setSelectedMusician, setBookingTarget, currentUser, searchQuery, setSearchQuery }) {
  const [heroInstrument, setHeroInstrument] = useState("");
  const [heroLocation, setHeroLocation] = useState("");

  return (
    <>
      <section className="hero">
        <div className="hero-pattern" />
        <div className="hero-content">
          <div className="hero-badge">🎵 For Churches & Events</div>
          <h1>Find Trusted Church<br /><em>Musicians</em>—Fast</h1>
          <p>Book skilled keyboardists, drummers, vocalists, and more<br />for your services and events.</p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => setPage("search")}>Find a Musician</button>
            <button className="btn-outline" onClick={() => setModal("signup")}>Join as a Musician</button>
          </div>
          <div className="search-bar">
            <select value={heroInstrument} onChange={e => setHeroInstrument(e.target.value)}>
              <option value="">All Instruments</option>
              {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <input
              placeholder="City or country…"
              value={heroLocation}
              onChange={e => setHeroLocation(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  setSearchQuery({ instrument: heroInstrument, location: heroLocation });
                  setPage("search");
                }
              }}
            />
            <button onClick={() => { setSearchQuery({ instrument: heroInstrument, location: heroLocation }); setPage("search"); }}>
              Search
            </button>
          </div>
        </div>
      </section>

      <div style={{ background: "var(--off)" }}>
        <div className="section">
          <h2 className="section-title">How It Works</h2>
          <p className="section-sub">Simple steps to find or offer music ministry services</p>
          <div className="how-grid">
            {[
              { icon: "🔍", title: "Search", desc: "Filter musicians by instrument, location, or experience level." },
              { icon: "📋", title: "View Profiles", desc: "See bios, media links, availability, and contact details." },
              { icon: "📩", title: "Send a Request", desc: "Pick a date, write your message, and submit a booking request." },
              { icon: "✅", title: "Confirm & Connect", desc: "Musician accepts, and you arrange payment directly." },
            ].map(h => (
              <div className="how-card" key={h.title}>
                <div className="how-icon">{h.icon}</div>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--white)" }}>
        <div className="section">
          <h2 className="section-title">Featured Musicians</h2>
          <p className="section-sub">Trusted music ministers ready to serve</p>
          {musicians.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🎵</div>
              <h3>No musicians yet</h3>
              <p>Be the first to join as a musician!</p>
            </div>
          ) : (
            <div className="musician-grid">
              {musicians.slice(0, 4).map(m => (
                <MusicianCard key={m.id} musician={m} onView={() => setSelectedMusician(m)} onBook={() => setBookingTarget(m)} />
              ))}
            </div>
          )}
          {musicians.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 36 }}>
              <button className="btn-primary" onClick={() => setPage("search")} style={{ fontSize: 16, padding: "14px 36px" }}>
                View All Musicians →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── MusicianCard ─────────────────────────────────────────────────────────────
function MusicianCard({ musician, onView, onBook }) {
  const initials = musician.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";
  return (
    <div className="musician-card">
      <div className="musician-card-header">
        <div className="musician-avatar">{initials}</div>
        <div>
          <h3>{musician.name}</h3>
          <p>📍 {musician.location || "Location not set"}</p>
        </div>
      </div>
      <div className="musician-card-body">
        <div className="tags">
          {(musician.instruments || []).map(i => <span key={i} className="tag">{i}</span>)}
        </div>
        <p>{musician.bio ? musician.bio.slice(0, 90) + (musician.bio.length > 90 ? "…" : "") : "No bio yet."}</p>
        <div className="card-footer">
          <span className="exp-badge">⭐ {musician.experience || 0} yrs exp</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-book" style={{ background: "var(--off)", color: "var(--purple)", fontSize: 12, padding: "7px 12px" }} onClick={onView}>View</button>
            <button className="btn-book" onClick={onBook}>Book</button>
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

  const doSearch = useCallback(async () => {
    setLoading(true);
    const results = await getMusicians({ instrument, location, minExp });
    setMusicians(results);
    setLoading(false);
  }, [instrument, location, minExp]);

  useEffect(() => { doSearch(); }, []);

  return (
    <div className="search-page">
      <h2 className="section-title" style={{ marginBottom: 6 }}>Find a Musician</h2>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        {loading ? "Searching…" : `${musicians.length} musician${musicians.length !== 1 ? "s" : ""} found`}
      </p>

      <div className="search-filters">
        <div className="filter-group">
          <label>Instrument</label>
          <select value={instrument} onChange={e => setInstrument(e.target.value)}>
            <option value="">All</option>
            {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Location</label>
          <input placeholder="e.g. Lagos" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Min. Experience</label>
          <select value={minExp} onChange={e => setMinExp(e.target.value)}>
            <option value="">Any</option>
            <option value="2">2+ years</option>
            <option value="5">5+ years</option>
            <option value="8">8+ years</option>
          </select>
        </div>
        <button className="btn-primary" style={{ height: 40, marginBottom: 1 }} onClick={doSearch}>
          Search
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}>
          <div className="big-spinner" />
        </div>
      ) : musicians.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🎵</div>
          <h3>No musicians found</h3>
          <p>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="musician-grid">
          {musicians.map(m => (
            <MusicianCard
              key={m.id} musician={m}
              onView={() => setSelectedMusician(m)}
              onBook={() => {
                if (!currentUser) { setModal("booking"); return; }
                setBookingTarget(m);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MusicianProfilePage ──────────────────────────────────────────────────────
function MusicianProfilePage({ musician, currentUser, onBook, onBack, setModal }) {
  const initials = musician.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";
  return (
    <div className="profile-page">
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--purple)", cursor: "pointer", fontWeight: 600, marginBottom: 20, fontSize: 14 }}>
        ← Back to search
      </button>
      <div className="profile-hero">
        <div className="profile-big-avatar">{initials}</div>
        <div className="profile-hero-info">
          <h2>{musician.name}</h2>
          <p>📍 {musician.location || "Location not set"}</p>
          <div className="tags">
            {(musician.instruments || []).map(i => (
              <span key={i} className="tag" style={{ background: "rgba(255,255,255,0.15)", color: "var(--white)" }}>{i}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3>About</h3>
        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>{musician.bio || "No bio provided yet."}</p>
      </div>

      <div className="profile-section" style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ marginBottom: 6 }}>Experience</h3>
          <p style={{ color: "var(--muted)" }}>{musician.experience || 0} years</p>
        </div>
        <div>
          <h3 style={{ marginBottom: 6 }}>Availability</h3>
          <p style={{ color: "var(--muted)" }}>{musician.availability || "Not specified"}</p>
        </div>
        {musician.mediaLink && (
          <div>
            <h3 style={{ marginBottom: 6 }}>Media</h3>
            <a href={musician.mediaLink} target="_blank" rel="noreferrer" style={{ color: "var(--purple)", fontWeight: 600, fontSize: 14 }}>
              Watch / Listen →
            </a>
          </div>
        )}
      </div>

      <div className="profile-section">
        <h3>Payment</h3>
        <div className="payment-note">
          <span className="note-icon">💳</span>
          <div>
            <strong>Payment is arranged directly between client and musician.</strong>
            {musician.bank && <p style={{ marginTop: 4 }}>Bank details: {musician.bank}</p>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          className="btn-primary"
          style={{ width: "100%", fontSize: 16, padding: 16 }}
          onClick={() => currentUser ? onBook() : setModal("booking")}
        >
          📩 Request Booking
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ currentUser, setCurrentUser }) {
  const [tab, setTab] = useState(currentUser.role === "musician" ? "requests" : "sent");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const data = currentUser.role === "musician"
      ? await getBookingsForMusician(currentUser.id)
      : await getBookingsForClient(currentUser.id);
    setBookings(data);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { if (tab === "requests" || tab === "sent") loadBookings(); }, [tab, loadBookings]);

  const handleStatus = async (bookingId, status) => {
    await updateBookingStatus(bookingId, status);
    setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, status } : b));
  };

  const initials = currentUser.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div className="musician-avatar" style={{ width: 52, height: 52, fontSize: 20 }}>{initials}</div>
          <div>
            <h2 style={{ marginBottom: 0 }}>Welcome, {currentUser.name?.split(" ")[0]}</h2>
            <p style={{ textTransform: "capitalize" }}>{currentUser.role} account</p>
          </div>
        </div>
      </div>

      <div className="dash-tabs">
        {currentUser.role === "musician" ? (
          <>
            <button className={`dash-tab ${tab === "requests" ? "active" : ""}`} onClick={() => setTab("requests")}>Booking Requests</button>
            <button className={`dash-tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>Edit Profile</button>
          </>
        ) : (
          <button className={`dash-tab ${tab === "sent" ? "active" : ""}`} onClick={() => setTab("sent")}>My Bookings</button>
        )}
      </div>

      {(tab === "requests" || tab === "sent") && (
        loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}>
            <div className="big-spinner" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <h3>No bookings yet</h3>
            <p>{currentUser.role === "musician" ? "Booking requests will appear here." : "Your sent requests will appear here."}</p>
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map(bk => (
              <div className="booking-card" key={bk.id}>
                <div className="booking-info">
                  <h4>{currentUser.role === "musician" ? `Request from ${bk.clientName}` : `Booking: ${bk.musicianName}`}</h4>
                  <p>📅 {bk.date} &nbsp;|&nbsp; {bk.message}</p>
                </div>
                <div className="booking-actions">
                  <span className={`status-badge ${bk.status}`}>{bk.status.charAt(0).toUpperCase() + bk.status.slice(1)}</span>
                  {currentUser.role === "musician" && bk.status === "pending" && (
                    <>
                      <button className="btn-sm accept" onClick={() => handleStatus(bk.id, "accepted")}>Accept</button>
                      <button className="btn-sm decline" onClick={() => handleStatus(bk.id, "declined")}>Decline</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "profile" && (
        <EditProfileForm currentUser={currentUser} setCurrentUser={setCurrentUser} />
      )}
    </div>
  );
}

// ─── EditProfileForm ──────────────────────────────────────────────────────────
function EditProfileForm({ currentUser, setCurrentUser }) {
  const [form, setForm] = useState({
    name: currentUser.name || "",
    location: currentUser.location || "",
    bio: currentUser.bio || "",
    experience: currentUser.experience || "",
    availability: currentUser.availability || "",
    bank: currentUser.bank || "",
    mediaLink: currentUser.mediaLink || "",
    instruments: currentUser.instruments || [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const toggleInstrument = (i) => {
    setForm(f => ({
      ...f,
      instruments: f.instruments.includes(i)
        ? f.instruments.filter(x => x !== i)
        : [...f.instruments, i],
    }));
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      await updateUserProfile(currentUser.id, form);
      setCurrentUser(u => ({ ...u, ...form }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="profile-form">
      {saved && <div className="alert success">✅ Profile saved!</div>}
      {error && <div className="alert error">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="form-group">
          <label>Full Name</label>
          <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Location</label>
          <input className="form-control" placeholder="e.g. Lagos, Nigeria" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Years of Experience</label>
          <input className="form-control" type="number" min="0" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: Number(e.target.value) }))} />
        </div>
        <div className="form-group">
          <label>Availability</label>
          <input className="form-control" placeholder="e.g. Weekends only" value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))} />
        </div>
      </div>

      <div className="form-group">
        <label>Bio</label>
        <textarea className="form-control" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
      </div>

      <div className="form-group">
        <label>Instruments</label>
        <div className="instruments-grid">
          {INSTRUMENTS.map(i => (
            <button key={i} type="button" className={`instrument-toggle ${form.instruments.includes(i) ? "selected" : ""}`} onClick={() => toggleInstrument(i)}>
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Bank Transfer Details</label>
        <input className="form-control" placeholder="e.g. GTBank – 0123456789 – Your Name" value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} />
        <div className="payment-note" style={{ marginTop: 8 }}>
          <span className="note-icon">💳</span>
          <span>Payment is arranged directly. Clients will see these details on your profile.</span>
        </div>
      </div>

      <div className="form-group">
        <label>Media Link (YouTube / SoundCloud)</label>
        <input className="form-control" placeholder="https://youtube.com/…" value={form.mediaLink} onChange={e => setForm(f => ({ ...f, mediaLink: e.target.value }))} />
      </div>

      <button className="btn-full" onClick={save} disabled={saving}>
        {saving ? <span className="spinner" /> : "Save Profile"}
      </button>
    </div>
  );
}

// ─── LoginModal ───────────────────────────────────────────────────────────────
function LoginModal({ onClose, onLogin, switchToSignup, hint }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const user = await login(email.trim(), password);
      onLogin(user);
    } catch (e) {
      setError("Invalid email or password. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 className="modal-title">Welcome back</h2>
            <p className="modal-sub">{hint || "Log in to your Gigvine account"}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="form-group">
          <label>Email</label>
          <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        <button className="btn-full" onClick={submit} disabled={loading}>
          {loading ? <span className="spinner" /> : "Log In"}
        </button>
        <div className="modal-footer">
          Don't have an account? <button onClick={switchToSignup}>Sign up</button>
        </div>
      </div>
    </div>
  );
}

// ─── SignupModal ──────────────────────────────────────────────────────────────
function SignupModal({ onClose, onSignup, switchToLogin }) {
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name || !form.email || !form.password || !role) {
      setError("Please fill all fields and choose a role."); return;
    }
    setLoading(true); setError("");
    try {
      const user = await signup({ ...form, role });
      onSignup(user);
    } catch (e) {
      setError(e.message?.includes("email-already-in-use")
        ? "This email is already registered."
        : "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 className="modal-title">Create Account</h2>
            <p className="modal-sub">Join the Gigvine community</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert error">{error}</div>}

        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
          I am joining as…
        </p>
        <div className="role-grid">
          {[
            { id: "client", icon: "⛪", title: "Church / Organizer", desc: "I want to book musicians" },
            { id: "musician", icon: "🎹", title: "Musician", desc: "I want to offer my services" },
          ].map(r => (
            <div key={r.id} className={`role-card ${role === r.id ? "active" : ""}`} onClick={() => setRole(r.id)}>
              <div className="role-icon">{r.icon}</div>
              <h4>{r.title}</h4>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>Full Name</label>
          <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && submit()} />
        </div>

        <button className="btn-full gold" onClick={submit} disabled={loading}>
          {loading ? <span className="spinner" /> : "Create Account"}
        </button>
        <div className="modal-footer">
          Already have an account? <button onClick={switchToLogin}>Log in</button>
        </div>
      </div>
    </div>
  );
}

// ─── BookingModal ─────────────────────────────────────────────────────────────
function BookingModal({ musician, client, onClose }) {
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
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
        clientId: client.id,
        clientName: client.name,
        date, message,
      });
      setDone(true);
    } catch (e) {
      setError("Failed to send request. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <h2 className="modal-title">Request Booking</h2>
            <p className="modal-sub">Sending to <strong>{musician.name}</strong></p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h3 style={{ color: "var(--purple)", fontFamily: "Playfair Display", marginBottom: 8 }}>Request Sent!</h3>
            <p style={{ color: "var(--muted)", marginBottom: 20 }}>
              {musician.name} will review and respond. Track the status in your dashboard.
            </p>
            <div className="payment-note">
              <span className="note-icon">💳</span>
              <span>Payment will be arranged directly once they accept.</span>
            </div>
            <button className="btn-full" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            {error && <div className="alert error">{error}</div>}
            <div className="form-group">
              <label>Event Date</label>
              <input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="form-group">
              <label>Message to Musician</label>
              <textarea className="form-control" placeholder="Describe the event, duration, what you need…" value={message} onChange={e => setMessage(e.target.value)} rows={4} />
            </div>
            <div className="payment-note">
              <span className="note-icon">💳</span>
              <span>Payment will be arranged directly between client and musician after confirmation.</span>
            </div>
            <button className="btn-full" style={{ marginTop: 16 }} onClick={submit} disabled={loading || !date || !message.trim()}>
              {loading ? <span className="spinner" /> : "Send Booking Request"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}