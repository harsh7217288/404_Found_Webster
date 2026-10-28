"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { useSession } from "@/lib/session";

export function Mark({ size = 28 }: { size?: number }) {
  // A staircase (the escalation ladder) with a seal resting on the top step.
  return (
    <svg width={size} height={size * (32 / 30)} viewBox="0 0 30 32" fill="none" aria-hidden="true">
      <path
        d="M3 30V22H11V16H19V10H27V30Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="23" cy="4.5" r="3.5" fill="#ffb300" />
    </svg>
  );
}

export function Topbar() {
  const { user, ready } = useSession();
  const path = usePathname();
  const router = useRouter();
  const link = (href: string, label: string) => (
    <Link href={href} aria-current={path === href || (href !== "/" && path.startsWith(href)) ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href="/" className="brand">
          <Mark /> Vishanti
        </Link>
        <nav className="nav" aria-label="Main">
          {(!user || user.role === "student") && link("/file", "File a complaint")}
          {user?.role === "student" && link("/tickets", "My complaints")}
          {!user && link("/track", "Track with a token")}
          {user?.role === "official" && link("/desk", "My desk")}
          {user?.role === "admin" && link("/admin", "Administration")}
          {link("/record", "Public record")}
        </nav>
        {ready &&
          (user ? (
            <div className="row">
              <span className="who">
                {user.designation ?? user.full_name}
                {user.role === "official" ? `, level ${user.level}` : ""}
              </span>
              <nav className="nav" aria-label="Account">
                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                >
                  Sign out
                </button>
              </nav>
            </div>
          ) : (
            <nav className="nav" aria-label="Account" style={{ flex: "none" }}>
              {link("/login", "Sign in")}
            </nav>
          ))}
      </div>
    </header>
  );
}
