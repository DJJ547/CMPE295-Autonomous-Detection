import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center h-48 space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      <p className="text-gray-600 text-lg font-medium">Loading chart...</p>
    </div>
  );
};

export default LoadingSpinner;
