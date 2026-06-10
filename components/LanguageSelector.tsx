import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, Check, ChevronDown, Sparkles } from 'lucide-react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const languagesList: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸', region: 'Americas/Global' },
  { code: 'de', name: 'German', nativeName: 'Deutsch (DE)', flag: '🇩🇪', region: 'Europe' },
  { code: 'fr', name: 'French', nativeName: 'Français (FR)', flag: '🇫🇷', region: 'Europe' },
  { code: 'es', name: 'Spanish', nativeName: 'Español (ES)', flag: '🇪🇸', region: 'Americas/Europe' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano (IT)', flag: '🇮🇹', region: 'Europe' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands (NL)', flag: '🇳🇱', region: 'Europe' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português (PT)', flag: '🇵🇹', region: 'Americas/Europe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski (PL)', flag: '🇵🇱', region: 'Europe' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar (HU)', flag: '🇭🇺', region: 'Europe' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский (RU)', flag: '🇷🇺', region: 'Europe' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська (UK)', flag: '🇺🇦', region: 'Europe' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe (TR)', flag: '🇹🇷', region: 'Europe' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語 (JA)', flag: '🇯🇵', region: 'Asia' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文 (ZH)', flag: '🇨🇳', region: 'Asia' },
  { code: 'ko', name: 'Korean', nativeName: '한국어 (KO)', flag: '🇰🇷', region: 'Asia' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी (HI)', flag: '🇮🇳', region: 'Asia' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা (BN)', flag: '🇧🇩', region: 'Asia' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية (AR)', flag: '🇸🇦', region: 'Middle East' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی (FA)', flag: '🇮🇷', region: 'Middle East' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית (HE)', flag: '🇮🇱', region: 'Middle East' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt (VI)', flag: '🇻🇳', region: 'Asia' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia (ID)', flag: '🇮🇩', region: 'Asia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu (MS)', flag: '🇲🇾', region: 'Asia' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย (TH)', flag: '🇹🇭', region: 'Asia' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska (SV)', flag: '🇸🇪', region: 'Europe' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk (DA)', flag: '🇩🇰', region: 'Europe' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk (NO)', flag: '🇳🇴', region: 'Europe' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi (FI)', flag: '🇫🇮', region: 'Europe' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština (CS)', flag: '🇨🇿', region: 'Europe' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina (SK)', flag: '🇸🇰', region: 'Europe' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română (RO)', flag: '🇷🇴', region: 'Europe' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български (BG)', flag: '🇧🇬', region: 'Europe' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά (EL)', flag: '🇬🇷', region: 'Europe' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski (HR)', flag: '🇭🇷', region: 'Europe' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски (SR)', flag: '🇷🇸', region: 'Europe' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina (SL)', flag: '🇸🇮', region: 'Europe' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català (CA)', flag: '🇪🇸', region: 'Europe' },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto (EO)', flag: '🟢', region: 'Global' },
  { code: 'la', name: 'Latin', nativeName: 'Latina (LA)', flag: '🏛️', region: 'Europe/Global' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge (GA)', flag: '🇮🇪', region: 'Europe' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska (IS)', flag: '🇮🇸', region: 'Europe' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg (CY)', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', region: 'Europe' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti (MT)', flag: '🇲🇹', region: 'Europe' },
  { code: 'gd', name: 'Scottish Gaelic', nativeName: 'Gàidhlig (GD)', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', region: 'Europe' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara (EU)', flag: '🏳️', region: 'Europe' },
  { code: 'tl', name: 'Filipino', nativeName: 'Tagalog (TL)', flag: '🇵🇭', region: 'Asia' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti (ET)', flag: '🇪🇪', region: 'Europe' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu (LV)', flag: '🇱🇻', region: 'Europe' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių (LT)', flag: '🇱🇹', region: 'Europe' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული (KA)', flag: '🇬🇪', region: 'Europe/Asia' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն (HY)', flag: '🇦🇲', region: 'Europe/Asia' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycanca (AZ)', flag: '🇦🇿', region: 'Europe/Asia' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip (SQ)', flag: '🇦🇱', region: 'Europe' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски (MK)', flag: '🇲🇰', region: 'Europe' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская (BE)', flag: '🇧🇾', region: 'Europe' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ тілі (KK)', flag: '🇰🇿', region: 'Asia' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha (UZ)', flag: '🇺🇿', region: 'Asia' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans (AF)', flag: '🇿🇦', region: 'Africa' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ (AM)', flag: '🇪🇹', region: 'Africa' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол хэл (MN)', flag: '🇲🇳', region: 'Asia' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली (NE)', flag: '🇳🇵', region: 'Asia' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල (SI)', flag: '🇱🇰', region: 'Asia' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ (KM)', flag: '🇰🇭', region: 'Asia' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာစာ (MY)', flag: '🇲🇲', region: 'Asia' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча (KY)', flag: '🇰🇬', region: 'Asia' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ (TG)', flag: '🇹🇯', region: 'Asia' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaaliga (SO)', flag: '🇸🇴', region: 'Africa' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili (SW)', flag: '🇰🇪', region: 'Africa' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو (UR)', flag: '🇵🇰', region: 'Asia' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు (TE)', flag: '🇮🇳', region: 'Asia' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ் (TA)', flag: '🇮🇳', region: 'Asia' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी (MR)', flag: '🇮🇳', region: 'Asia' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી (GU)', flag: '🇮🇳', region: 'Asia' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá (YO)', flag: '🇳🇬', region: 'Africa' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu (ZU)', flag: '🇿🇦', region: 'Africa' },
  { code: 'ha', name: 'Hausa', nativeName: 'Harshen Hausa (HA)', flag: '🇳🇬', region: 'Africa' },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo (IG)', flag: '🇳🇬', region: 'Africa' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Fiteny Malagasy (MG)', flag: '🇲🇬', region: 'Africa' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ (PA)', flag: '🇮🇳', region: 'Asia' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ (KN)', flag: '🇮🇳', region: 'Asia' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം (ML)', flag: '🇮🇳', region: 'Asia' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ (OR)', flag: '🇮🇳', region: 'Asia' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي (SD)', flag: '🇵🇰', region: 'Asia' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو (PS)', flag: '🇦🇫', region: 'Asia' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî (KU)', flag: '☀️', region: 'Middle East' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa (JV)', flag: '🇮🇩', region: 'Asia' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda (SU)', flag: '🇮🇩', region: 'Asia' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi (HAW)', flag: '🇺🇸', region: 'Americas' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम् (SA)', flag: '🕉️', region: 'Asia' },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་སྐད་ (BO)', flag: '🏔️', region: 'Asia' },
  { code: 'mi', name: 'Māori', nativeName: 'Te Reo Māori (MI)', flag: '🇳🇿', region: 'Oceania' },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש (YI)', flag: '🕎', region: 'Europe' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego (GL)', flag: '🇪🇸', region: 'Europe' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch (LB)', flag: '🇱🇺', region: 'Europe' },
  { code: 'fy', name: 'Frisian', nativeName: 'Frysk (FY)', flag: '🇳🇱', region: 'Europe' },
  { code: 'br', name: 'Breton', nativeName: 'Brezhoneg (BR)', flag: '🇫🇷', region: 'Europe' },
  { code: 'tt', name: 'Tatar', nativeName: 'Татарча (TT)', flag: '🇷🇺', region: 'Europe/Asia' },
  { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە (UG)', flag: '🇨🇳', region: 'Asia' },
  { code: 'fo', name: 'Faroese', nativeName: 'Føroyskt (FO)', flag: '🇫🇴', region: 'Europe' },
  { code: 'kl', name: 'Greenlandic', nativeName: 'Kalaallisut (KL)', flag: '🇬🇱', region: 'Americas' },
  { code: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ (LO)', flag: '🇱🇦', region: 'Asia' },
  { code: 'wa', name: 'Walloon', nativeName: 'Walon (WA)', flag: '🇧🇪', region: 'Europe' },
  { code: 'kw', name: 'Cornish', nativeName: 'Kernowek (KW)', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', region: 'Europe' },
  { code: 'oc', name: 'Occitan', nativeName: 'Occitan (OC)', flag: '🇫🇷', region: 'Europe' },
  { code: 'rm', name: 'Romansh', nativeName: 'Rumantsch (RM)', flag: '🇨🇭', region: 'Europe' },
  { code: 'qu', name: 'Quechua', nativeName: 'Runasimi (QU)', flag: '🇵🇪', region: 'Americas' },
  { code: 'gn', name: 'Guarani', nativeName: 'Avañe\'ẽ (GN)', flag: '🇵🇾', region: 'Americas' },
  { code: 'fj', name: 'Fijian', nativeName: 'Na Vosa Vakaviti (FJ)', flag: '🇫🇯', region: 'Oceania' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa (SM)', flag: '🇼🇸', region: 'Oceania' },
  { code: 'iu', name: 'Inuktitut', nativeName: 'ᐃᓄᒃᑎᑐᑦ (IU)', flag: '🇨🇦', region: 'Americas' },
];

interface LanguageSelectorProps {
  onLanguageChange?: (code: string) => void;
  panelPosition?: 'up' | 'down';
  compact?: boolean;
}

export default function LanguageSelector({ onLanguageChange, panelPosition = 'down', compact = false }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentLang = languagesList.find((l) => l.code === i18n.language) || languagesList[0];

  const filteredLanguages = languagesList.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    if (onLanguageChange) {
      onLanguageChange(code);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div id="language-selector-root" ref={containerRef} className={`relative inline-block text-left w-full ${compact ? 'max-w-[110px]' : 'max-w-[280px]'}`}>
      <button
        id="language-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-1.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-indigo-500/50 shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="text-lg leading-none filter drop-shadow-sm select-none" id="current-language-flag">
            {currentLang.flag}
          </span>
          {!compact && (
            <span className="truncate font-black tracking-tight" id="current-language-name">
              {currentLang.nativeName}
            </span>
          )}
          {compact && (
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-500" id="current-language-code">
              {currentLang.code}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="language-selector-dropdown"
            initial={{ opacity: 0, y: panelPosition === 'down' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: panelPosition === 'down' ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[110] w-[300px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-3 ${
              panelPosition === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'
            }`}
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {/* Search Input */}
            <div className="relative mb-3.5" id="language-search-wrapper">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="language-search-input"
                type="text"
                placeholder="Search language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500/50 dark:text-slate-100 placeholder-slate-400 font-medium transition-all"
                autoFocus
              />
            </div>

            {/* List */}
            <div
              id="language-options-list"
              className="max-h-[260px] overflow-y-auto space-y-1 pr-1 custom-scrollbar"
              style={{
                scrollbarWidth: 'thin',
              }}
            >
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((language) => {
                  const isSelected = language.code === i18n.language;
                  return (
                    <button
                      key={language.code}
                      id={`lang-option-${language.code}`}
                      onClick={() => selectLanguage(language.code)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs transition-all duration-200 group ${
                        isSelected
                          ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-500/20'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-lg leading-none filter drop-shadow-sm select-none">
                          {language.flag}
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="font-extrabold tracking-tight truncate">
                            {language.nativeName}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                            {language.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-indigo-500" />
                        ) : (
                          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            {language.code}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-500" id="no-languages-found">
                  <Globe className="w-6 h-6 mx-auto mb-2 text-slate-400 animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-wider">No languages found</p>
                </div>
              )}
            </div>

            {/* Sub-Info footer */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 select-none">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Locales: {languagesList.length}
              </span>
              <span>Active: {currentLang.code.toUpperCase()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
