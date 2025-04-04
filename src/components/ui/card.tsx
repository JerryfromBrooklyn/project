import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export const Card = ({ className = '', children }: CardProps) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ className = '', children }: CardContentProps) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

export default { Card, CardContent }; 