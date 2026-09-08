import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { COUNTRIES, findByCode, findByName } from '../../lib/data/countries';
import './CountrySelect.css';

type CountrySelectProps = {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  autoDetect?: boolean;
  onAutoDetect?: (detected: boolean) => void;
};

const detectCountry = () => {
  const region = navigator.language?.split('-')[1]?.toUpperCase();
  return findByCode(region)?.code || '';
};

export default function CountrySelect({
  value,
  onChange,
  placeholder = 'Select your country',
  autoDetect = false,
  onAutoDetect,
}: CountrySelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const selected = findByCode(value) || findByName(value);
  const filtered = useMemo(
    () => COUNTRIES.filter((country) => country.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  useEffect(() => {
    if (autoDetect && !value) {
      const detected = detectCountry();
      if (detected) {
        onChange(detected);
        onAutoDetect?.(true);
      }
    }
  }, [autoDetect, onAutoDetect, onChange, value]);

  useEffect(() => {
    if (!open) return undefined;
    searchRef.current?.focus();
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!open && ['ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!filtered.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setHighlighted(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setHighlighted(filtered.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(filtered[highlighted].code);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="country-select" ref={rootRef}>
      <button
        id={id}
        type="button"
        className="country-select__trigger"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-haspopup="listbox"
        aria-label={selected?.name || placeholder}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span>{selected?.name || placeholder}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="country-select__panel">
          <input
            ref={searchRef}
            className="country-select__search"
            placeholder="Search country…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlighted(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setHighlighted((index) => Math.min(index + 1, filtered.length - 1));
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setHighlighted((index) => Math.max(index - 1, 0));
              }
              if (event.key === 'Home') {
                event.preventDefault();
                setHighlighted(0);
              }
              if (event.key === 'End') {
                event.preventDefault();
                setHighlighted(Math.max(filtered.length - 1, 0));
              }
              if (event.key === 'Enter' && filtered[highlighted]) {
                event.preventDefault();
                choose(filtered[highlighted].code);
              }
            }}
          />
          <div id={`${id}-listbox`} className="country-select__list" role="listbox" aria-label="Countries">
            {filtered.length ? filtered.map((country, index) => (
              <button
                type="button"
                role="option"
                aria-selected={selected?.code === country.code}
                className={`country-select__option${highlighted === index ? ' is-highlighted' : ''}`}
                key={country.code}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => choose(country.code)}
              >
                <span>{country.name}</span>
                {selected?.code === country.code && <Check size={16} aria-hidden="true" />}
              </button>
            )) : <p className="country-select__empty">No country matches "{query}"</p>}
          </div>
        </div>
      )}
    </div>
  );
}
