export function AboutPage() {
  return (
    <section aria-labelledby="about-heading">
      <h1 id="about-heading">About</h1>
      <p>
        <strong>HATHOR Integration Console POC</strong> — a read-only React/TypeScript client over
        the OpenSource <code>hath0r</code> CLI. It is not a shell, policy engine, or second control
        plane.
      </p>
      <ul>
        <li>Control tower: HATH0R-CLI</li>
        <li>Framework docs: hath0r/docs</li>
        <li>Package manager: npm (lockfile committed)</li>
        <li>HTTP library: Express (loopback adapter)</li>
      </ul>
    </section>
  );
}
