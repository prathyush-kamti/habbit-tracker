"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, signInWithGoogle, signInWithEmail } from "../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { Mail, Lock, LogIn } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/dashboard");
    });

    return () => unsubscribe();
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await signInWithEmail(email, password);
      router.replace("/dashboard");
    } catch (err: any) {
      let errorMessage = "Login failed";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errorMessage = "Invalid email or password";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 px-4 py-6 text-white">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 sm:p-5 bg-gray-700 border-b border-gray-600">
          <h1 className="text-xl sm:text-2xl font-bold text-center">Habit Tracker</h1>
        </div>
        
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-medium text-center mb-4 sm:mb-6">Welcome Back</h2>
          
          {error && (
            <div className="mb-4 sm:mb-6 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleEmailLogin} className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 sm:p-3 pl-9 sm:pl-10 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 sm:p-3 pl-9 sm:pl-10 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full p-2 sm:p-3 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-70 text-sm sm:text-base"
            >
              {isLoading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <LogIn size={16} className="mr-2" />
                  Log In
                </>
              )}
            </button>
          </form>
          
          <div className="flex items-center my-4 sm:my-6">
            <hr className="flex-grow border-gray-600" />
            <span className="px-2 sm:px-3 text-xs sm:text-sm text-gray-400">or continue with</span>
            <hr className="flex-grow border-gray-600" />
          </div>
          
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full p-2 sm:p-3 flex items-center justify-center bg-gray-700 border border-gray-600 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-70 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
        
        <div className="p-3 sm:p-4 bg-gray-700 border-t border-gray-600 text-center">
          <p className="text-xs sm:text-sm text-gray-300">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-blue-400 hover:text-blue-300 font-medium focus:outline-none"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}