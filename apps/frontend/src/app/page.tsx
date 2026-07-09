export default function Home() {
  return (
    <main className="container">
      <div className="hero">
        <h1>🏨 Brunch Bouaké</h1>
        <p className="subtitle">PMS Hôtelier — Bouaké, Côte d&apos;Ivoire</p>
        <div className="status-card">
          <h2>Scaffolding validé ✅</h2>
          <ul>
            <li><strong>Backend :</strong> NestJS sur <code>:3001</code></li>
            <li><strong>Frontend :</strong> Next.js sur <code>:3000</code></li>
            <li><strong>Base de données :</strong> MySQL via Prisma ORM</li>
            <li><strong>Monorepo :</strong> Turborepo</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
