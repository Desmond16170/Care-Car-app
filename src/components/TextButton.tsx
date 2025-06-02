import React from 'react';

interface TextButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const TextButton: React.FC<TextButtonProps> = ({ children, onClick, className }) => {
  const primaryColor = localStorage.getItem('car-care-primary-color') || '#FFA500';

  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        background: 'none',
        border: 'none',
        color: primaryColor,
        textDecoration: 'underline',
        cursor: 'pointer',
        fontWeight: 'bold',
        padding: 0,
        margin: 0
      }}
    >
      {children}
    </button>
  );
};

export default TextButton;
