const TypingDots = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-2 w-2 rounded-full bg-primary/60"
        style={{
          animation: "typing-bounce 1.4s infinite ease-in-out both",
          animationDelay: `${i * 0.16}s`,
        }}
      />
    ))}
  </div>
);

export default TypingDots;
