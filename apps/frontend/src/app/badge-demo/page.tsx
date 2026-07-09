import { Badge } from '@/components/ui';
import styles from './BadgeDemo.module.css';

export const metadata = { title: 'Badge Demo — Brunch Bouaké PMS' };

export default function BadgeDemoPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Badge Demo — Mapping statut → couleur</h1>

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>Réservations</h2>
        <div className={styles.row}>
          <div className={styles.item}>
            <Badge status="PENDING" />
            <span className={styles.code}>PENDING → neutral</span>
          </div>
          <div className={styles.item}>
            <Badge status="CONFIRMED" />
            <span className={styles.code}>CONFIRMED → info</span>
          </div>
          <div className={styles.item}>
            <Badge status="CHECKED_IN" />
            <span className={styles.code}>CHECKED_IN → success</span>
          </div>
          <div className={styles.item}>
            <Badge status="CHECKED_OUT" />
            <span className={styles.code}>CHECKED_OUT → disabled</span>
          </div>
          <div className={styles.item}>
            <Badge status="CANCELLED" />
            <span className={styles.code}>CANCELLED → error 🔴</span>
          </div>
          <div className={styles.item}>
            <Badge status="NO_SHOW" />
            <span className={styles.code}>NO_SHOW → warning 🟡</span>
          </div>
        </div>
      </section>

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>Housekeeping</h2>
        <div className={styles.row}>
          <div className={styles.item}>
            <Badge status="CLEAN" />
            <span className={styles.code}>CLEAN → success</span>
          </div>
          <div className={styles.item}>
            <Badge status="INSPECTION" />
            <span className={styles.code}>INSPECTION → info</span>
          </div>
          <div className={styles.item}>
            <Badge status="DIRTY" />
            <span className={styles.code}>DIRTY → warning 🟡</span>
          </div>
        </div>
      </section>

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>Chambre / Technique</h2>
        <div className={styles.row}>
          <div className={styles.item}>
            <Badge status="VACANT" />
            <span className={styles.code}>VACANT → neutral</span>
          </div>
          <div className={styles.item}>
            <Badge status="OCCUPIED" />
            <span className={styles.code}>OCCUPIED → info</span>
          </div>
          <div className={styles.item}>
            <Badge status="OPERATIONAL" />
            <span className={styles.code}>OPERATIONAL → success</span>
          </div>
          <div className={styles.item}>
            <Badge status="MAINTENANCE" />
            <span className={styles.code}>MAINTENANCE → error 🔴</span>
          </div>
        </div>
      </section>

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>Distinction CANCELLED vs NO_SHOW (point clé)</h2>
        <div className={styles.comparison}>
          <div className={styles.compItem}>
            <Badge status="CANCELLED" label="CANCELLED" />
            <p className={styles.note}>Rouge — action définitive/bloquante</p>
          </div>
          <div className={styles.compItem}>
            <Badge status="NO_SHOW" label="NO_SHOW" />
            <p className={styles.note}>Ambre — à traiter, distinct du rouge</p>
          </div>
          <div className={styles.compItem}>
            <Badge status="DIRTY" label="DIRTY" />
            <p className={styles.note}>Ambre — à nettoyer, pas une erreur système</p>
          </div>
        </div>
      </section>
    </main>
  );
}
