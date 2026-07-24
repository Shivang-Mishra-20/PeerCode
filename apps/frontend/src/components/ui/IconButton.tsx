import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode;
  label: string;
  variant?: 'ghost' | 'secondary' | 'outline' | 'active';
  size?: 'sm' | 'md';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-md transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed select-none';

  const variantStyles = {
    ghost: 'text-gray-400 hover:text-gray-100 hover:bg-[#21262d]',
    secondary:
      'bg-[#21262d] text-gray-300 hover:text-white hover:bg-[#30363d] border border-[#30363d]',
    outline:
      'bg-transparent text-gray-400 hover:text-white border border-[#30363d] hover:bg-[#161b22]',
    active: 'bg-blue-600/15 text-blue-400 border border-blue-500/30',
  };

  const sizeStyles = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      aria-label={label}
      title={label}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon}
    </motion.button>
  );
};

export default IconButton;
