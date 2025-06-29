import React from 'react';
import { Info, AlertCircle, CheckCircle, XCircle, X, Camera } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  showIcon?: boolean;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  showIcon = true
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />;
      default:
        return <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            {showIcon && getIcon()}
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <div className={`p-3 sm:p-4 rounded-lg border ${getBackgroundColor()}`}>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal; 