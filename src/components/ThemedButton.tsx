import React from 'react';

interface ThemedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
}

const ThemedButton: React.FC<ThemedButtonProps> = ({
  children,
  onClick,
  type = 'button',
  className = '',
  style = {},
}) => {
  const primaryColor = localStorage.getItem('car-care-primary-color') || '#FFA500';
  const textColor = localStorage.getItem('car-care-text-color') || '#FFFFFF';
  const fontFamily = localStorage.getItem('car-care-font-family') || 'Arial';

  const combinedStyle: React.CSSProperties = {
    backgroundColor: primaryColor,
    color: textColor,
    fontFamily,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    width: '100%',
    ...style, // permite override si se desea
  };

  return (
    <button type={type} onClick={onClick} className={className} style={combinedStyle}>
      {children}
    </button>
  );
};

export default ThemedButton;
