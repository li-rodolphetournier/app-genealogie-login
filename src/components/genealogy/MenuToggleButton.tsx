'use client';

type MenuToggleButtonProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export function MenuToggleButton({ isOpen, onToggle }: MenuToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`fixed top-1/2 ${isOpen ? 'left-96' : 'left-0'} z-20 bg-white p-2 rounded-r-md shadow-md transition-all duration-300 hover:bg-gray-50`}
      aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
    >
      <svg
        className={`h-6 w-6 text-gray-600 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}

