import { ImageIcon, Trash2 } from 'lucide-react';

interface HeaderProps {
  imageCount: number;
  onClear: () => void;
}

export default function Header({ imageCount, onClear }: HeaderProps) {
  return (
    <header className="panel" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ImageIcon size={24} color="var(--accent)" />
          <div>
            <p className="eyebrow">Pixelforge</p>
            <h1 style={{ margin: 0, fontSize: '1.15rem' }}>Browser-native image studio</h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="muted">{imageCount} files loaded</span>
          {imageCount > 0 ? (
            <button className="ghost-button" onClick={onClear}>
              <Trash2 size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
              Clear all
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
