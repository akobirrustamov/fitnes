import React from "react";

const PREFIX = "+998";

export default function PhoneInput({ name, value, onChange, required, className, disabled }) {
  const handleChange = (e) => {
    let raw = e.target.value;
    if (!raw.startsWith(PREFIX)) {
      raw = PREFIX + raw.replace(/^\+?9?9?8?/, "").replace(/\D/g, "");
    }
    const suffix = raw.slice(PREFIX.length).replace(/\D/g, "").slice(0, 9);
    onChange({ target: { name, value: PREFIX + suffix } });
  };

  const handleKeyDown = (e) => {
    const pos = e.target.selectionStart;
    if ((e.key === "Backspace" || e.key === "Delete") && pos <= PREFIX.length) {
      e.preventDefault();
    }
  };

  const handleClick = (e) => {
    if (e.target.selectionStart < PREFIX.length) {
      e.target.setSelectionRange(PREFIX.length, PREFIX.length);
    }
  };

  return (
    <input
      type="tel"
      name={name}
      value={value || PREFIX}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onFocus={(e) => {
        if (e.target.selectionStart < PREFIX.length) {
          e.target.setSelectionRange(PREFIX.length, PREFIX.length);
        }
      }}
      maxLength={13}
      required={required}
      disabled={disabled}
      placeholder="+998XXXXXXXXX"
      className={className}
    />
  );
}
