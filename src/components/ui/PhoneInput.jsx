import React, { useState, useRef, useEffect } from 'react';
import { Phone, ChevronDown } from 'lucide-react';
import { Input } from './Input';

const countries = [
  { code: '+1', flag: 'us', name: 'USA/Canada' },
  { code: '+44', flag: 'gb', name: 'United Kingdom' },
  { code: '+91', flag: 'in', name: 'India' },
  { code: '+61', flag: 'au', name: 'Australia' },
  { code: '+49', flag: 'de', name: 'Germany' },
  { code: '+33', flag: 'fr', name: 'France' },
  { code: '+81', flag: 'jp', name: 'Japan' },
  { code: '+86', flag: 'cn', name: 'China' },
  { code: '+55', flag: 'br', name: 'Brazil' },
];

export const PhoneInput = ({ id, label, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(countries[0]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1 w-full" ref={dropdownRef}>
      {label && <label className="text-sm font-medium text-gray-300 block">{label}</label>}
      <div className="flex gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 h-11 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary w-24 justify-between"
          >
            <div className="flex items-center gap-1.5">
              <img 
                src={`https://flagcdn.com/w20/${selected.flag}.png`} 
                alt={selected.name} 
                className="w-5 h-auto rounded-[2px]"
              />
              <span className="font-medium">{selected.code}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          
          {isOpen && (
            <div className="absolute top-12 left-0 w-48 max-h-60 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-1">
              {countries.map((country) => (
                <button
                  key={`${country.code}-${country.flag}`}
                  type="button"
                  onClick={() => {
                    setSelected(country);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
                >
                  <img 
                    src={`https://flagcdn.com/w20/${country.flag}.png`} 
                    alt={country.name} 
                    className="w-5 h-auto rounded-[2px]"
                  />
                  <span>{country.name}</span>
                  <span className="ml-auto text-gray-500">{country.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="relative flex-1">
          <Input 
            id={id} 
            type="tel" 
            placeholder="555 000-0000" 
            className="pl-10" 
            required={required} 
          />
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        </div>
      </div>
    </div>
  );
};
