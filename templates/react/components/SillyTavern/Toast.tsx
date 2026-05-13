export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(40, 40, 40, 0.92)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: 6,
        fontSize: 14,
        zIndex: 1000,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
        animation: 'st-toast-in 200ms ease-out',
      }}
    >
      {message}
    </div>
  );
}
