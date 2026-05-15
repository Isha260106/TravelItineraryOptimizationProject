import { forwardRef } from 'react';

const Button = forwardRef(function Button(
  { className = '', variant = 'secondary', size = 'md', type = 'button', disabled, children, ...props },
  ref
) {
  let baseClass = 'btn';
  
  if (variant === 'primary') baseClass += ' btn-primary';
  else if (variant === 'secondary') baseClass += ' btn-secondary';
  else if (variant === 'ghost') baseClass += ' btn-ghost';
  
  // Custom styles for unsupported variants
  const customStyle = variant === 'danger' ? {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    color: '#fda4af',
    border: '1px solid rgba(244, 63, 94, 0.35)',
  } : {};
  
  if (variant === 'ghost') {
    customStyle.backgroundColor = 'transparent';
    customStyle.border = 'none';
  }

  const sizeStyle = size === 'sm' ? { padding: '0.4rem 0.8rem', fontSize: '0.8rem' } :
                    size === 'lg' ? { padding: '0.8rem 1.5rem', fontSize: '1.05rem' } : {};

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${baseClass} ${className}`}
      style={{ ...customStyle, ...sizeStyle, ...props.style }}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
