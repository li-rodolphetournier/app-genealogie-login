import React from 'react';
import { useNavigate } from 'react-router-dom';

const Genealogie = () => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate('/image-uploader');
  };

  return (
    <div>
      <h1>Page de Généalogie</h1>
      <button onClick={handleNavigation}>Aller à l'Uploader d'Images</button>
      {/* ... autres contenus ... */}
    </div>
  );
};

export default Genealogie; 