import React from 'react';
import { useNavigate } from 'react-router-dom';

const SousComposant = () => {
  const navigate = useNavigate(); // Utilisation correcte de useNavigate

  return (
    <div>
      <button onClick={() => navigate('/autre-page')}>Aller à une autre page</button>
    </div>
  );
};

export default SousComposant; 