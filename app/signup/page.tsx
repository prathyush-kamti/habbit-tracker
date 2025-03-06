"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpWithEmail } from "../../lib/firebaseConfig";
import Link from "next/link";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError("");
    
    try {
      await signUpWithEmail(email, password, confirmPassword);
      router.replace("/dashboard"); // Redirect after successful sign-up
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-6">
      {/* Form Container */}
      <div className="w-full max-w-md bg-gray-800 p-4 sm:p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Join our community and get started today</p>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-5">
          <div className="text-left">
            <label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-300 block mb-1">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 sm:p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm sm:text-base"
            />
          </div>

          <div className="text-left">
            <label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-300 block mb-1">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 sm:p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm sm:text-base"
            />
          </div>

          <div className="text-left">
            <label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium text-gray-300 block mb-1">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full p-2 sm:p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm sm:text-base"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-2 sm:p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 transition-all flex items-center justify-center disabled:opacity-70 text-sm sm:text-base mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>

          <div className="text-xs sm:text-sm text-center text-gray-400 pt-1">
            Already have an account? <Link href="/" className="text-blue-400 hover:text-blue-300">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}