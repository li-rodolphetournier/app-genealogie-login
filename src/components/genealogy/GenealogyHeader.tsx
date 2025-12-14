'use client';

import { BackToHomeButton } from '@/components/navigation';

type GenealogyHeaderProps = {
  title: string;
  isRefreshing: boolean;
  isSaving: boolean;
  canEdit: boolean;
  hasPositions: boolean;
  zoomLevel: number;
  onRefresh: () => void;
  onSavePositions?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onGoHome: (e?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  isMenuOpen: boolean;
};

export function GenealogyHeader({
  title,
  isRefreshing,
  isSaving,
  canEdit,
  hasPositions,
  zoomLevel,
  onRefresh,
  onSavePositions,
  onZoomIn,
  onZoomOut,
  onGoHome,
  isMenuOpen
}: GenealogyHeaderProps) {
  return (
    <div className={`fixed top-0 right-0 bg-white dark:bg-gray-800 shadow-md z-10 p-4 transition-all duration-300 ${
      isMenuOpen ? 'left-96' : 'left-0'
    }`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <button
            onClick={onRefresh}
            disabled={isRefreshing || isSaving}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-2 text-gray-900 dark:text-white"
            title="Rafraîchir les données et les positions depuis le serveur"
          >
            {isRefreshing ? (
              <>
                <span className="animate-spin">⏳</span> Actualisation...
              </>
            ) : (
              <>
                🔄 Actualiser
              </>
            )}
          </button>
          {canEdit && onSavePositions && (
            <button
              onClick={onSavePositions}
              disabled={isSaving || !hasPositions}
              className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
              title="Sauvegarder les positions dans Supabase (partagé avec tous les utilisateurs)"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin">⏳</span> Sauvegarde...
                </>
              ) : (
                <>
                  💾 Sauvegarder dans Supabase
                </>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={onZoomOut}
              className="px-3 py-1 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 rounded text-lg font-bold transition-colors text-gray-900 dark:text-white"
              title="Réduire"
            >
              −
            </button>
            <span className="px-2 text-sm font-medium min-w-[3rem] text-center text-gray-900 dark:text-white">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="px-3 py-1 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 rounded text-lg font-bold transition-colors text-gray-900 dark:text-white"
              title="Agrandir"
            >
              +
            </button>
          </div>
          <BackToHomeButton 
            variant="button" 
            onClick={(e) => {
              e.preventDefault();
              onGoHome(e);
            }}
          />
        </div>
      </div>
    </div>
  );
}

