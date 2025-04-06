import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import GenericImageUploader from './components/ImageUploader'; // Nouvel import
import Genealogie from './pages/Genealogie';

// import ImageUploader from './components/ImageUploader'; // Ancien import



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/genealogie" element={<Genealogie />} />
        <Route path="/image-uploader" element={ // Mise à jour ici
          <GenericImageUploader
            onUploadSuccess={(imageUrl: string) => { // Renommé et signature modifiée
              console.log("Uploaded image URL:", imageUrl);
            }}
            onUploadStart={() => {
              console.log("Upload started...");
            }}
            onError={(errorMessage: string) => {
              console.error("Upload error:", errorMessage);
            }}
          // uploadUrl="/api/custom-upload" // Optionnel: si vous voulez une URL spécifique
          // acceptedFileTypes="image/jpeg, image/png" // Optionnel: pour être plus spécifique
          // maxFileSizeMB={2} // Optionnel: pour changer la taille max
          >
            {/* L'élément déclencheur */}
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Uploader une Image
            </button>
          </GenericImageUploader>
        }
        />
        {/* ... autres routes ... */}
      </Routes>
    </Router>
  );
}

export default App;