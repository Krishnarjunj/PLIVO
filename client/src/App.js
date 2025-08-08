import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Playground from './pages/Playground';

function App() {
  return (
    <div className="min-h-screen bg-linear-gray">
      <Routes>
        <Route path="/playground" element={<Playground />} />
        <Route path="/" element={<Navigate to="/playground" replace />} />
      </Routes>
    </div>
  );
}

export default App;
