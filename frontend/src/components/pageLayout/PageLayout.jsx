import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

export default function PageLayout({ children }) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f1f5f9",
      }}
    >
      <div style={{ height: "4rem", flexShrink: 0 }}>
        <Topbar />
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: "15%", 'min-width': "200px", maxWidth: "300px", flexShrink: 0 }}>
          <Sidebar />
        </div>

        <main style={{ flex: 1, overflow: "auto", padding: "0.5rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
