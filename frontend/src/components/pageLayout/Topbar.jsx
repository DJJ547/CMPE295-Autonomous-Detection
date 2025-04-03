
export default function Topbar() {
  return (
    <nav
      style={{
        backgroundColor: "#1f2937",
        paddingTop: "1rem",
        paddingBottom: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          maxWidth: "100%",
          margin: "0 auto",
          paddingLeft: "3rem",
          paddingRight: "3rem",
        }}
      >
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginLeft: "0.5rem",
              marginRight: "1rem",
            }}
          >
            StreetGuard
          </span>
        </a>
      </div>
    </nav>
  );
}