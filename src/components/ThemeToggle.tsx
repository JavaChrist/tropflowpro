import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors duration-200"
      title={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
    >
      <div className="relative w-5 h-5">
        {/* Icône soleil pour mode clair */}
        <Sun
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${theme === 'light'
              ? 'rotate-0 scale-100 opacity-100'
              : 'rotate-90 scale-0 opacity-0'
            }`}
        />
        {/* Icône lune pour mode sombre */}
        <Moon
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${theme === 'dark'
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0'
            }`}
        />
      </div>
    </button>
  );
};

export default ThemeToggle; 