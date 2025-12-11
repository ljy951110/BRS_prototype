import { ReactNode, ElementType } from 'react';
import styles from './index.module.scss';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-md' | 'body-sm' | 'caption' | 'label';
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'accent' | 'success' | 'warning' | 'error';

interface TextProps {
  children: ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  mono?: boolean;
  as?: ElementType;
  className?: string;
}

export const Text = ({
  children,
  variant = 'body',
  color = 'primary',
  weight,
  mono = false,
  as,
  className = '',
}: TextProps) => {
  const defaultTags: Record<TextVariant, ElementType> = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    body: 'p',
    'body-md': 'p',
    'body-sm': 'p',
    caption: 'span',
    label: 'span',
  };

  const Component = as || defaultTags[variant];

  return (
    <Component
      className={`
        ${styles.text}
        ${styles[variant]}
        ${styles[`color-${color}`]}
        ${weight ? styles[`weight-${weight}`] : ''}
        ${mono ? styles.mono : ''}
        ${className}
      `.trim()}
    >
      {children}
    </Component>
  );
};


