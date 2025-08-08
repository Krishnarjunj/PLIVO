import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-linear-gray flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default LoadingSpinner;
