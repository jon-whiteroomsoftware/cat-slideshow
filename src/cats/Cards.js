import "./Cards.css";
import "./loadingSpinner.css";

function LoadingCard({ className }) {
  return (
    <div className={`LoadingCard ${className || ""}`}>
      <div className="loadingSpinnerLarge"></div>
    </div>
  );
}

function MessageCard({ className, children }) {
  return (
    <div className={`MessageCard ${className}`}>
      <span className="message">{children}</span>
    </div>
  );
}

export { LoadingCard, MessageCard };
