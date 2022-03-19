import clsx from "clsx";
import styles from "./Cards.module.css";

function BaseCard({ className, children }) {
  return <div className={clsx([styles.baseCard, className])}>{children}</div>;
}

function LoadingSpinner() {
  return <div className={styles.loadingSpinner}></div>;
}

function LoadingCard({ className }) {
  return (
    <BaseCard className={clsx([styles.loadingCard, className])}>
      <LoadingSpinner />
    </BaseCard>
  );
}

function MessageCard({ className, messageClassName, children }) {
  return (
    <BaseCard className={clsx([styles.messageCard, className])}>
      <span className={clsx([styles.message, messageClassName])}>
        {children}
      </span>
    </BaseCard>
  );
}

function ErrorCard({ className, children }) {
  return (
    <MessageCard className={className} messageClassName={styles.errorMessage}>
      {children}
    </MessageCard>
  );
}

export { LoadingCard, MessageCard, ErrorCard };
