import { initializeApp } from "firebase/app";
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword 
} from "firebase/auth";
import { 
  getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove,
  collection, getDocs, deleteDoc 
} from "firebase/firestore";
import { format, startOfYear, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";



const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ✅ Google Sign-In
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Google Login:", result.user);
    return result.user;
  } catch (error) {
    console.error("Google Login Error:", error?.message || "An unexpected error occurred.");
    throw new Error(error?.message || "Google sign-in failed. Please try again.");
  }
};

// ✅ Email/Password Sign-Up
const signUpWithEmail = async (email, password, confirmPassword) => {
  if (password !== confirmPassword) {
    throw new Error("Passwords do not match!");
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User registered:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Sign-up Error:", error?.message || "An unexpected error occurred.");
    throw new Error(error?.message || "Sign-up failed. Please check your details and try again.");
  }
};

// ✅ Email/Password Login
const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Email Login:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Login Error:", error?.message || "An unexpected error occurred.");
    throw new Error(error?.message || "Login failed. Please check your credentials.");
  }
};

// ✅ Logout
const logout = async () => {
  try {
    await signOut(auth);
    console.log("User signed out");
  } catch (error) {
    console.error("Logout Error:", error?.message || "An unexpected error occurred.");
    throw new Error(error?.message || "Logout failed. Please try again.");
  }
};

// 🔥 Firestore: Add a new habit for a user
const addHabit = async (userId, habitName) => {
  const habitRef = doc(db, "users", userId, "habits", habitName);
  try {
    await setDoc(habitRef, {
      habitName,
      completedDates: [],
      totalCompleted: 0
    });
    console.log(`Habit "${habitName}" added.`);
  } catch (error) {
    console.error("Error adding habit:", error?.message || "Failed to add habit.");
    throw new Error(error?.message || "Failed to add habit.");
  }
};

// 🔥 Firestore: Delete a habit
const deleteHabit = async (userId, habitName) => {
  const habitRef = doc(db, "users", userId, "habits", habitName);
  try {
    await deleteDoc(habitRef);
    console.log(`Habit "${habitName}" deleted.`);
  } catch (error) {
    console.error("Error deleting habit:", error?.message || "Failed to delete habit.");
    throw new Error(error?.message || "Failed to delete habit.");
  }
};

// 🔥 Firestore: Mark a habit as completed on a specific date
const markHabitCompleted = async (userId, habitName, date) => {
  const habitRef = doc(db, "users", userId, "habits", habitName);
  try {
    const habitDoc = await getDoc(habitRef);
    if (habitDoc.exists()) {
      await updateDoc(habitRef, {
        completedDates: arrayUnion(date),
        totalCompleted: (habitDoc.data().totalCompleted || 0) + 1
      });
      console.log(`Habit "${habitName}" marked as completed on ${date}.`);
    } else {
      console.error("Habit does not exist.");
    }
  } catch (error) {
    console.error("Error updating habit:", error?.message || "Failed to update habit.");
  }
};

// 🔥 Firestore: Remove a habit completion for a specific date
const removeHabitCompletion = async (userId, habitName, date) => {
  const habitRef = doc(db, "users", userId, "habits", habitName);
  try {
    const habitDoc = await getDoc(habitRef);
    if (habitDoc.exists()) {
      const currentTotal = habitDoc.data().totalCompleted || 0;
      await updateDoc(habitRef, {
        completedDates: arrayRemove(date),
        totalCompleted: Math.max(0, currentTotal - 1) // Ensure it doesn't go below 0
      });
      console.log(`Habit "${habitName}" unmarked for ${date}.`);
    } else {
      console.error("Habit does not exist.");
    }
  } catch (error) {
    console.error("Error updating habit:", error?.message || "Failed to update habit.");
    throw new Error(error?.message || "Failed to remove habit completion.");
  }
};

// 🔥 Firestore: Get habit data (completed dates & total count)
const getHabitData = async (userId, habitName) => {
  const habitRef = doc(db, "users", userId, "habits", habitName);
  try {
    const habitDoc = await getDoc(habitRef);
    return habitDoc.exists() ? habitDoc.data() : null;
  } catch (error) {
    console.error("Error fetching habit data:", error?.message || "Failed to fetch habit data.");
    throw new Error(error?.message || "Failed to fetch habit data.");
  }
};

// 🔥 Firestore: Get all habits for a user
const getAllHabits = async (userId) => {
  const habitsRef = collection(db, "users", userId, "habits");
  try {
    const querySnapshot = await getDocs(habitsRef);
    let habits = [];
    querySnapshot.forEach((doc) => {
      habits.push({ id: doc.id, ...doc.data() });
    });
    return habits;
  } catch (error) {
    console.error("Error fetching all habits:", error?.message || "Failed to fetch habits.");
    throw new Error(error?.message || "Failed to fetch habits.");
  }
};

// 📌 Fetch Habit Statistics (Month, Year, Weekly breakdown)
const getHabitStats = async (userId) => {
  const habitsRef = collection(db, "users", userId, "habits");
  try {
    const querySnapshot = await getDocs(habitsRef);
    const today = new Date();
    const yearStart = startOfYear(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd });

    let habitStats = [];

    querySnapshot.forEach((docSnapshot) => {
      const habitData = docSnapshot.data();
      const completedDates = habitData.completedDates || [];
      const habitName = habitData.habitName;

      // Monthly completion count
      const monthDays = completedDates.filter(date => date.startsWith(format(today, "yyyy-MM"))).length;
      
      // Yearly completion count
      const yearDays = completedDates.filter(date => date.startsWith(format(today, "yyyy"))).length;

      // Weekly completion count
      const weekDays = weeks.map((weekStart, index) => {
        return completedDates.filter(date => {
          const d = new Date(date);
          return d >= weekStart && d < (weeks[index + 1] || monthEnd);
        }).length;
      });

      habitStats.push({ habitName, monthDays, yearDays, weekDays });
    });

    return habitStats;
  } catch (error) {
    console.error("Error fetching habit statistics:", error);
    throw new Error(error?.message || "Failed to fetch habit stats.");
  }
};

export { 
  auth, db, signInWithGoogle, signUpWithEmail, signInWithEmail, logout, 
  addHabit, deleteHabit, markHabitCompleted, removeHabitCompletion, getHabitData, getAllHabits ,getHabitStats
};