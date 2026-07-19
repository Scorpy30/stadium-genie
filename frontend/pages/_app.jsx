import Link from "next/link";
import { useRouter } from "next/router";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  return (
    <div>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          background: "rgba(11, 59, 46, 0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "2px solid #3ecf8e",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
        }}
      >
        <span
          style={{
            fontFamily: "'Teko', sans-serif",
            fontSize: "1.8rem",
            color: "#3ecf8e",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: "600"
          }}
        >
          StadiumGenie ⚡
        </span>
        <div style={{ display: "flex", gap: "1.25rem" }}>
          {[
            { path: "/", label: "Fan Desk" },
            { path: "/chat", label: "Volunteer Desk" },
            { path: "/dashboard", label: "Operations" }
          ].map((navLink) => {
            const isActive = router.pathname === navLink.path;
            return (
              <Link key={navLink.path} href={navLink.path} legacyBehavior>
                <a
                  style={{
                    color: isActive ? "#ffb100" : "#cfe0d8",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                    textDecoration: "none",
                    borderBottom: isActive ? "2px solid #ffb100" : "2px solid transparent",
                    paddingBottom: "4px",
                    transition: "all 0.15s ease"
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.target.style.color = "#ffb100";
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.target.style.color = "#cfe0d8";
                  }}
                >
                  {navLink.label}
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}
