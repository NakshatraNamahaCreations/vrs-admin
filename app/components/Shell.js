"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  HiOutlineSquares2X2,
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlineShoppingBag,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";
import { useAdmin, logout } from "../lib/auth";
import styles from "./Shell.module.css";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: <HiOutlineSquares2X2 /> },
  { href: "/products", label: "Products", icon: <HiOutlineCube /> },
  { href: "/customers", label: "Customers", icon: <HiOutlineUsers /> },
  { href: "/orders", label: "Orders", icon: <HiOutlineShoppingBag /> },
  { href: "/enquiries", label: "Enquiries", icon: <HiOutlineChatBubbleLeftRight /> },
];

export default function Shell({ children, title, subtitle, actions }) {
  const { admin, ready, isLoggedIn } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isLoggedIn) router.replace("/login");
  }, [ready, isLoggedIn, router]);

  if (!ready || !admin) {
    return <div className={styles.blank}>Loading…</div>;
  }

  const doLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/dashboard" className={styles.brand}>
          <span className={styles.logo}>VRS</span>
          <span>Admin console</span>
        </Link>

        <nav className={styles.nav}>
          {nav.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              >
                <span className={styles.navIcon}>{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{(admin.name || "A")[0].toUpperCase()}</div>
            <div>
              <b>{admin.name}</b>
              <em>{admin.email}</em>
            </div>
          </div>
          <button onClick={doLogout} className={styles.logoutBtn}>
            <HiOutlineArrowRightOnRectangle /> Sign out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
        <div className={styles.body}>{children}</div>
      </main>
    </div>
  );
}
