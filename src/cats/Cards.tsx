import { ReactNode } from "react";
import clsx from "clsx";
import styles from "./Cards.module.css";

type BaseCardProps = {
  className?: string;
  children: ReactNode;
};

function BaseCard({ className, children }: BaseCardProps) {
  return <div className={clsx([styles.baseCard, className])}>{children}</div>;
}

function LoadingSpinner() {
  return <div className={styles.loadingSpinner}></div>;
}

type LoadingCardProps = {
  className?: string;
};

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <BaseCard className={clsx([styles.loadingCard, className])}>
      <LoadingSpinner />
    </BaseCard>
  );
}

type MessageCardProps = {
  className?: string;
  messageClassName: string;
  children: ReactNode;
};

export function MessageCard({
  className,
  messageClassName,
  children,
}: MessageCardProps) {
  return (
    <BaseCard className={className}>
      <span className={clsx([styles.message, messageClassName])}>
        {children}
      </span>
    </BaseCard>
  );
}

type ErrorCardProps = {
  className?: string;
  children: ReactNode;
};

export function ErrorCard({ className, children }: ErrorCardProps) {
  return (
    <MessageCard className={className} messageClassName={styles.errorMessage}>
      {children}
    </MessageCard>
  );
}
