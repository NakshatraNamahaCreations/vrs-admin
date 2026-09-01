"use client";

import { useEffect, useState } from "react";
import { HiPlus, HiOutlineTrash, HiOutlinePencilSquare } from "react-icons/hi2";
import Shell from "../components/Shell";
import ImageDropzone from "../components/ImageDropzone";
import { api, API_URL } from "../lib/api";
import common from "../components/Common.module.css";
import styles from "../products/products.module.css";

function resolveImg(url) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (url.startsWith("/uploads/")) return `${API_URL}${url}`;
  return url;
}

const empty = { name: "", image: "", order: 0, isActive: true };

export default function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api(`/api/admin/categories`);
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    // Default the order to append after existing entries.
    setForm({ ...empty, order: items.length });
    setError("");
    setShowForm(true);
  };
  const openEdit = (c) => {
    setEditing(c._id);
    setForm({
      name: c.name || "",
      image: c.image || "",
      order: c.order ?? 0,
      isActive: c.isActive !== false,
    });
    setError("");
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        order: Number(form.order) || 0,
      };
      if (editing) {
        await api(`/api/admin/categories/${editing}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this category?")) return;
    await api(`/api/admin/categories/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <Shell
      title="Categories"
      subtitle={`${items.length} categories on the storefront.`}
      actions={
        <button className="btn btn-primary" onClick={openNew}>
          <HiPlus /> New category
        </button>
      }
    >
      <div className={common.card}>
        <div className={common.cardHead}>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            Manages the tiles rendered in the homepage &quot;Shop by category&quot; grid.
            Lower <b>order</b> values appear first.
          </p>
          <button className="btn btn-ghost" onClick={load}>Refresh</button>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : items.length === 0 ? (
          <div className={common.empty}>
            <b>No categories yet</b>
            <span>Click &quot;New category&quot; to add your first tile.</span>
          </div>
        ) : (
          <div className={common.tableWrap}>
            <table className={common.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c._id}>
                    <td>
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveImg(c.image)} alt="" className={common.thumb} />
                      ) : (
                        <div className={common.thumb} />
                      )}
                    </td>
                    <td>
                      <b style={{ display: "block", fontFamily: "var(--font-display)" }}>{c.name}</b>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{c.slug || "—"}</td>
                    <td style={{ fontFamily: "var(--font-display)" }}>{c.order ?? 0}</td>
                    <td>
                      <span className={`badge ${c.isActive ? "badge-ok" : "badge-neutral"}`}>
                        {c.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className={common.dangerBtn} onClick={() => openEdit(c)} style={{ color: "var(--brand-700)" }} title="Edit category">
                        <HiOutlinePencilSquare style={{ verticalAlign: "-2px" }} />
                      </button>
                      <button className={common.dangerBtn} onClick={() => remove(c._id)} title="Delete category">
                        <HiOutlineTrash style={{ verticalAlign: "-2px" }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <form className={styles.formCard} onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h3>{editing ? "Edit category" : "New category"}</h3>

            <div className={styles.row}>
              <label>
                <span>Name</span>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
            </div>

            <div className={styles.row2}>
              <label>
                <span>Order</span>
                <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} />
              </label>
              <label>
                <span>Status</span>
                <select value={form.isActive ? "1" : "0"} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "1" }))}>
                  <option value="1">Active</option>
                  <option value="0">Hidden</option>
                </select>
              </label>
            </div>

            <div className={styles.row}>
              <label>
                <span>Tile image</span>
                <ImageDropzone
                  value={form.image}
                  onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                  disabled={saving}
                />
              </label>
            </div>

            {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

            <div className={styles.actions}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create category"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
