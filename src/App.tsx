import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ImageUploader from './components/ImageUploader';
import Genealogie from './pages/Genealogie';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/genealogie" element={<Genealogie />} />
        <Route path="/image-uploader" element={<ImageUploader
          onUpload={(imageUrls: string[]) => {
            console.log("Uploaded image URLs:", imageUrls);
          }}
          type="profile" // choose an appropriate type for your use-case
        />
        }
        />
        {/* ... autres routes ... */}
      </Routes>
    </Router>
  );
}

export default App;