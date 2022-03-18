import styles from "./Cards.module.css";

function LoadingCard({ className }) {
  return (
    <div className={`${styles.LoadingCard} ${className || ""}`}>
      <div className={styles.loadingSpinnerLarge}></div>
    </div>
  );
}

function MessageCard({ className, children }) {
  return (
    <div className={`${styles.MessageCard} ${className}`}>
      <span className={styles.message}>{children}</span>
    </div>
  );
}

export { LoadingCard, MessageCard };
