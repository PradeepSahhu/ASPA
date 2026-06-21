import { useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { ChatPage } from "./pages/ticket-conversation.jsx";
import { AuthorDashboardPage } from "./pages/author-dashboard.jsx";
import { AdminDashboardPage } from "./pages/admin-dashboard.jsx";
import { TicketDetailPage } from "./pages/ticket-detail.jsx";
import "./App.css";

function HomePage() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isAdmin ? "/admin/login" : "/author/login";

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Save auth info and navigate
      localStorage.setItem("user", JSON.stringify(data.data));
      localStorage.setItem("role", isAdmin ? "admin" : "author");
      navigate(isAdmin ? "/admin-dashboard" : "/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Admin Toggle Button - Top Right */}
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <button
          onClick={() => {
            setIsAdmin(!isAdmin);
            setCredentials({ email: "", password: "" });
            setError("");
          }}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            backgroundColor: isAdmin ? "#ff6b6b" : "#4dabf7",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isAdmin ? "Switch to Author" : "Admin Login"}
        </button>
      </div>

      <section id="center">
        <div>
          <h1>{isAdmin ? "Admin Login" : "Author Login"}</h1>
          <p>Welcome to your chat frontend. Please login to continue.</p>
        </div>
        <form
          onSubmit={handleLogin}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "300px",
          }}
        >
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={credentials.email}
            onChange={handleInputChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleInputChange}
            required
          />
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button type="submit" className="counter" disabled={loading}>
            {loading
              ? "Logging in..."
              : `${isAdmin ? "Admin" : "Author"} Login`}
          </button>
        </form>
      </section>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<AuthorDashboardPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/:ticketId" element={<TicketDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
