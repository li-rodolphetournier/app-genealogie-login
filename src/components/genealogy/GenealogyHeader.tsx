'use client';

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
  onGoHome: (e?: React.MouseEvent<HTMLAnchorElement>) => void;
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
    <div className={`fixed top-0 right-0 bg-white shadow-md z-10 p-4 transition-all duration-300 ${
      isMenuOpen ? 'left-96' : 'left-0'
    }`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          <button
            onClick={onRefresh}
            disabled={isRefreshing || isSaving}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-2"
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
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={onZoomOut}
              className="px-3 py-1 bg-white hover:bg-gray-50 rounded text-lg font-bold transition-colors"
              title="Réduire"
            >
              −
            </button>
            <span className="px-2 text-sm font-medium min-w-[3rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="px-3 py-1 bg-white hover:bg-gray-50 rounded text-lg font-bold transition-colors"
              title="Agrandir"
            >
              +
            </button>
          </div>
          <a 
            href="/accueil" 
            onClick={(e) => {
              e.preventDefault();
              onGoHome(e);
            }}
            className="text-blue-500 hover:underline"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    </div>
  );
}

