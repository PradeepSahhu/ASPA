import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

export function ChatPage() {
  return (
    <section id="center">
      <div>
        <h1>Chat Page</h1>
        <p>
          This is your second page. You can build your real-time chat UI here.
        </p>
      </div>
      <Link to="/" className="counter">
        Back to Home
      </Link>
    </section>
  );
}
