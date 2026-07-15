import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchMaterials } from "../features/materials/materialsSlice";
import { createOrder } from "../features/orders/ordersSlice";
import type { Priority } from "../types";

export function ClientOrderFormPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const materials = useAppSelector((state) => state.materials.items);

  const [materialId, setMaterialId] = useState<number | "">("");
  const [quantity, setQuantity] = useState(1);
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [notes, setNotes] = useState("");
  const [specFile, setSpecFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMaterials());
  }, [dispatch]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!materialId) {
      setError("Choose a material.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await dispatch(
        createOrder({
          material: materialId,
          quantity,
          deadline,
          priority,
          notes,
          spec_file_name: specFile?.name,
          spec_file_size_kb: specFile ? Math.round(specFile.size / 1024) : undefined,
        })
      ).unwrap();
      navigate("/orders");
    } catch {
      setError("Couldn't submit the job order. Check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-canvas">
      <div className="eyebrow">NEW JOB ORDER</div>
      <h1 style={{ marginBottom: 20 }}>Submit a manufacturing job</h1>

      <form onSubmit={onSubmit} className="card" style={{ maxWidth: 620 }}>
        <div className="form-grid">
          <div className="form-row">
            <label className="field-label" htmlFor="material">Material</label>
            <select
              id="material"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value ? Number(e.target.value) : "")}
              required
            >
              <option value="">Select a material...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label className="field-label" htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: 14 }}>
          <div className="form-row">
            <label className="field-label" htmlFor="deadline">Deadline</label>
            <input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
          </div>
          <div className="form-row">
            <label className="field-label" htmlFor="priority">Priority</label>
            <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 14 }}>
          <label className="field-label" htmlFor="spec">Spec sheet (metadata only, not uploaded)</label>
          <input id="spec" type="file" onChange={(e) => setSpecFile(e.target.files?.[0] ?? null)} />
        </div>

        <div className="form-row" style={{ marginTop: 14 }}>
          <label className="field-label" htmlFor="notes">Notes for the shop floor</label>
          <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" style={{ marginTop: 18 }} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit job order"}
        </button>
      </form>
    </div>
  );
}
