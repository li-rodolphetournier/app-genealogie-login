import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ImageUploader from './components/ImageUploader';
import Genealogie from './pages/Genealogie';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/genealogie" element={<Genealogie />} />
        <Route path="/image-uploader" element={<ImageUploader />} />
        {/* ... autres routes ... */}
      </Routes>
    </Router>
  );
}

export default App; 