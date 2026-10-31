import styles from '../../components/compare/compare-page.module.css';

/* Lightweight skeleton while the comparison is fetched on the server. */
export default function Loading() {
  return (
    <main id="main-content" className={styles.page} aria-busy="true" aria-label="Loading comparison">
      <div className={styles.skel}>
        <span className={styles.skelLine} style={{ width: 90 }} />
        <span className={styles.skelLine} style={{ width: 'min(520px, 80%)', height: 56 }} />
        <span className={styles.skelLine} style={{ width: 'min(620px, 90%)' }} />
        <div className={styles.skelCards}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={styles.skelCard} />
          ))}
        </div>
      </div>
    </main>
  );
}
