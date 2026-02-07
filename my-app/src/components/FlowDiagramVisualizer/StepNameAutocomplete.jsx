/**
 * StepNameAutocomplete Component
 * Autocomplete input for step names with dictionary suggestions
 * Auto-fills type and alias when a suggestion is selected
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check } from 'lucide-react';

/**
 * StepNameAutocomplete Component
 * @param {Object} props
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Callback when value changes
 * @param {Function} props.onSelect - Callback when suggestion is selected (receives {stepName, type, alias, description})
 * @param {Object} props.dictionaryHook - Step dictionary hook
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.autoFocus - Auto-focus the input
 * @param {Function} props.onKeyDown - Additional keydown handler
 */
const StepNameAutocomplete = ({
  value,
  onChange,
  onSelect,
  dictionaryHook,
  placeholder = "Enter step name...",
  className = "",
  autoFocus = false,
  onKeyDown
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get suggestions when value changes
  useEffect(() => {
    if (!dictionaryHook || !value?.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const results = dictionaryHook.getSuggestions(value);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
    setSelectedIndex(-1);
  }, [value, dictionaryHook]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle suggestion selection
   */
  const handleSelect = (suggestion) => {
    onChange({ target: { value: suggestion.stepName } });
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Notify parent with full suggestion data
    if (onSelect) {
      onSelect({
        stepName: suggestion.stepName,
        type: suggestion.type,
        alias: suggestion.alias,
        description: suggestion.description
      });
    }
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      // Pass through to parent handler
      if (onKeyDown) {
        onKeyDown(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSelect(suggestions[selectedIndex]);
        } else if (onKeyDown) {
          // No suggestion selected, pass through
          onKeyDown(e);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      
      default:
        // Pass through other keys to parent handler
        if (onKeyDown) {
          onKeyDown(e);
        }
        break;
    }
  };

  /**
   * Get badge color for step type
   */
  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'state':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'rule':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'behavior':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        autoComplete="off"
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          <div className="py-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.stepName}
                className={`px-3 py-2 cursor-pointer transition-colors ${
                  selectedIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {suggestion.stepName}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ml-2 ${getTypeBadgeColor(suggestion.type)}`}
                  >
                    {suggestion.type}
                  </Badge>
                </div>
                {suggestion.alias && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Alias: {suggestion.alias}
                  </div>
                )}
                {suggestion.description && (
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                    {suggestion.description}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Helper text */}
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <span>Use ↑↓ to navigate, Enter to select</span>
              <span className="text-blue-600 dark:text-blue-400">
                {suggestions.length} match{suggestions.length !== 1 ? 'es' : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

StepNameAutocomplete.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  dictionaryHook: PropTypes.shape({
    getSuggestions: PropTypes.func.isRequired
  }),
  placeholder: PropTypes.string,
  className: PropTypes.string,
  autoFocus: PropTypes.bool,
  onKeyDown: PropTypes.func
};

export default StepNameAutocomplete;
