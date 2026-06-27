import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, updateDoc, collection, query, where,
  getDocs, addDoc, serverTimestamp, increment, limit, startAfter,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ─── Password Validation ──────────────────────────────────────────────────────
export function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
  if (!/[0-9]/.test(password)) errors.push("At least one number");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    errors.push("At least one special character (!@#$%...)");
  return errors;
}

// ─── Profile Completeness ─────────────────────────────────────────────────────
export function getProfileCompleteness(profile) {
  if (profile.role !== "musician") return 100;
  const fields = [
    { key: "name", label: "Full name", weight: 10 },
    { key: "bio", label: "Bio", weight: 20 },
    { key: "location", label: "Location", weight: 15 },
    { key: "instruments", label: "Instruments", weight: 20, isArray: true },
    { key: "experience", label: "Years of experience", weight: 10 },
    { key: "availability", label: "Availability", weight: 10 },
    { key: "photoURL", label: "Profile photo", weight: 15 },
  ];
  let score = 0;
  const missing = [];
  fields.forEach(f => {
    const val = profile[f.key];
    const filled = f.isArray ? (Array.isArray(val) && val.length > 0) : (val && String(val).trim().length > 0 && val !== "0" && val !== 0);
    if (filled) score += f.weight;
    else missing.push(f.label);
  });
  return { score, missing };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export function listenToAuthState(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) profile.emailVerified = firebaseUser.emailVerified;
      callback(profile);
    } else {
      callback(null);
    }
  });
}

export async function signup({ name, email, password, role, profileType }) {
  const errors = validatePassword(password);
  if (errors.length > 0) throw new Error("Password must meet requirements: " + errors.join(", "));
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  await sendEmailVerification(cred.user);
  const profile = {
    id: uid, name, email, role,
    profileType: profileType || "individual",
    instruments: [], bio: "", location: "", experience: 0,
    availability: "", bank: "", mediaLink: "", photoURL: "", videoURL: "",
    memberCount: 0, profileViews: 0, inquiryCount: 0,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", uid), profile);
  profile.emailVerified = false;
  return profile;
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(cred.user.uid);
  if (profile) profile.emailVerified = cred.user.emailVerified;
  return profile;
}

export async function logout() { await signOut(auth); }

export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (user && !user.emailVerified) await sendEmailVerification(user);
}

export async function resetPassword(email) { await sendPasswordResetEmail(auth, email); }

export async function refreshEmailVerification() {
  const user = auth.currentUser;
  if (user) { await reload(user); return user.emailVerified; }
  return false;
}

// ─── User / Profile ───────────────────────────────────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateUserProfile(uid, updates) {
  await updateDoc(doc(db, "users", uid), updates);
}

export async function recordProfileView(musicianId, viewerId) {
  if (musicianId === viewerId) return; // don't count own views
  await updateDoc(doc(db, "users", musicianId), { profileViews: increment(1) });
  // Log the view
  await addDoc(collection(db, "profileViews"), {
    musicianId, viewerId: viewerId || "anonymous",
    createdAt: serverTimestamp(),
  });
}

// ─── Musicians with Pagination ────────────────────────────────────────────────
export async function getMusicians({ instrument, location, minExp, profileType, pageSize = 12, lastDoc = null } = {}) {
  let q = query(collection(db, "users"), where("role", "==", "musician"), limit(pageSize + 1));
  if (lastDoc) q = query(collection(db, "users"), where("role", "==", "musician"), startAfter(lastDoc), limit(pageSize + 1));
  const snap = await getDocs(q);
  let musicians = snap.docs.map(d => ({ id: d.id, _doc: d, ...d.data() }));
  const hasMore = musicians.length > pageSize;
  if (hasMore) musicians = musicians.slice(0, pageSize);
  const lastVisible = hasMore ? musicians[musicians.length - 1]._doc : null;

  if (instrument) musicians = musicians.filter(m => (m.instruments || []).includes(instrument));
  if (location) musicians = musicians.filter(m => (m.location || "").toLowerCase().includes(location.toLowerCase()));
  if (minExp) musicians = musicians.filter(m => (m.experience || 0) >= parseInt(minExp));
  if (profileType && profileType !== "all") musicians = musicians.filter(m => (m.profileType || "individual") === profileType);

  return { musicians: musicians.map(({ _doc, ...m }) => m), hasMore, lastVisible };
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export async function createBooking({ musicianId, musicianName, musicianEmail, clientId, clientName, clientEmail, date, message }) {
  const ref = await addDoc(collection(db, "bookings"), {
    musicianId, musicianName, musicianEmail: musicianEmail || "",
    clientId, clientName, clientEmail: clientEmail || "",
    date, message, status: "pending", reviewed: false,
    createdAt: serverTimestamp(),
  });
  // Increment inquiry count on musician profile
  await updateDoc(doc(db, "users", musicianId), { inquiryCount: increment(1) });
  return { id: ref.id, musicianId, musicianName, clientId, clientName, date, message, status: "pending", reviewed: false };
}

export async function getBookingsForMusician(musicianId) {
  const q = query(collection(db, "bookings"), where("musicianId", "==", musicianId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBookingsForClient(clientId) {
  const q = query(collection(db, "bookings"), where("clientId", "==", clientId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateBookingStatus(bookingId, status) {
  await updateDoc(doc(db, "bookings", bookingId), { status });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export async function submitReview({ musicianId, clientId, clientName, bookingId, rating, comment }) {
  await addDoc(collection(db, "reviews"), {
    musicianId, clientId, clientName, bookingId, rating, comment, createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "bookings", bookingId), { reviewed: true });
  const reviewsSnap = await getDocs(query(collection(db, "reviews"), where("musicianId", "==", musicianId)));
  const reviews = reviewsSnap.docs.map(d => d.data());
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await updateDoc(doc(db, "users", musicianId), {
    avgRating: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
  });
}

export async function getReviewsForMusician(musicianId) {
  const q = query(collection(db, "reviews"), where("musicianId", "==", musicianId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────
export async function getAdminStats() {
  const [usersSnap, bookingsSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "bookings")),
  ]);
  const users = usersSnap.docs.map(d => d.data());
  const bookings = bookingsSnap.docs.map(d => d.data());
  const musicians = users.filter(u => u.role === "musician");
  const clients = users.filter(u => u.role === "client");
  const activeMusicians = musicians.filter(u => u.bio && u.bio.length > 10);
  const pendingBookings = bookings.filter(b => b.status === "pending");
  const acceptedBookings = bookings.filter(b => b.status === "accepted");

  // Average profile completeness
  const { getProfileCompleteness } = await import("./services");
  const totalScore = musicians.reduce((sum, m) => {
    const c = getProfileCompleteness(m);
    return sum + (c ? c.score : 0);
  }, 0);
  const avgCompletion = musicians.length > 0 ? Math.round(totalScore / musicians.length) : 0;

  // Total profile views
  const totalViews = musicians.reduce((sum, m) => sum + (m.profileViews || 0), 0);
  const totalInquiries = musicians.reduce((sum, m) => sum + (m.inquiryCount || 0), 0);

  return {
    totalUsers: users.length,
    totalMusicians: musicians.length,
    totalClients: clients.length,
    activeMusicians: activeMusicians.length,
    totalBookings: bookings.length,
    pendingBookings: pendingBookings.length,
    acceptedBookings: acceptedBookings.length,
    conversionRate: bookings.length > 0 ? Math.round((acceptedBookings.length / bookings.length) * 100) : 0,
    avgCompletion,
    totalViews,
    totalInquiries,
  };
}