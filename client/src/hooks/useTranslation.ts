import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';

import en from '../locales/en.json';
import ur from '../locales/ur.json';

type LocaleData = typeof en;

const locales = {
  en,
  ur: ur as Record<string, unknown>,
} as Record<string, Record<string, unknown>>;

type TranslationKey = string;

interface UseTranslationReturn {
  t: (key: TranslationKey, params?: Record<string, string | number> | string) => string;
  locale: string;
  setLocale: (locale: string) => void;
  isRTL: boolean;
  dir: 'ltr' | 'rtl';
}

const getInitialLocale = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('minierp_locale');
    if (saved && (saved === 'en' || saved === 'ur')) {
      return saved;
    }
  }
  return 'en';
};

let currentLocale = getInitialLocale();
let listeners: (() => void)[] = [];

const notifyListeners = () => {
  for (const fn of listeners) {
    fn();
  }
};

export const useTranslation = (): UseTranslationReturn => {
  const locale = useSyncExternalStore(
    (listener) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter(fn => fn !== listener);
      };
    },
    () => currentLocale,
    () => 'en'
  );
  const isRTL = locale === 'ur';
  const dir = locale === 'ur' ? 'rtl' : 'ltr';

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number> | string): string => {
      const keys = key.split('.');
      let value: unknown = locales[locale];

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return typeof params === 'string' ? params : key;
        }
      }

      if (typeof value !== 'string') {
        return typeof params === 'string' ? params : key;
      }

      if (params && typeof params === 'object') {
        return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
          return params[paramKey]?.toString() ?? `{${paramKey}}`;
        });
      }

      return value;
    },
    [locale]
  );

  const setLocale = useCallback((newLocale: string) => {
    if (locales[newLocale]) {
      currentLocale = newLocale;
      if (typeof window !== 'undefined') {
        localStorage.setItem('minierp_locale', newLocale);
      }
      notifyListeners();
    }
  }, []);

  return {
    t,
    locale,
    setLocale,
    isRTL,
    dir
  };
};

export const getTranslation = (key: TranslationKey, locale?: string): string => {
  const current = locale || currentLocale;
  const keys = key.split('.');
  let value: unknown = locales[current];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
};

export const isRTL = (): boolean => currentLocale === 'ur';

export const getDir = (): 'ltr' | 'rtl' => currentLocale === 'ur' ? 'rtl' : 'ltr';

export const initLocale = (locale: string) => {
  if (locales[locale]) {
    currentLocale = locale;
    if (typeof window !== 'undefined') {
      localStorage.setItem('minierp_locale', locale);
    }
    notifyListeners();
  }
};