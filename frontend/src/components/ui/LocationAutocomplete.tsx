import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { filterLocationSuggestions } from "../../lib/locationSuggestions";

type Props = {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowCustom?: boolean;
  inputClassName?: string;
  id?: string;
  emptyHint?: string;
};

export default function LocationAutocomplete({
  value,
  onChange,
  suggestions,
  placeholder = "Type to search…",
  disabled,
  required,
  allowCustom = true,
  inputClassName = "input-field",
  id: idProp,
  emptyHint = "No matches",
}: Props) {
  const reactId = useId();
  const inputId = idProp ?? `location-ac-${reactId.replace(/:/g, "")}`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const filtered = useMemo(
    () => filterLocationSuggestions(value, suggestions),
    [value, suggestions]
  );

  const showList = open && !disabled && filtered.length > 0;

  const pick = useCallback(
    (name: string) => {
      onChange(name);
      setOpen(false);
      setHighlight(0);
    },
    [onChange]
  );

  useEffect(() => {
    setHighlight(0);
  }, [value, filtered.length]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const choice = filtered[highlight];
      if (choice) pick(choice);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const onBlur = () => {
    if (!allowCustom && value.trim()) {
      const exact = suggestions.find((s) => s.toLowerCase() === value.trim().toLowerCase());
      if (exact) onChange(exact);
      else if (suggestions.length === 1) onChange(suggestions[0]);
    }
  };

  return (
    <div ref={wrapRef} className="location-autocomplete" style={{ position: "relative", width: "100%" }}>
      <input
        id={inputId}
        type="text"
        className={inputClassName}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={`${inputId}-listbox`}
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onBlur={onBlur}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {open && !disabled && value.trim() && filtered.length === 0 && (
        <div className="location-autocomplete-list location-autocomplete-empty">
          {emptyHint}
        </div>
      )}
      {showList && (
        <ul
          id={`${inputId}-listbox`}
          className="location-autocomplete-list"
          role="listbox"
        >
          {filtered.map((name, i) => (
            <li key={name} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={`location-autocomplete-option${i === highlight ? " highlighted" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(name)}
                onMouseEnter={() => setHighlight(i)}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
