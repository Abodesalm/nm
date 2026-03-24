export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <>
      <div
        style={{
          width: size,
          height: size,
          border: `${size / 8}px solid var(--border)`,
          borderTopColor: "#f97316",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
          flexShrink: 0,
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export function PageSpinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 300,
      }}
    >
      <Spinner size={32} />
    </div>
  );
}
