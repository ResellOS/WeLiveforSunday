"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#040305",
          color: "#d8d1c5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.25rem", letterSpacing: "0.1em" }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "0.75rem", opacity: 0.65, fontSize: "0.9rem" }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              padding: "0.6rem 1.25rem",
              border: "1px solid #c99a55",
              background: "transparent",
              color: "#e8c078",
              cursor: "pointer",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: "0.75rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
