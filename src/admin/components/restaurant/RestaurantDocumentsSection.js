import React, { useEffect, useMemo, useState } from "react";
import { RESTAURANT_DOCUMENT_FIELDS } from "../../constants/restaurantDocuments";

const DocumentSlot = ({ doc, currentUrl, pendingFile, onFileChange, disabled }) => {
  const previewUrl = useMemo(() => {
    if (pendingFile) return URL.createObjectURL(pendingFile);
    return currentUrl || null;
  }, [pendingFile, currentUrl]);

  useEffect(() => {
    if (!pendingFile || !previewUrl?.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [pendingFile, previewUrl]);

  return (
    <div className="admin-doc-slot">
      <div className="admin-doc-slot__label">{doc.label}</div>
      <div className="admin-doc-slot__preview">
        {previewUrl ? (
          <a href={previewUrl} target="_blank" rel="noreferrer">
            <img src={previewUrl} alt={doc.label} />
          </a>
        ) : (
          <span className="admin-card__hint">No image</span>
        )}
      </div>
      <label className="admin-doc-slot__input">
        <input
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            onFileChange(doc.field, file);
            event.target.value = "";
          }}
        />
        {pendingFile ? pendingFile.name : "Choose file"}
      </label>
    </div>
  );
};

const RestaurantDocumentsSection = ({
  basicInfo,
  verification,
  uploading,
  onUpload,
}) => {
  const [pendingFiles, setPendingFiles] = useState({});

  const pendingCount = Object.values(pendingFiles).filter(Boolean).length;

  const handleFileChange = (field, file) => {
    setPendingFiles((current) => {
      const next = { ...current };
      if (file) {
        next[field] = file;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleUpload = async () => {
    const files = Object.fromEntries(
      Object.entries(pendingFiles).filter(([, file]) => file)
    );
    if (!Object.keys(files).length) return;

    await onUpload(files);
    setPendingFiles({});
  };

  const handleClear = () => setPendingFiles({});

  return (
    <section className="admin-card admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section__title">Documents & images</h2>
        <div className="admin-section__actions">
          {pendingCount > 0 && (
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--small"
              disabled={uploading}
              onClick={handleClear}
            >
              Clear selection
            </button>
          )}
          <button
            type="button"
            className="admin-btn admin-btn--primary admin-btn--small"
            disabled={uploading || pendingCount === 0}
            onClick={handleUpload}
          >
            {uploading ? "Uploading…" : `Upload${pendingCount ? ` (${pendingCount})` : ""}`}
          </button>
        </div>
      </div>
      <p className="admin-card__hint">
        Upload logo or KYC photos — only changed files are sent to the server.
      </p>
      <div className="admin-doc-grid">
        {RESTAURANT_DOCUMENT_FIELDS.map((doc) => (
          <DocumentSlot
            key={doc.field}
            doc={doc}
            currentUrl={doc.getUrl(basicInfo, verification)}
            pendingFile={pendingFiles[doc.field]}
            onFileChange={handleFileChange}
            disabled={uploading}
          />
        ))}
      </div>
    </section>
  );
};

export default RestaurantDocumentsSection;
