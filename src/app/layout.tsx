"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { initLanguage, t, setLanguage, getLanguage, LANG_LABELS, type Lang } from "@/lib/i18n";
import { applyFontScale, getConsentStatus, setConsentStatus } from "@/lib/privacy";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [lang, setLang] = useState<Lang>("bn");
  const [showConsent, setShowConsent] = useState(false);
  const [consentDone, setConsentDone] = useState(true);

  useEffect(() => {
    initLanguage();
    setLang(getLanguage());
    applyFontScale();
    const status = getConsentStatus();
    if (status === "pending") {
      setShowConsent(true);
      setConsentDone(false);
    }
  }, []);

  function handleLangChange(l: Lang) {
    setLanguage(l);
    setLang(l);
  }

  function handleConsent(accepted: boolean) {
    setConsentStatus(accepted ? "accepted" : "declined");
    setShowConsent(false);
    setConsentDone(true);
  }

  const navItems = [
    { href: "/", icon: "🏠", label: t("navHome", lang), key: "/" },
    { href: "/check", icon: "🩺", label: t("navCheck", lang), key: "/check" },
    { href: "/heat", icon: "🌡️", label: t("navHeat", lang), key: "/heat" },
    { href: "/patients", icon: "👥", label: t("navPatients", lang), key: "/patients" },
    { href: "/review", icon: "🔬", label: t("navReview", lang), key: "/review" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  if (showConsent) {
    return (
      <html lang="bn">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>ঔষধ প্রহরী — Aushadh Prahari</title>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#1a6b3c" />
        </head>
        <body>
          <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--color-bg)", padding: "1.5rem"
          }}>
            <div style={{
              background: "white", borderRadius: 20, padding: "2rem", maxWidth: 480, width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
            }}>
              <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: "1rem" }}>💊</div>
              <h1 style={{ textAlign: "center", color: "var(--color-primary-dark)", marginBottom: "1rem", fontSize: "1.4rem" }}>
                ঔষধ প্রহরী
              </h1>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.8, marginBottom: "1.5rem", textAlign: "center" }}>
                এই অ্যাপটি শুধুমাত্র এই ডিভাইসে রোগীর চেক ডেটা সংরক্ষণ করে।
                কোনো নাম বা ফোন নম্বর প্রয়োজন নেই।
                আপনি যেকোনো সময় সমস্ত ডেটা মুছে ফেলতে পারবেন।
              </p>
              <div style={{ background: "#faf5ff", border: "1.5px solid #c4b5fd", borderRadius: 12, padding: "0.75rem", marginBottom: "1.5rem" }}>
                <p style={{ color: "#5b21b6", fontSize: "0.85rem", fontWeight: 600, textAlign: "center" }}>
                  সিদ্ধান্ত সহায়তা সরঞ্জাম। চিকিৎসা যন্ত্র নয়। ডাক্তার ছাড়া কোনো ওষুধ পরিবর্তন করবেন না।
                </p>
              </div>
              <button className="btn btn-primary btn-full" style={{ marginBottom: "0.75rem", fontSize: "1rem" }}
                onClick={() => handleConsent(true)}>
                আমি বুঝেছি — চালিয়ে যান ✓
              </button>
              <button className="btn btn-secondary btn-full" style={{ fontSize: "0.9rem" }}
                onClick={() => handleConsent(false)}>
                কোনো ডেটা সংরক্ষণ করবেন না
              </button>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="bn">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ঔষধ প্রহরী — Aushadh Prahari</title>
        <meta name="description" content="Voice-first medicine safety aid for CHOs and ASHAs in rural West Bengal. Identifies which medicines need doctor review during illness or heatwave." />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a6b3c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <div className="app-shell">
          <header className="app-header" role="banner">
            {pathname !== "/" && (
              <button
                className="app-header-back touch-target"
                onClick={() => window.history.back()}
                aria-label="Go back"
                style={{ width: 40, height: 40 }}
              >
                ←
              </button>
            )}
            <h1>
              {pathname === "/" ? "ঔষধ প্রহরী" :
               pathname.startsWith("/check") ? t("navCheck", lang) :
               pathname.startsWith("/heat") ? t("navHeat", lang) :
               pathname.startsWith("/patients") ? t("navPatients", lang) :
               pathname.startsWith("/review") ? t("navReview", lang) :
               pathname.startsWith("/evaluate") ? t("navEvaluate", lang) :
               pathname.startsWith("/about") ? t("navAbout", lang) :
               pathname.startsWith("/dashboard") ? t("navDashboard", lang) :
               "ঔষধ প্রহরী"}
            </h1>
            <select
              className="lang-select touch-target"
              value={lang}
              onChange={(e) => handleLangChange(e.target.value as Lang)}
              aria-label="Select language"
              style={{ minHeight: 36 }}
            >
              {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                <option key={l} value={l}>{LANG_LABELS[l]}</option>
              ))}
            </select>
          </header>

          <main id="main-content" tabIndex={-1} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </main>

          <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`bottom-nav-item ${isActive(item.key) ? "active" : ""}`}
                aria-label={item.label}
                aria-current={isActive(item.key) ? "page" : undefined}
              >
                <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(e) {
                console.log('SW registration failed:', e);
              });
            });
          }
        ` }} />
      </body>
    </html>
  );
}
