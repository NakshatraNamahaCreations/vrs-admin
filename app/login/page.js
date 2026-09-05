"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineEnvelope, HiOutlineLockClosed, HiArrowRight, HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import { login, useAdmin } from "../lib/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, ready } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && isLoggedIn) router.replace("/dashboard");
  }, [ready, isLoggedIn, router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      // Normalize the couple of shapes the backend / network layer might
      // return into one clear message shown next to the form.
      if (err.status === 401) {
        setError("Incorrect email or password. Please try again.");
      } else if (err.status === 400) {
        setError(err.message || "Please enter your email and password.");
      } else {
        setError(err.message || "Couldn't sign you in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.decor} aria-hidden />
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logo}>VRS</span>
          <div>
            <b>VRS Water Purifiers</b>
            <span>Admin console</span>
          </div>
        </div>

        <h1>Welcome back</h1>
        <p>Sign in with your admin credentials to continue.</p>

        <form onSubmit={onSubmit} className={styles.form}>
          <label className={styles.field}>
            <span>Email</span>
            <div className={styles.inputWrap}>
              <HiOutlineEnvelope />
              <input
                type="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vrswaterpurifiers.in"
              />
            </div>
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <div className={styles.inputWrap}>
              <HiOutlineLockClosed />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className={styles.reveal}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
              </button>
            </div>
          </label>

          {error && <span className={styles.error}>{error}</span>}

          <button type="submit" className={styles.submit} disabled={loading || !email || !password}>
            {loading ? "Signing in…" : <>Sign in <HiArrowRight /></>}
          </button>
        </form>

        <p className={styles.hint}>
          Trouble signing in? Contact your admin — password can be reset via
          the backend&apos;s <code>npm run seed:admin</code> script.
        </p>
      </div>
    </div>
  );
}
