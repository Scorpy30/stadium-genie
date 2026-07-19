import ChatWidget from "../components/ChatWidget";

export default function VolunteerConsole() {
  return (
    <>
      <header className="gate-bar">
        <p className="gate-bar__eyebrow">Gate // Volunteer Console</p>
        <h1>Volunteer Desk</h1>
        <p>Quick answers for accessibility and on-the-ground ops questions.</p>
      </header>
      <main className="page" aria-label="Volunteer console">
        <ChatWidget endpoint="/api/v1/accessibility/assist" placeholder="Ask an ops question..." />
      </main>
    </>
  );
}
