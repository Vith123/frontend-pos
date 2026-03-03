import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en';
import kh from '../locales/kh';

const translations = { en, kh };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('pos_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('pos_language', language);
    // Set document direction for RTL languages (Khmer is LTR)
    document.documentElement.lang = language === 'kh' ? 'km' : 'en';
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations['en'];
        for (const fallbackKey of keys) {
          if (value && value[fallbackKey] !== undefined) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in fallback
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const switchLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'kh' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: switchLanguage, 
      toggleLanguage,
      t,
      isKhmer: language === 'kh',
      isEnglish: language === 'en'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
