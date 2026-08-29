"use client";

import { useEffect, useState } from "react";
import { HiOutlineMagnifyingGlass, HiPlus, HiOutlineTrash, HiOutlinePencilSquare } from "react-icons/hi2";
import Shell from "../components/Shell";
import ImageDropzone from "../components/ImageDropzone";
import MultiImageDropzone from "../components/MultiImageDropzone";
import { api, API_URL } from "../lib/api";
import common from "../components/Common.module.css";
import styles from "./products.module.css";

function resolveImg(url) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (url.startsWith("/uploads/")) return `${API_URL}${url}`;
  return url;
}

const empty = {
  name: "",
  category: "",
  price: "",
  originalPrice: "",
  stock: 0,
  image: "",
  images: [],
  description: "",
  features: "",
};

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api(`/api/admin/products?q=${encodeURIComponent(q)}`);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p._id);
    setForm({
      name: p.name || "",
      category: p.category || "",
      price: p.price ?? "",
      originalPrice: p.originalPrice ?? "",
      stock: p.stock ?? 0,
      image: p.image || "",
      images: Array.isArray(p.images) ? p.images : [],
      description: p.description || "",
      features: Array.isArray(p.features) ? p.features.join("\n") : "",
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock),
        features: String(form.features || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editing) {
        await api(`/api/admin/products/${editing}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/admin/products", {
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
    if (!confirm("Delete this product?")) return;
    await api(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <Shell
      title="Products"
      subtitle={`${items.length} products in your catalogue.`}
      actions={
        <button className="btn btn-primary" onClick={openNew}>
          <HiPlus /> New product
        </button>
      }
    >
      <div className={common.card}>
        <div className={common.cardHead}>
          <div className={common.searchWrap}>
            <HiOutlineMagnifyingGlass />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search by name…"
            />
          </div>
          <button className="btn btn-ghost" onClick={load}>Refresh</button>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : items.length === 0 ? (
          <div className={common.empty}>
            <b>No products yet</b>
            <span>Click &quot;New product&quot; to add your first item.</span>
          </div>
        ) : (
          <div className={common.tableWrap}>
            <table className={common.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveImg(p.image)} alt="" className={common.thumb} />
                      ) : (
                        <div className={common.thumb} />
                      )}
                    </td>
                    <td>
                      <b style={{ display: "block", fontFamily: "var(--font-display)" }}>{p.name}</b>
                      {p.tag && <span className="badge badge-info" style={{ marginTop: 4 }}>{p.tag}</span>}
                    </td>
                    <td>{p.category}</td>
                    <td>
                      <b style={{ fontFamily: "var(--font-display)" }}>₹{p.price.toLocaleString("en-IN")}</b>
                      {p.originalPrice && (
                        <em style={{ display: "block", color: "var(--muted)", textDecoration: "line-through", fontStyle: "normal", fontSize: 12 }}>
                          ₹{p.originalPrice.toLocaleString("en-IN")}
                        </em>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.stock > 5 ? "badge-ok" : p.stock > 0 ? "badge-warn" : "badge-danger"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className={common.dangerBtn} onClick={() => openEdit(p)} style={{ color: "var(--brand-700)" }}>
                        <HiOutlinePencilSquare style={{ verticalAlign: "-2px" }} />
                      </button>
                      <button className={common.dangerBtn} onClick={() => remove(p._id)}>
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
            <h3>{editing ? "Edit product" : "New product"}</h3>

            <div className={styles.row}>
              <label>
                <span>Name</span>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
            </div>
            <div className={styles.row}>
              <label>
                <span>Category</span>
                <input required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
              </label>
            </div>
            <div className={styles.row2}>
              <label>
                <span>Price (₹)</span>
                <input type="number" required min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </label>
              <label>
                <span>Original / MRP (₹)</span>
                <input type="number" min="0" value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))} />
              </label>
            </div>
            <div className={styles.row}>
              <label>
                <span>Stock</span>
                <input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              </label>
            </div>
            <div className={styles.row}>
              <label>
                <span>Product image</span>
                <ImageDropzone
                  value={form.image}
                  onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                  disabled={saving}
                />
              </label>
            </div>
            <div className={styles.row}>
              <label>
                <span>Thumbnail images <em style={{ color: "var(--muted)", fontStyle: "normal", fontWeight: 400 }}>(gallery — optional)</em></span>
                <MultiImageDropzone
                  value={form.images}
                  onChange={(next) => setForm((f) => ({ ...f, images: next }))}
                  disabled={saving}
                />
              </label>
            </div>
            <div className={styles.row}>
              <label>
                <span>Description</span>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
            </div>
            <div className={styles.row}>
              <label>
                <span>Key features <em style={{ color: "var(--muted)", fontStyle: "normal", fontWeight: 400 }}>(one per line)</em></span>
                <textarea
                  rows={5}
                  value={form.features}
                  onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                />
              </label>
            </div>

            {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

            <div className={styles.actions}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
