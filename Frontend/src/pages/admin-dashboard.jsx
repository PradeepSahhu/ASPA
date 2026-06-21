import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000";

const statusColor = (status) => {
  if (status === "OPEN") return "#40c057";
  if (status === "CLOSED") return "#adb5bd";
  return "#fab005";
};

export function AdminDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/ticket/getAllTickets`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setTickets(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tickets.filter(
    (t) =>
      t.header.toLowerCase().includes(search.toLowerCase()) ||
      t.author?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.author?.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        minHeight: "100vh",
        background: "#f8f9fa",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "14px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ color: "#495057" }}>
            {user.name || user.email || "Admin"}
          </span>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            style={{
              padding: "6px 14px",
              background: "#ff6b6b",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: "8px",
            padding: "20px",
            border: "1px solid #dee2e6",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              gap: "12px",
            }}
          >
            <h3 style={{ margin: 0 }}>All Tickets</h3>
            <input
              type="text"
              placeholder="Search by subject or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                width: "280px",
              }}
            />
          </div>

          {loading ? (
            <p style={{ color: "#adb5bd" }}>Loading tickets...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "#adb5bd" }}>No tickets found.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f1f3f5", textAlign: "left" }}>
                  <th style={th}>Subject</th>
                  <th style={th}>Author</th>
                  <th style={th}>Email</th>
                  <th style={th}>Category</th>
                  <th style={th}>Status</th>
                  <th style={th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/${ticket.id}`)}
                    style={{
                      borderBottom: "1px solid #dee2e6",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8f9fa")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <td style={td}>{ticket.header}</td>
                    <td style={td}>{ticket.author?.name || "—"}</td>
                    <td style={td}>{ticket.author?.email || "—"}</td>
                    <td style={td}>{ticket.category || "—"}</td>
                    <td style={td}>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          background: statusColor(ticket.status),
                          color: "#fff",
                        }}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td style={{ ...td, color: "#868e96", fontSize: "13px" }}>
                      {new Date(ticket.createdDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const th = {
  padding: "10px 14px",
  fontWeight: "600",
  fontSize: "13px",
  color: "#495057",
};

const td = {
  padding: "12px 14px",
  fontSize: "14px",
  verticalAlign: "middle",
};
