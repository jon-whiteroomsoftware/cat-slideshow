function MessageCard({ className, children }) {
  return (
    <div className={`MessageCard ${className}`}>
      <span className="message">{children}</span>
    </div>
  );
}

export default MessageCard;
