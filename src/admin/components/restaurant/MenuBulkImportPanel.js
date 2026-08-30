import React, { useMemo, useState } from "react";
import {
  bulkImportRestaurantMenu,
  extractRestaurantMenuFromImages,
} from "../../api/menuImportApi";

const FOOD_TYPE_OPTIONS = [
  { label: "Veg", value: "veg" },
  { label: "Non-Veg", value: "non-veg" },
  { label: "Egg", value: "egg" },
];

const BUSINESS_TYPE_OPTIONS = [
  { label: "Fine Dining", value: "fine_dining" },
  { label: "Quick Dining", value: "quick_dining" },
  { label: "Express Delivery", value: "express_delivery" },
];

const createRowId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const MenuBulkImportPanel = ({ clientId, menu, onImported }) => {
  const counters = menu?.counters ?? [];
  const [step, setStep] = useState("defaults");
  const [businessType, setBusinessType] = useState("fine_dining");
  const [defaultFoodType, setDefaultFoodType] = useState("veg");
  const [fallbackCategory, setFallbackCategory] = useState("General");
  const [createMissingCategories, setCreateMissingCategories] = useState(true);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [bulkCounterId, setBulkCounterId] = useState(
    counters[0]?.id ? String(counters[0].id) : ""
  );
  const [bulkParcelCharge, setBulkParcelCharge] = useState("0");
  const [rows, setRows] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const counterOptions = useMemo(
    () =>
      counters.map((counter) => ({
        label: counter.name,
        value: String(counter.id),
      })),
    [counters]
  );

  const selectedCount = rows.filter((row) => row.selected).length;

  const updateRow = (id, patch) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const handlePickPhotos = (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) {
      return;
    }

    setError("");
    setPendingFiles((current) => [...current, ...files]);
  };

  const handleExtractPhotos = async () => {
    if (!pendingFiles.length) {
      setError("Add at least one menu photo first.");
      return;
    }

    if (!counterOptions.length) {
      setError("This restaurant needs at least one counter before importing.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const extracted = await extractRestaurantMenuFromImages(
        clientId,
        pendingFiles
      );
      const defaultCounterId = bulkCounterId || counterOptions[0]?.value || "";

      setRows(
        (extracted.items ?? []).map((item) => ({
          id: createRowId(),
          name: item.name,
          price: String(item.price),
          category: item.category || fallbackCategory || "General",
          foodType: item.foodTypeGuess || defaultFoodType,
          counterId: defaultCounterId,
          parcelCharge: "0",
          selected: true,
        }))
      );
      setWarnings(extracted.warnings ?? []);
      setStep("review");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not extract menu from photo."
      );
    } finally {
      setLoading(false);
    }
  };

  const applyBulkCounterToSelected = () => {
    if (!bulkCounterId) {
      setError("Choose a counter to apply to selected items.");
      return;
    }

    setRows((current) =>
      current.map((row) =>
        row.selected ? { ...row, counterId: bulkCounterId } : row
      )
    );
    setError("");
  };

  const applyBulkParcelToSelected = () => {
    const value = Number(bulkParcelCharge);
    if (Number.isNaN(value) || value < 0) {
      setError("Enter a valid parcel charge to apply.");
      return;
    }

    setRows((current) =>
      current.map((row) =>
        row.selected ? { ...row, parcelCharge: bulkParcelCharge } : row
      )
    );
    setError("");
  };

  const handleApprove = async () => {
    const selectedRows = rows.filter((row) => row.selected);
    if (!selectedRows.length) {
      setError("Select at least one item to import.");
      return;
    }

    const missingCounter = selectedRows.find((row) => !row.counterId);
    if (missingCounter) {
      setError("Select a counter for every selected item before approving.");
      return;
    }

    const invalidParcel = selectedRows.find((row) => {
      const value = Number(row.parcelCharge);
      return Number.isNaN(value) || value < 0;
    });
    if (invalidParcel) {
      setError(
        "Enter a valid parcel charge (0 or more) for every selected item."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const importResult = await bulkImportRestaurantMenu(clientId, {
        createMissingCategories,
        defaults: {
          businessType,
          counterId: Number(selectedRows[0].counterId),
          foodType: defaultFoodType,
          fallbackCategory: fallbackCategory.trim() || "General",
        },
        items: selectedRows.map((row) => ({
          name: row.name.trim(),
          price: Number(row.price),
          category: row.category.trim() || fallbackCategory.trim() || "General",
          foodType: row.foodType,
          counterId: Number(row.counterId),
          parcelCharge: Number(row.parcelCharge) || 0,
        })),
      });

      setResult(importResult);
      setStep("result");
      onImported?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not import menu items."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-card admin-menu-import">
      <div className="admin-card__header">
        <h2 className="admin-section__title">Import menu from photo</h2>
        <p className="admin-card__hint">
          Upload one or more menu photos, review extracted items, set counter and
          parcel charge for each item, then approve to insert into the menu.
          Nothing is saved until you approve.
        </p>
      </div>

      {step === "defaults" ? (
        <div className="admin-menu-import__form">
          <label className="admin-field">
            <span>Business type</span>
            <select
              value={businessType}
              onChange={(event) => setBusinessType(event.target.value)}
            >
              {BUSINESS_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {!counterOptions.length ? (
            <p className="admin-card__hint">
              This restaurant has no counters yet. Create one in the partner app
              before importing menu items.
            </p>
          ) : null}

          <label className="admin-field">
            <span>Default food type</span>
            <select
              value={defaultFoodType}
              onChange={(event) => setDefaultFoodType(event.target.value)}
            >
              {FOOD_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>Fallback category</span>
            <input
              value={fallbackCategory}
              onChange={(event) => setFallbackCategory(event.target.value)}
              placeholder="General"
            />
          </label>

          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={createMissingCategories}
              onChange={(event) =>
                setCreateMissingCategories(event.target.checked)
              }
            />
            <span>Auto-create categories from menu sections</span>
          </label>

          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={!counterOptions.length}
            onClick={() => setStep("photo")}
          >
            Continue to photo upload
          </button>
        </div>
      ) : null}

      {step === "photo" ? (
        <div className="admin-menu-import__form">
          <label className="admin-field">
            <span>Menu photos (camera or gallery)</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              disabled={loading}
              onChange={handlePickPhotos}
            />
          </label>

          {pendingFiles.length ? (
            <p className="admin-card__hint">
              {pendingFiles.length} photo
              {pendingFiles.length === 1 ? "" : "s"} ready
            </p>
          ) : null}

          <div className="admin-menu-import__toolbar">
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={loading || !pendingFiles.length}
              onClick={handleExtractPhotos}
            >
              {loading
                ? "Extracting items…"
                : pendingFiles.length
                  ? `Extract items from ${pendingFiles.length} photo${pendingFiles.length === 1 ? "" : "s"}`
                  : "Extract items"}
            </button>
            {pendingFiles.length ? (
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                disabled={loading}
                onClick={() => setPendingFiles([])}
              >
                Clear photos
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => setStep("defaults")}
          >
            Back to defaults
          </button>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="admin-menu-import__review">
          {warnings.length ? (
            <ul className="admin-menu-import__warnings">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          <div className="admin-menu-import__toolbar">
            <p>
              Review {selectedCount} of {rows.length} items. Set counter and
              parcel charge before approving.
            </p>
          </div>

          <div className="admin-menu-import__bulk-apply">
            <label className="admin-field">
              <span>Counter for selected</span>
              <select
                value={bulkCounterId}
                onChange={(event) => setBulkCounterId(event.target.value)}
              >
                <option value="">Select counter</option>
                {counterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Parcel charge for selected</span>
              <input
                value={bulkParcelCharge}
                onChange={(event) => setBulkParcelCharge(event.target.value)}
                placeholder="0"
              />
            </label>
            <div className="admin-menu-import__toolbar">
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={applyBulkCounterToSelected}
              >
                Apply counter
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={applyBulkParcelToSelected}
              >
                Apply parcel charge
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() =>
                  setRows((current) =>
                    current.map((row) =>
                      row.selected ? { ...row, foodType: "non-veg" } : row
                    )
                  )
                }
              >
                Set selected to non-veg
              </button>
            </div>
          </div>

          <div className="admin-menu-import__rows">
            {rows.map((row) => (
              <div key={row.id} className="admin-menu-import__row">
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={(event) =>
                      updateRow(row.id, { selected: event.target.checked })
                    }
                  />
                  <span>Include</span>
                </label>
                <label className="admin-field">
                  <span>Name</span>
                  <input
                    value={row.name}
                    onChange={(event) =>
                      updateRow(row.id, { name: event.target.value })
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>Price</span>
                  <input
                    value={row.price}
                    onChange={(event) =>
                      updateRow(row.id, { price: event.target.value })
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>Category</span>
                  <input
                    value={row.category}
                    onChange={(event) =>
                      updateRow(row.id, { category: event.target.value })
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>Food type</span>
                  <select
                    value={row.foodType}
                    onChange={(event) =>
                      updateRow(row.id, { foodType: event.target.value })
                    }
                  >
                    {FOOD_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Counter</span>
                  <select
                    value={row.counterId}
                    onChange={(event) =>
                      updateRow(row.id, { counterId: event.target.value })
                    }
                  >
                    <option value="">Select counter</option>
                    {counterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Parcel charge</span>
                  <input
                    value={row.parcelCharge}
                    onChange={(event) =>
                      updateRow(row.id, { parcelCharge: event.target.value })
                    }
                    placeholder="0"
                  />
                </label>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={loading || selectedCount === 0}
            onClick={handleApprove}
          >
            {loading
              ? "Importing…"
              : `Approve and import ${selectedCount} items`}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => setStep("photo")}
          >
            Add more photos
          </button>
        </div>
      ) : null}

      {step === "result" && result ? (
        <div className="admin-menu-import__result">
          <p>
            Created {result.created}, skipped {result.skipped}, failed{" "}
            {result.failed}
          </p>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => {
              setStep("defaults");
              setRows([]);
              setPendingFiles([]);
              setResult(null);
            }}
          >
            Import another menu
          </button>
        </div>
      ) : null}

      {loading ? <p className="admin-card__hint">Working…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
    </section>
  );
};

export default MenuBulkImportPanel;
