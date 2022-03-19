import styles from "./Cards.module.css";

function BaseCard({ className, children }) {
  return (
    <div className={`${styles.BaseCard} ${className || ""}`}>{children}</div>
  );
}

function LoadingSpinner() {
  return <div className={styles.LoadingSpinner}></div>;
}

function LoadingCard({ className }) {
  return (
    <BaseCard className={`${styles.LoadingCard} ${className || ""}`}>
      <LoadingSpinner />
    </BaseCard>
  );
}

function MessageCard({ className, children }) {
  return (
    <BaseCard className={`${styles.MessageCard} ${className || ""}`}>
      <span className={styles.message}>{children}</span>
    </BaseCard>
  );
}

export { LoadingCard, MessageCard };
