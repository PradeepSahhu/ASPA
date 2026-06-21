import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { ChatPage } from "./pages/ticket-conversation.jsx";
import "./App.css";

function HomePage() {
  return (
    <section id="center">
      <div>
        <h1>Home Page</h1>
        <p>Welcome to your chat frontend.</p>
      </div>
      <Link to="/chat" className="counter">
        Go to Chat Page
      </Link>
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
