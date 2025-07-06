
import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(option => option.value === value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        className="flex items-center justify-between w-full px-4 py-2 text-left bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center">
            {icon && <span className="mr-2 text-brand-purple">{icon}</span>}
            <span className="text-brand-gray-text">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <svg className={`w-5 h-5 ml-2 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-brand-gray rounded-lg shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {options.map(option => (
              <li
                key={option.value}
                className={`px-4 py-2 cursor-pointer hover:bg-brand-purple-light ${selectedOption?.value === option.value ? 'bg-brand-purple-light text-brand-purple-dark' : 'text-brand-gray-text'}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
