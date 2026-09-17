export function StatusPage() {
  return (
    <section aria-labelledby="status-heading">
      <h1 id="status-heading">Status</h1>
      <p>
        Placeholder overview. Live CLI probes land in a later ticket via{" "}
        <code>GET /api/hathor/status</code>.
      </p>
      <p>
        Adapter health: <code>GET /api/health</code> (implemented in scaffold).
      </p>
    </section>
  );
}
