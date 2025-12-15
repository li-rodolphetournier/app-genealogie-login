'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme, type ThemeTemplate } from '@/hooks/use-theme';
import { motion, AnimatePresence } from 'framer-motion';

type ThemeTemplateSelectorProps = {
  isAdmin: boolean;
};

const TEMPLATES: Array<{ id: ThemeTemplate; name: string; description: string; colors: string[] }> = [
  {
    id: 'default',
    name: 'Par défaut',
    description: 'Thème actuel (clair et sombre)',
    colors: ['#ffffff', '#0a0a0a'],
  },
  {
    id: 'ocean-sunset',
    name: 'Ocean Sunset',
    description: 'Bleu, jaune, orange, rose',
    colors: ['#4a90e2', '#f5d76e', '#ff8c42', '#ff6b9d'],
  },
  {
    id: 'warm-gradient',
    name: 'Warm Gradient',
    description: 'Palette nature (vert profond, sauge, accent terre)',
    colors: ['#F3F6F2', '#4F6F52', '#A9B7A0', '#8C6A4A', '#2F3E34'],
  },
];

export function ThemeTemplateSelector({ isAdmin }: ThemeTemplateSelectorProps) {
  const { template, setTemplate, mounted } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!isAdmin || !mounted) {
    return null;
  }

  const currentTemplate = TEMPLATES.find((t) => t.id === template) || TEMPLATES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
        aria-label="Sélectionner un template de thème"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-xs">Template:</span>
          <span className="font-semibold">{currentTemplate.name}</span>
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            <div className="py-1">
              {TEMPLATES.map((templateOption) => {
                const isSelected = templateOption.id === template;
                return (
                  <button
                    key={templateOption.id}
                    onClick={() => {
                      setTemplate(templateOption.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex gap-0.5 mt-0.5">
                        {templateOption.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-4 h-4 rounded-sm border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {templateOption.name}
                          </span>
                          {isSelected && (
                            <svg
                              className="w-4 h-4 text-blue-600 dark:text-blue-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {templateOption.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

