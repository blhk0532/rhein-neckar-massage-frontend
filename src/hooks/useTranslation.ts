import { useState, useEffect } from 'react';

// Translation type
type TranslationValue = { de: string; en: string };
type Translations = Record<string, TranslationValue>;

// Default language strings - in a real app, these would come from an API or i18n library
const defaultTranslations: Translations = {
  // Navigation
  'nav.home': { de: 'Home', en: 'Home' },
  'nav.mieterinnen': { de: 'Mieterinnen', en: 'Tenants' },
  'nav.angebot': { de: 'Angebot', en: 'Offer' },
  'nav.ambiente': { de: 'Ambiente', en: 'Ambiance' },
  'nav.gaestebuch': { de: 'Gästebuch', en: 'Guest Book' },
  'nav.kontakt': { de: 'Kontakt', en: 'Contact' },

  // Footer
  'footer.brand': {
    de: 'Rhein Neckar Massage Heidelberg',
    en: 'Rhein Neckar Massage Heidelberg'
  },
  'footer.description': {
    de: 'Ihr exklusives Erotik-Massage Studio in Heidelberg. Sinnliche Entspannung in eleganter, diskreter Atmosphäre. Höchste Qualität und absolute Diskretion sind unsere Priorität.',
    en: 'Your exclusive erotic massage studio in Heidelberg. Sensual relaxation in elegant, discreet atmosphere. Highest quality and absolute discretion are our priority.'
  },
  'footer.copyright': {
    de: '© 2025 Rhein Neckar Massage. Alle Rechte vorbehalten.',
    en: '© 2025 Rhein Neckar Massage. All rights reserved.'
  },

  // Common
  'common.loading': { de: 'Lädt...', en: 'Loading...' },
  'common.error': { de: 'Fehler', en: 'Error' },
  'common.notFound': { de: 'Nicht gefunden', en: 'Not found' },
  'common.back': { de: 'Zurück', en: 'Back' },
  'common.back_to_overview': { de: 'Zurück zur Übersicht', en: 'Back to overview' },
  
  // Ambiente errors
  'ambiente.error.not_found': { de: 'Raum nicht gefunden', en: 'Room not found' },
  'ambiente.error.load': { de: 'Fehler beim Laden', en: 'Error loading' },
  
  // Angebot errors
  'angebot.error.not_found': { de: 'Service nicht gefunden', en: 'Service not found' },
  'angebot.error.load': { de: 'Fehler beim Laden', en: 'Error loading' },
  
  // Angebot booking
  'angebot.book_service': { de: 'Service buchen', en: 'Book service' },
  'angebot.select_duration': { de: 'Dauer wählen', en: 'Select duration' },
  'angebot.standard': { de: 'Standard', en: 'Standard' },
  'angebot.duration': { de: 'Dauer', en: 'Duration' },
  'angebot.price': { de: 'Preis', en: 'Price' },
  'angebot.minutes': { de: 'Minuten', en: 'minutes' },
  'angebot.selected_duration': { de: 'Ausgewählte Dauer', en: 'Selected duration' },
  'angebot.total_price': { de: 'Gesamtpreis', en: 'Total price' },
  'angebot.book_description': { de: 'Buchen Sie jetzt Ihr unvergessliches Erlebnis. Diskret und professionell.', en: 'Book your unforgettable experience now. Discreet and professional.' },
  'angebot.book_now': { de: 'Jetzt buchen', en: 'Book now' },
  'angebot.booking_note': { de: '100% diskret und sicher', en: '100% discreet and secure' },
};

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState<'de' | 'en'>('de');
  const [translations, setTranslations] = useState<Translations>(defaultTranslations);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('language') as 'de' | 'en' || 'de';
    setCurrentLanguage(savedLanguage);
    // Helper to resolve API base at runtime. Prefer Vite build-time env, then window global, then origin/api
    // Defined inside the hook so other functions (changeLanguage/refreshTranslations) can reuse it.
    const getApiBase = () => {
      try {
        const buildTime = (import.meta as any).env?.VITE_API_BASE as string | undefined;
        if (buildTime && buildTime !== 'undefined') return buildTime.replace(/\/$/, '');
      } catch (e) {
        // ignore
      }
      // Allow injecting at runtime via a global (useful for deployments where build-time env isn't available)
      const runtime = (window as any).__API_BASE || (window as any).__RUNTIME_CONFIG?.VITE_API_BASE;
      if (runtime) return String(runtime).replace(/\/$/, '');
      // Fallback to same-origin /api
      return `${window.location.origin.replace(/\/$/, '')}/api`;
    };

    // Fetch custom translations from API
    const fetchTranslations = async () => {
      const apiBase = getApiBase();
      try {
        const response = await fetch(`${apiBase}/language-strings?lang=${savedLanguage}&t=${Date.now()}`);
        if (response.ok) {
          const payload = await response.json();
          const data = payload.data ?? payload;
          const lastUpdated = payload.last_updated ?? null;
          if (lastUpdated) {
            localStorage.setItem('language_last_updated', lastUpdated);
          }
          const customTranslations: any = {};
          data.forEach((item: any) => {
            customTranslations[item.key] = {
              de: item.german,
              en: item.english
            };
          });
          setTranslations({ ...defaultTranslations, ...customTranslations });
          setIsLoading(false);
        } else {
          // Fallback to localStorage if API fails
          const savedTranslations = localStorage.getItem('languageStrings');
          if (savedTranslations) {
            const parsed = JSON.parse(savedTranslations);
            const customTranslations: any = {};
            parsed.forEach((item: any) => {
              customTranslations[item.key] = {
                de: item.german,
                en: item.english
              };
            });
            setTranslations({ ...defaultTranslations, ...customTranslations });
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching translations:', error);
        // Fallback to localStorage if API fails
        const savedTranslations = localStorage.getItem('languageStrings');
        if (savedTranslations) {
          try {
            const parsed = JSON.parse(savedTranslations);
            const customTranslations: any = {};
            parsed.forEach((item: any) => {
              customTranslations[item.key] = {
                de: item.german,
                en: item.english
              };
            });
            setTranslations({ ...defaultTranslations, ...customTranslations });
          } catch (parseError) {
            console.error('Error loading custom translations:', parseError);
          }
        }
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, []);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      // Only log warnings when not loading to avoid console spam during initial load
      if (!isLoading) {
        console.warn(`Translation key "${key}" not found`);
      }
      return key;
    }
    return translation[currentLanguage] || translation.de || key;
  };

  const changeLanguage = async (language: 'de' | 'en') => {
    setCurrentLanguage(language);
    localStorage.setItem('language', language);

    // Fetch translations for the new language from API
    try {
      const apiBase = (() => {
        try {
          const buildTime = (import.meta as any).env?.VITE_API_BASE as string | undefined;
          if (buildTime && buildTime !== 'undefined') return buildTime.replace(/\/$/, '');
        } catch (e) {}
        const runtime = (window as any).__API_BASE || (window as any).__RUNTIME_CONFIG?.VITE_API_BASE;
        if (runtime) return String(runtime).replace(/\/$/, '');
        return `${window.location.origin.replace(/\/$/, '')}/api`;
      })();
      const response = await fetch(`${apiBase}/language-strings?lang=${language}&t=${Date.now()}`);
      if (response.ok) {
        const payload = await response.json();
        const data = payload.data ?? payload;
        const lastUpdated = payload.last_updated ?? null;
        if (lastUpdated) {
          localStorage.setItem('language_last_updated', lastUpdated);
        }
        const customTranslations: any = {};
        data.forEach((item: any) => {
          customTranslations[item.key] = {
            de: item.german,
            en: item.english
          };
        });
        setTranslations({ ...defaultTranslations, ...customTranslations });
      } else {
        // Fallback to localStorage if API fails
        const savedTranslations = localStorage.getItem('languageStrings');
        if (savedTranslations) {
          try {
            const parsed = JSON.parse(savedTranslations);
            const customTranslations: any = {};
            parsed.forEach((item: any) => {
              customTranslations[item.key] = {
                de: item.german,
                en: item.english
              };
            });
            setTranslations({ ...defaultTranslations, ...customTranslations });
          } catch (error) {
            console.error('Error loading custom translations:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
      // Fallback to localStorage if API fails
      const savedTranslations = localStorage.getItem('languageStrings');
      if (savedTranslations) {
        try {
          const parsed = JSON.parse(savedTranslations);
          const customTranslations: any = {};
          parsed.forEach((item: any) => {
            customTranslations[item.key] = {
              de: item.german,
              en: item.english
            };
          });
          setTranslations({ ...defaultTranslations, ...customTranslations });
        } catch (parseError) {
          console.error('Error loading custom translations:', parseError);
        }
      }
    }
  };

    const refreshTranslations = async () => {
    try {
      const apiBase = (() => {
        try {
          const buildTime = (import.meta as any).env?.VITE_API_BASE as string | undefined;
          if (buildTime && buildTime !== 'undefined') return buildTime.replace(/\/$/, '');
        } catch (e) {}
        const runtime = (window as any).__API_BASE || (window as any).__RUNTIME_CONFIG?.VITE_API_BASE;
        if (runtime) return String(runtime).replace(/\/$/, '');
        return `${window.location.origin.replace(/\/$/, '')}/api`;
      })();
      const response = await fetch(`${apiBase}/language-strings?lang=${currentLanguage}&t=${Date.now()}`);
      if (response.ok) {
        const payload = await response.json();
        const data = payload.data ?? payload;
        const lastUpdated = payload.last_updated ?? null;
        if (lastUpdated) {
          localStorage.setItem('language_last_updated', lastUpdated);
        }
        const customTranslations: any = {};
        data.forEach((item: any) => {
          customTranslations[item.key] = {
            de: item.german,
            en: item.english
          };
        });
        setTranslations({ ...defaultTranslations, ...customTranslations });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing translations:', error);
      return false;
    }
  };

  return {
    t,
    currentLanguage,
    changeLanguage,
    refreshTranslations,
    isLoading,
    availableLanguages: ['de', 'en'] as const
  };
};