import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Search, X } from 'lucide-react';
import { machineData } from '../data/machines';
import { getAutocompleteSuggestions } from '../utils/search';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export interface SearchBarHandle {
  focus: () => void;
}

export const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(function SearchBar({ value, onChange }, ref) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const lastExternalValue = useRef(value);
  useEffect(() => {
    if (lastExternalValue.current !== value) {
      lastExternalValue.current = value;
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((val: string) => {
    setInputValue(val);
    setSelectedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(val);
      const sug = getAutocompleteSuggestions(machineData, val);
      setSuggestions(sug);
      setShowSuggestions(sug.length > 0);
    }, 200);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      setInputValue(selected);
      onChange(selected);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const clear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-label="Search all columns"
          aria-keyshortcuts="Control+k Meta+k"
          placeholder="Search across all columns..."
          className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder:text-slate-400 shadow-sm"
          value={inputValue}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {inputValue ? (
            <button
              onClick={clear}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px]
                           font-medium text-slate-400 bg-slate-100 border border-slate-200
                           rounded" aria-hidden="true">
              {shortcutLabel}
            </kbd>
          )}
        </div>
      </div>

      {showSuggestions && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === selectedIndex}
              className={`px-4 py-2 text-sm cursor-pointer ${
                i === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
              }`}
              onClick={() => selectSuggestion(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
