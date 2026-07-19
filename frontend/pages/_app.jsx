import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import "../styles/globals.css";

const NAV_LINKS = [
  { path: "/", label: "Fan Desk" },
  { path: "/chat", label: "Volunteer Desk" },
  { path: "/dashboard", label: "Operations" },
];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("stadiumGenieTheme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setDarkMode(storedTheme ? storedTheme === "dark" : Boolean(prefersDark));
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    window.localStorage.setItem("stadiumGenieTheme", darkMode ? "dark" : "light");
  }, [darkMode, themeReady]);

  return (
    <div>
      <nav className="app-nav" aria-label="Main navigation">
        <span className="app-nav__brand">StadiumGenie</span>
        <div className="app-nav__links">
          {NAV_LINKS.map((navLink) => {
            const isActive = router.pathname === navLink.path;
            return (
              <Link key={navLink.path} href={navLink.path} legacyBehavior>
                <a className={`app-nav__link ${isActive ? "app-nav__link--active" : ""}`}>
                  {navLink.label}
                </a>
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          className="kiosk-button kiosk-button--compact"
          onClick={() => setDarkMode((enabled) => !enabled)}
          aria-pressed={darkMode}
          aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
          title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
        >
          {darkMode ? "Light" : "Dark"}
        </button>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}
