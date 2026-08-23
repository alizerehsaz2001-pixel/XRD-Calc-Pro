import React, { useEffect } from 'react';
import { useI18n } from './I18nProvider';

export const FullAppTranslator: React.FC = () => {
  const { i18n, language } = useI18n();

  useEffect(() => {
    const currentLang = language || i18n.language;
    if (typeof window === 'undefined') return;

    let isScanning = false;

    // Helper to translate a string containing dynamic numbers (e.g., "Intensity: 100.5%")
    const translateStringWithNumbers = (str: string): string => {
      if (!str || !str.trim()) return str;
      const trimmed = str.trim();
      
      // If it is purely numbers/punctuation/symbols, return as-is
      if (/^[\d\s.,:;!?%()\/\\+=\-_*<>[\]{}#$@&^|~'"]+$/.test(trimmed)) {
        return str;
      }

      // 1. Direct translation attempt
      const directTrans = i18n.t(trimmed);
      if (directTrans && directTrans !== trimmed) {
        return str.replace(trimmed, directTrans);
      }

      // 2. Extract numbers & create template key if numbers exist
      const numberMatches = trimmed.match(/[-+]?\d*\.?\d+/g);
      if (numberMatches && numberMatches.length > 0) {
        let templateKey = trimmed;
        numberMatches.forEach((num, idx) => {
          templateKey = templateKey.replace(num, `{n${idx}}`);
        });

        const templateTrans = i18n.t(templateKey);
        if (templateTrans && templateTrans !== templateKey) {
          let filled = templateTrans;
          numberMatches.forEach((num, idx) => {
            filled = filled.replace(`{n${idx}}`, num);
          });
          return str.replace(trimmed, filled);
        }
      }

      return str;
    };

      // Helper to translate a single text node or element attribute
      const translateNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const parent = node.parentElement;
          if (!parent) return;

          const tagName = parent.tagName;
          if (
            ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'SVG', 'PATH', 'MATH', 'CANVAS'].includes(tagName)
          ) {
            return;
          }

          if (
            parent.closest('.notranslate') ||
            parent.closest('.skiptranslate') ||
            parent.closest('[data-no-translate]')
          ) {
            return;
          }

          const rawText = node.nodeValue || '';
          const trimmed = rawText.trim();

          if (!trimmed || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return;
          }

          // Detect if React or the app changed the text underneath us
          const lastTrans = (node as any).__lastTranslatedText;
          const origEng = (node as any).__origEnglishText;
          
          if (origEng === undefined || (rawText !== lastTrans && rawText !== origEng)) {
            (node as any).__origEnglishText = rawText;
          }

          const origRaw = (node as any).__origEnglishText;

          if (!currentLang || currentLang === 'en') {
            // Restore English if active language is English
            if (node.nodeValue !== origRaw) {
              node.nodeValue = origRaw;
            }
            (node as any).__lastTranslatedText = origRaw;
            return;
          }

          // Active language is non-English -> translate via i18n
          const translatedRaw = translateStringWithNumbers(origRaw);
          if (translatedRaw && node.nodeValue !== translatedRaw) {
            node.nodeValue = translatedRaw;
            (node as any).__lastTranslatedText = translatedRaw;
          } else if (!lastTrans) {
            (node as any).__lastTranslatedText = node.nodeValue;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName;

          if (
            ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'SVG', 'PATH', 'MATH', 'CANVAS'].includes(tagName) ||
            el.classList.contains('notranslate') ||
            el.classList.contains('skiptranslate') ||
            el.hasAttribute('data-no-translate')
          ) {
            return;
          }

          // Handle placeholder attribute for inputs/textareas
          if ((tagName === 'INPUT' || tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
            const placeholder = el.getAttribute('placeholder') || '';
            if (placeholder.trim()) {
              const lastPhTrans = (el as any).__lastPhTrans;
              const origPh = (el as any).__origPlaceholder;

              if (origPh === undefined || (placeholder !== lastPhTrans && placeholder !== origPh)) {
                (el as any).__origPlaceholder = placeholder;
              }

              const currentOrigPh = (el as any).__origPlaceholder;

              if (!currentLang || currentLang === 'en') {
                if (placeholder !== currentOrigPh) {
                  el.setAttribute('placeholder', currentOrigPh);
                }
                (el as any).__lastPhTrans = currentOrigPh;
              } else {
                const transPh = translateStringWithNumbers(currentOrigPh);
                if (transPh && placeholder !== transPh) {
                  el.setAttribute('placeholder', transPh);
                  (el as any).__lastPhTrans = transPh;
                } else if (!lastPhTrans) {
                  (el as any).__lastPhTrans = placeholder;
                }
              }
            }
          }

          // Handle title attribute for tooltips
          if (el.hasAttribute('title')) {
            const titleAttr = el.getAttribute('title') || '';
            if (titleAttr.trim()) {
              const lastTitleTrans = (el as any).__lastTitleTrans;
              const origTitle = (el as any).__origTitle;

              if (origTitle === undefined || (titleAttr !== lastTitleTrans && titleAttr !== origTitle)) {
                (el as any).__origTitle = titleAttr;
              }

              const currentOrigTitle = (el as any).__origTitle;

              if (!currentLang || currentLang === 'en') {
                if (titleAttr !== currentOrigTitle) {
                  el.setAttribute('title', currentOrigTitle);
                }
                (el as any).__lastTitleTrans = currentOrigTitle;
              } else {
                const transTitle = translateStringWithNumbers(currentOrigTitle);
                if (transTitle && titleAttr !== transTitle) {
                  el.setAttribute('title', transTitle);
                  (el as any).__lastTitleTrans = transTitle;
                } else if (!lastTitleTrans) {
                  (el as any).__lastTitleTrans = titleAttr;
                }
              }
            }
          }

          // Recurse child nodes
          for (let i = 0; i < el.childNodes.length; i++) {
            translateNode(el.childNodes[i]);
          }
        }
      };

    const scanAndTranslate = () => {
      if (isScanning) return;
      isScanning = true;
      try {
        const rootEl = document.getElementById('root') || document.body;
        if (rootEl) {
          translateNode(rootEl);
        }
      } catch (e) {
        console.warn('FullAppTranslator scan notice:', e);
      } finally {
        isScanning = false;
      }
    };

    // Run initial DOM translation scan
    scanAndTranslate();

    // Trigger on language changes or resource updates
    const handleLanguageChanged = () => {
      scanAndTranslate();
    };

    i18n.on('languageChanged', handleLanguageChanged);

    // Observe DOM changes so dynamically mounted tabs and components are translated instantly
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
        if (m.type === 'characterData') {
          const parent = m.target.parentElement;
          if (parent && !parent.closest('.notranslate') && !parent.closest('.skiptranslate')) {
            shouldScan = true;
            break;
          }
        }
      }
      if (shouldScan) {
        requestAnimationFrame(() => {
          scanAndTranslate();
        });
      }
    });

    const targetElement = document.getElementById('root') || document.body;
    if (targetElement) {
      observer.observe(targetElement, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
      observer.disconnect();
    };
  }, [i18n, language]);

  return null;
};
