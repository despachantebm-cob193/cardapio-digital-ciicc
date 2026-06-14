export const SNACK_BAG_ICON = 'custom:snack-bag';

interface ProductIconProps {
  icon?: string | null;
  className?: string;
}

export function getProductIconText(icon?: string | null) {
  if (icon === SNACK_BAG_ICON) {
    return '🥨';
  }

  return icon || '🍽️';
}

export function ProductIcon({ icon, className = 'w-6 h-6 text-xl' }: ProductIconProps) {
  if (icon === SNACK_BAG_ICON) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`} title="Pacote de salgadinho">
        <svg
          viewBox="0 0 64 64"
          aria-hidden="true"
          className="w-full h-full drop-shadow-sm"
        >
          <path
            d="M18 8h28l4 8-4 8 4 8-4 8 4 8-4 8H18l-4-8 4-8-4-8 4-8-4-8 4-8Z"
            fill="#f59e0b"
            stroke="#18181b"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M18 8h28l4 8H14l4-8Z"
            fill="#ef4444"
            stroke="#18181b"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M14 48h36l-4 8H18l-4-8Z"
            fill="#ef4444"
            stroke="#18181b"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M22 27c5-6 15-6 20 0 3 4 3 10 0 14-5 6-15 6-20 0-3-4-3-10 0-14Z"
            fill="#fff7ed"
            stroke="#18181b"
            strokeWidth="2"
          />
          <circle cx="27" cy="34" r="2" fill="#f97316" />
          <circle cx="35" cy="33" r="2" fill="#f97316" />
          <path d="M27 41c4 2 8 2 11-1" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {icon || '🍽️'}
    </span>
  );
}
