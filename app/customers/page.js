"use client";

import { useEffect, useState } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineEye } from "react-icons/hi2";
import Shell from "../components/Shell";
import { api } from "../lib/api";
import common from "../components/Common.module.css";
import styles from "../products/products.module.css";

const orderStatusBadge = (s) =>
  s === "delivered" ? "badge-ok" :
  s === "cancelled" ? "badge-danger" :
  s === "shipped" || s === "out_for_delivery" ? "badge-info" :
  "badge-warn";

function formatDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN"); } catch { return "—"; }
}

export default function CustomersPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const load = async (query = q) => {
    setLoading(true);
    try {
      const res = await api(`/api/admin/users?q=${encodeURIComponent(query)}`);
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search-as-you-type — 300ms after the last keystroke.
  useEffect(() => {
    const id = setTimeout(() => load(q), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const openDetail = async (id) => {
    setDetailId(id);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await api(`/api/admin/users/${id}`);
      setDetail(res);
    } catch (err) {
      setDetailError(err.message || "Couldn't load customer.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
    setDetailError("");
  };

  return (
    <Shell
      title="Customers"
      subtitle={`${total} registered customers.`}
    >
      <div className={common.card}>
        <div className={common.cardHead}>
          <div className={common.searchWrap}>
            <HiOutlineMagnifyingGlass />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search phone or email…"
            />
          </div>
          <button className="btn btn-ghost" onClick={() => load(q)}>Refresh</button>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : items.length === 0 ? (
          <div className={common.empty}>
            <b>No customers match your search</b>
          </div>
        ) : (
          <div className={common.tableWrap}>
            <table className={common.table}>
              <thead>
                <tr>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Addresses</th>
                  <th>Joined</th>
                  <th>Last login</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>+91 {u.phone}</td>
                    <td>{u.email || "—"}</td>
                    <td>
                      <span className={`badge ${u.addresses?.length ? "badge-ok" : "badge-neutral"}`}>
                        {u.addresses?.length || 0}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>{u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        className={common.dangerBtn}
                        onClick={() => openDetail(u._id)}
                        style={{ color: "var(--brand-700)" }}
                        title="View customer"
                      >
                        <HiOutlineEye style={{ verticalAlign: "-2px" }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailId && (
        <div className={styles.overlay} onClick={closeDetail}>
          <div
            className={styles.formCard}
            style={{ maxWidth: 720 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Customer details</h3>

            {detailLoading ? (
              <p style={{ color: "var(--muted)" }}>Loading…</p>
            ) : detailError ? (
              <p style={{ color: "var(--danger)" }}>{detailError}</p>
            ) : detail ? (
              <CustomerDetail data={detail} />
            ) : null}

            <div className={styles.actions}>
              <button type="button" className="btn btn-ghost" onClick={closeDetail}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function CustomerDetail({ data }) {
  const { user, orders = [] } = data;
  const lifetimeValue = orders
    .filter((o) => o.orderStatus !== "cancelled")
    .reduce((n, o) => n + (o.total || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Profile */}
      <section>
        <b style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "1rem", marginBottom: 6 }}>
          +91 {user.phone}
        </b>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, fontSize: "0.85rem", color: "var(--ink)" }}>
          <span><em style={{ color: "var(--muted)", fontStyle: "normal" }}>Email:</em> {user.email || "—"}</span>
          <span><em style={{ color: "var(--muted)", fontStyle: "normal" }}>Joined:</em> {formatDate(user.createdAt)}</span>
          <span><em style={{ color: "var(--muted)", fontStyle: "normal" }}>Last login:</em> {user.lastLoginAt ? formatDate(user.lastLoginAt) : "—"}</span>
          <span><em style={{ color: "var(--muted)", fontStyle: "normal" }}>Orders:</em> {orders.length}</span>
          <span><em style={{ color: "var(--muted)", fontStyle: "normal" }}>Lifetime value:</em> <b style={{ fontFamily: "var(--font-display)" }}>₹{lifetimeValue.toLocaleString("en-IN")}</b></span>
        </div>
      </section>

      {/* Addresses */}
      <section>
        <b style={{ display: "block", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
          Addresses ({user.addresses?.length || 0})
        </b>
        {user.addresses?.length ? (
          <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
            {user.addresses.map((a) => (
              <li key={a._id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: "0.85rem" }}>
                <b style={{ fontFamily: "var(--font-display)" }}>{a.label || "Address"}</b>
                {a.isDefault && <span className="badge badge-ok" style={{ marginLeft: 8 }}>Default</span>}
                <div style={{ color: "var(--muted)", marginTop: 4 }}>
                  {a.fullName}{a.phone && ` · +91 ${a.phone}`}
                </div>
                <div style={{ marginTop: 2 }}>
                  {a.line1}{a.line2 && `, ${a.line2}`}<br />
                  {a.city}, {a.state} — {a.pincode}
                  {a.landmark && <><br /><em style={{ color: "var(--muted)", fontStyle: "normal" }}>Landmark: {a.landmark}</em></>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No addresses on file.</p>
        )}
      </section>

      {/* Orders */}
      <section>
        <b style={{ display: "block", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
          Recent orders ({orders.length})
        </b>
        {orders.length ? (
          <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "rgba(15,127,191,0.05)" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Order</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Items</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Total</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                      {o.orderNumber || `#${String(o._id).slice(-6).toUpperCase()}`}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{(o.items || []).reduce((n, i) => n + (i.qty || 0), 0)}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-display)" }}>₹{(o.total || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span className={`badge ${orderStatusBadge(o.orderStatus)}`}>
                        {String(o.orderStatus || "").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No orders yet.</p>
        )}
      </section>
    </div>
  );
}
