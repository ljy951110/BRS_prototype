import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Text } from '../Text';
import styles from './index.module.scss';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export const Drawer = ({ isOpen, onClose, title, children, width = 'md' }: DrawerProps) => {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 드로어 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 백드롭 클릭 시 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* 백드롭 */}
      <div 
        className={`${styles.backdrop} ${isOpen ? styles.open : ''}`} 
        onClick={handleBackdropClick}
      />
      
      {/* 드로어 */}
      <div 
        className={`${styles.drawer} ${styles[`width_${width}`]} ${isOpen ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className={styles.header}>
            <Text variant="h4" weight="semibold">{title}</Text>
            <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
              <X size={18} />
            </button>
          </div>
        )}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </>
  );
};

