interface ColorSwatchPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets: string[];
}

export function ColorSwatchPicker({ value, onChange, presets }: ColorSwatchPickerProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="w-8 h-8 rounded-lg transition-transform hover:scale-110 focus:outline-none"
            style={{ backgroundColor: c, outline: value === c ? `3px solid ${c}` : undefined, outlineOffset: value === c ? "2px" : undefined }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--color-border)] p-0.5 bg-[var(--color-card)]"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md border border-[var(--color-border)]" style={{ backgroundColor: value }} />
        <span className="text-xs text-[var(--color-muted-foreground)] font-mono">{value}</span>
      </div>
    </div>
  );
}
