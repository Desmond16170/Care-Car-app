import React from 'react';

interface ThemedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const ThemedButton: React.FC<ThemedButtonProps> = ({
  children,
  onClick,
  type = 'button',
  className = '',
  style = {},
  disabled = false,
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
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    transition: 'background-color 0.2s ease',
    width: '100%',
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      style={combinedStyle}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default ThemedButton;
