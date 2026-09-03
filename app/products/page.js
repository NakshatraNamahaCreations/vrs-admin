"use client";

import { useEffect, useState } from "react";
import { HiOutlineMagnifyingGlass, HiPlus, HiOutlineTrash, HiOutlinePencilSquare, HiOutlineEye, HiOutlineCheckBadge } from "react-icons/hi2";
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
  const [viewing, setViewing] = useState(null); // full product doc when the view drawer is open
  const [categories, setCategories] = useState([]); // fetched from /api/admin/categories

  const load = async () => {
    setLoading(true);
    try {
      const res = await api(`/api/admin/products?q=${encodeURIComponent(q)}`);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api(`/api/admin/categories`);
      setCategories(
        (res.items || [])
          .filter((c) => c?.name)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
      );
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    load();
    loadCategories();
    // eslint-disable-next-line
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setShowForm(true);
  };
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
        // Blank price → "on request" product; leave the field off the payload
        // so it stays undefined in Mongo rather than being stored as 0/NaN.
        price: form.price === "" || form.price == null ? undefined : Number(form.price),
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
                      <b style={{ fontFamily: "var(--font-display)" }}>
                        {p.price != null ? `₹${p.price.toLocaleString("en-IN")}` : "On request"}
                      </b>
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
                      <button className={common.dangerBtn} onClick={() => setViewing(p)} style={{ color: "var(--brand-700)" }} title="View product">
                        <HiOutlineEye style={{ verticalAlign: "-2px" }} />
                      </button>
                      <button className={common.dangerBtn} onClick={() => openEdit(p)} style={{ color: "var(--brand-700)" }} title="Edit product">
                        <HiOutlinePencilSquare style={{ verticalAlign: "-2px" }} />
                      </button>
                      <button className={common.dangerBtn} onClick={() => remove(p._id)} title="Delete product">
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
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  disabled={categories.length === 0}
                >
                  <option value="" disabled>
                    {categories.length === 0 ? "No categories yet — add one in Categories" : "Select a category…"}
                  </option>
                  {categories.map((c) => (
                    <option key={c._id || c.name} value={c.name}>
                      {c.name.toLowerCase()}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <em style={{ color: "var(--muted)", fontSize: 12, fontStyle: "normal", marginTop: 6 }}>
                    Head to the Categories page to add one first.
                  </em>
                )}
              </label>
            </div>
            <div className={styles.row2}>
              <label>
                <span>Price (₹) <em style={{ color: "var(--muted)", fontStyle: "normal", fontWeight: 400 }}>(leave blank for &quot;on request&quot;)</em></span>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
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

      {viewing && (
        <ProductViewDrawer
          product={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            const p = viewing;
            setViewing(null);
            openEdit(p);
          }}
        />
      )}
    </Shell>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

function ProductViewDrawer({ product, onClose, onEdit }) {
  const p = product;
  const original = Number(p.originalPrice || 0);
  const price = Number(p.price || 0);
  const discount = original > price
    ? Math.round(((original - price) / original) * 100)
    : 0;
  const gallery = Array.from(
    new Set([p.image, ...(Array.isArray(p.images) ? p.images : [])].filter(Boolean))
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.formCard}
        style={{ maxWidth: 720 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Product details</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Hero image */}
          {p.image ? (
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 3",
                background: "#f5fafd",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid var(--line)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImg(p.image)}
                alt={p.name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              {discount > 0 && (
                <span
                  style={{
                    position: "absolute", top: 12, left: 12,
                    background: "var(--danger)", color: "#fff",
                    padding: "4px 10px", borderRadius: 999,
                    fontSize: "0.75rem", fontWeight: 700,
                  }}
                >
                  -{discount}%
                </span>
              )}
            </div>
          ) : (
            <div
              style={{
                width: "100%", aspectRatio: "4 / 3",
                background: "#f5fafd", borderRadius: 12,
                border: "1px dashed var(--line)",
                display: "grid", placeItems: "center", color: "var(--muted)",
              }}
            >
              No image
            </div>
          )}

          {/* Gallery */}
          {gallery.length > 1 && (
            <section>
              <b style={{ display: "block", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                Gallery ({gallery.length})
              </b>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {gallery.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    style={{
                      width: 72, height: 72, borderRadius: 10,
                      overflow: "hidden", border: "1px solid var(--line)",
                      background: "#f5fafd",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveImg(url)}
                      alt={`${p.name} ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Title + meta */}
          <section>
            <b style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "1.15rem", marginBottom: 4 }}>
              {p.name}
            </b>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: "0.8rem" }}>
              <span className="badge badge-info">{p.category}</span>
              {p.brand && <span className="badge badge-neutral">{p.brand}</span>}
              {p.tag && <span className="badge badge-ok">{p.tag}</span>}
              <span className={`badge ${p.stock > 5 ? "badge-ok" : p.stock > 0 ? "badge-warn" : "badge-danger"}`}>
                Stock: {p.stock ?? 0}
              </span>
              {!p.isActive && <span className="badge badge-danger">Inactive</span>}
            </div>
          </section>

          {/* Price block */}
          <section
            style={{
              display: "flex", gap: 14, alignItems: "baseline",
              padding: "14px 16px", border: "1px solid var(--line)",
              borderRadius: 12, background: "#f9fcfe",
            }}
          >
            <b style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--ink)" }}>
              ₹{price.toLocaleString("en-IN")}
            </b>
            {original > price && (
              <>
                <s style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
                  ₹{original.toLocaleString("en-IN")}
                </s>
                <span style={{ color: "#0f8f6b", fontWeight: 700, fontSize: "0.85rem" }}>
                  You save ₹{(original - price).toLocaleString("en-IN")}
                </span>
              </>
            )}
          </section>

          {/* Description */}
          {p.description && (
            <section>
              <b style={{ display: "block", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                Description
              </b>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.55, color: "var(--ink)", whiteSpace: "pre-line" }}>
                {p.description}
              </p>
            </section>
          )}

          {/* Features */}
          {Array.isArray(p.features) && p.features.length > 0 && (
            <section>
              <b style={{ display: "block", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                Key features ({p.features.length})
              </b>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.88rem", color: "var(--ink)" }}>
                    <HiOutlineCheckBadge style={{ color: "var(--brand-700)", flexShrink: 0, marginTop: 2 }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Rating */}
          {(p.rating > 0 || p.reviewCount > 0) && (
            <section>
              <b style={{ display: "block", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                Rating
              </b>
              <div style={{ fontSize: "0.9rem" }}>
                <b style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>
                  {Number(p.rating || 0).toFixed(1)} ★
                </b>
                <span style={{ color: "var(--muted)", marginLeft: 8 }}>
                  ({p.reviewCount || 0} {p.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            </section>
          )}

          {/* Meta / timestamps */}
          <section
            style={{
              display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8, fontSize: "0.82rem", color: "var(--ink)",
              paddingTop: 14, borderTop: "1px solid var(--line)",
            }}
          >
            <span><em style={{ color: "var(--muted)", fontStyle: "normal" }}>Created:</em> {formatDate(p.createdAt)}</span>
            <span><em style={{ color: "var(--muted)", fontStyle: "normal" }}>Updated:</em> {formatDate(p.updatedAt)}</span>
            {p.slug && (
              <span style={{ gridColumn: "1 / -1" }}>
                <em style={{ color: "var(--muted)", fontStyle: "normal" }}>Slug:</em> <code style={{ background: "rgba(15,127,191,0.08)", color: "var(--brand-700)", padding: "1px 6px", borderRadius: 4, fontSize: "0.75rem" }}>{p.slug}</code>
              </span>
            )}
            {p.image && (
              <span style={{ gridColumn: "1 / -1", overflowWrap: "anywhere", wordBreak: "break-all" }}>
                <em style={{ color: "var(--muted)", fontStyle: "normal" }}>Image:</em> <code style={{ background: "rgba(15,127,191,0.08)", color: "var(--brand-700)", padding: "1px 6px", borderRadius: 4, fontSize: "0.72rem" }}>{p.image}</code>
              </span>
            )}
          </section>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            <HiOutlinePencilSquare /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}
