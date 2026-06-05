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
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function listenToAuthState(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        profile.emailVerified = firebaseUser.emailVerified;
      }
      callback(profile);
    } else {
      callback(null);
    }
  });
}

export async function signup({ name, email, password, role }) {
  // Validate password before creating account
  const errors = validatePassword(password);
  if (errors.length > 0) {
    throw new Error("Password must meet requirements: " + errors.join(", "));
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // Send verification email
  await sendEmailVerification(cred.user);

  const profile = {
    id: uid,
    name,
    email,
    role,
    instruments: [],
    bio: "",
    location: "",
    experience: 0,
    availability: "",
    bank: "",
    mediaLink: "",
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", uid), profile);
  profile.emailVerified = false;
  return profile;
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(cred.user.uid);
  if (profile) {
    profile.emailVerified = cred.user.emailVerified;
  }
  return profile;
}

export async function logout() {
  await signOut(auth);
}

export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (user && !user.emailVerified) {
    await sendEmailVerification(user);
  }
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function refreshEmailVerification() {
  const user = auth.currentUser;
  if (user) {
    await reload(user);
    return user.emailVerified;
  }
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

// ─── Musicians ────────────────────────────────────────────────────────────────

export async function getMusicians({ instrument, location, minExp } = {}) {
  const q = query(collection(db, "users"), where("role", "==", "musician"));
  const snap = await getDocs(q);
  let musicians = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (instrument) {
    musicians = musicians.filter(m => (m.instruments || []).includes(instrument));
  }
  if (location) {
    musicians = musicians.filter(m =>
      (m.location || "").toLowerCase().includes(location.toLowerCase())
    );
  }
  if (minExp) {
    musicians = musicians.filter(m => (m.experience || 0) >= parseInt(minExp));
  }

  return musicians;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function createBooking({ musicianId, musicianName, clientId, clientName, date, message }) {
  const ref = await addDoc(collection(db, "bookings"), {
    musicianId,
    musicianName,
    clientId,
    clientName,
    date,
    message,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, musicianId, musicianName, clientId, clientName, date, message, status: "pending" };
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