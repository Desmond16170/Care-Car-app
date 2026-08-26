import React, { useEffect, useMemo } from 'react';

type Props = {
  files: File[];
  onRemove: (index: number) => void;
};

const PhotoPreviewGrid: React.FC<Props> = ({ files, onRemove }) => {
  const previews = useMemo(() => files.map(file => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => {
    previews.forEach(item => URL.revokeObjectURL(item.url));
  }, [previews]);

  if (files.length === 0) return null;

  return (
    <div className="cc-photo-preview-grid">
      {previews.map((item, index) => (
        <figure key={`${item.file.name}-${item.file.lastModified}-${index}`} className="cc-photo-preview-card">
          <img src={item.url} alt={`Foto de inspección ${index + 1}`} />
          <figcaption>
            <span>{item.file.name || `Foto ${index + 1}`}</span>
            <button type="button" onClick={() => onRemove(index)} aria-label={`Quitar ${item.file.name}`}>Quitar</button>
          </figcaption>
        </figure>
      ))}
    </div>
  );
};

export default PhotoPreviewGrid;
