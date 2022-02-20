import "./loadingSpinner.css";

function LoadingCard({ className }) {
  return (
    <div className={`LoadingCard ${className || ""}`}>
      <div className="loadingSpinnerLarge"></div>
    </div>
  );
}

export default LoadingCard;
