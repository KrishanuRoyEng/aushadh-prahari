"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { initLanguage, t, setLanguage, getLanguage, LANG_LABELS, type Lang } from "@/lib/i18n";
import { applyFontScale, getConsentStatus, setConsentStatus } from "@/lib/privacy";
import { isDemoMode, setDemoMode } from "@/lib/demo";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [lang, setLang] = useState<Lang>("bn");
  const [demoActive, setDemoActive] = useState<boolean>(false);
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    initLanguage();
    setLang(getLanguage());
    setDemoActive(isDemoMode());
    applyFontScale();

    const status = getConsentStatus();
    if (status === "pending") {
      setShowConsent(true);
    }

    const handleLangChange = () => {
      setLang(getLanguage());
    };
    const handleDemoToggle = () => {
      setDemoActive(isDemoMode());
    };

    window.addEventListener("ap-lang-change", handleLangChange);
    window.addEventListener("ap-demo-toggle", handleDemoToggle);

    return () => {
      window.removeEventListener("ap-lang-change", handleLangChange);
      window.removeEventListener("ap-demo-toggle", handleDemoToggle);
    };
  }, []);

  function handleLangChange(l: Lang) {
    setLanguage(l);
    setLang(l);
  }

  function handleToggleDemo() {
    const nextState = !demoActive;
    setDemoMode(nextState);
    setDemoActive(nextState);
  }

  function handleConsent(accepted: boolean) {
    setConsentStatus(accepted ? "accepted" : "declined");
    setShowConsent(false);
  }

  const navItems = [
    { href: "/", icon: "🏠", label: t("navHome", lang), key: "/" },
    { href: "/check", icon: "🩺", label: t("navCheck", lang), key: "/check" },
    { href: "/heat", icon: "🌡️", label: t("navHeat", lang), key: "/heat" },
    { href: "/patients", icon: "👥", label: t("navPatients", lang), key: "/patients" },
    { href: "/review", icon: "🔬", label: t("navReview", lang), key: "/review" },
    { href: "/demo", icon: "✨", label: t("navDemo", lang), key: "/demo" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getPageTitle = () => {
    if (pathname === "/") return t("appName", lang);
    if (pathname.startsWith("/check")) return t("navCheck", lang);
    if (pathname.startsWith("/heat")) return t("navHeat", lang);
    if (pathname.startsWith("/patients")) return t("navPatients", lang);
    if (pathname.startsWith("/review")) return t("navReview", lang);
    if (pathname.startsWith("/evaluate")) return t("navEvaluate", lang);
    if (pathname.startsWith("/about/language-check")) return t("langCheckTitle", lang);
    if (pathname.startsWith("/about")) return t("navAbout", lang);
    if (pathname.startsWith("/dashboard")) return t("navDashboard", lang);
    if (pathname.startsWith("/demo")) return t("navDemo", lang);
    return t("appName", lang);
  };

  if (showConsent) {
    return (
      <html lang={lang} translate="no">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="google" content="notranslate" />
          <title>{t("appName", lang)}</title>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#1a6b3c" />
        </head>
        <body translate="no">
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
                {t("consentTitle", lang)}
              </h1>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.8, marginBottom: "1.5rem", textAlign: "center" }}>
                {t("consentBody", lang)}
              </p>
              <div style={{ background: "#faf5ff", border: "1.5px solid #c4b5fd", borderRadius: 12, padding: "0.75rem", marginBottom: "1.5rem" }}>
                <p style={{ color: "#5b21b6", fontSize: "0.85rem", fontWeight: 600, textAlign: "center" }}>
                  {t("consentAlert", lang)}
                </p>
              </div>
              <button
                id="consent-accept-btn"
                className="btn btn-primary btn-full"
                style={{ marginBottom: "0.75rem", fontSize: "1rem" }}
                onClick={() => handleConsent(true)}
              >
                {t("consentAccept", lang)}
              </button>
              <button
                className="btn btn-secondary btn-full"
                style={{ fontSize: "0.9rem" }}
                onClick={() => handleConsent(false)}
              >
                {t("consentDecline", lang)}
              </button>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang={lang} translate="no">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="google" content="notranslate" />
        <title>{t("appName", lang)}</title>
        <meta name="description" content={t("appTagline", lang)} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a6b3c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body translate="no">
        <div className="app-shell">
          {/* Persistent Demo Mode Banner */}
          {demoActive && (
            <div
              style={{
                background: "#7c2d12",
                color: "#ffedd5",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.04em",
                textAlign: "center",
                padding: "0.35rem 0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                borderBottom: "1px solid #9a3412",
              }}
              role="alert"
            >
              <span>⚠️</span>
              <span>{t("demoModeBanner", lang)}</span>
              <Link
                href="/demo"
                style={{
                  color: "#fde047",
                  textDecoration: "underline",
                  marginLeft: "0.5rem",
                }}
              >
                {t("navDemo", lang)} →
              </Link>
            </div>
          )}

          <header className="app-header" role="banner">
            {pathname !== "/" && (
              <button
                className="app-header-back touch-target"
                onClick={() => window.history.back()}
                aria-label={t("goBack", lang)}
                style={{ width: 40, height: 40 }}
              >
                ←
              </button>
            )}
            <h1 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {getPageTitle()}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              {/* Demo Mode Toggle in Header */}
              <button
                onClick={handleToggleDemo}
                className={`touch-target ${demoActive ? "btn-warning" : "btn-secondary"}`}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  minHeight: 36,
                  borderRadius: 8,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
                title={demoActive ? t("demoToggleOff", lang) : t("demoToggleOn", lang)}
                aria-pressed={demoActive}
              >
                {demoActive ? "DEMO ON" : "DEMO"}
              </button>

              {/* Language Selector in Header */}
              <select
                id="header-lang-select"
                className="lang-select touch-target"
                value={lang}
                onChange={(e) => handleLangChange(e.target.value as Lang)}
                aria-label={t("selectLanguage", lang)}
                style={{ minHeight: 36, fontWeight: 700 }}
              >
                {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                  <option key={l} value={l}>{LANG_LABELS[l]}</option>
                ))}
              </select>
            </div>
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
