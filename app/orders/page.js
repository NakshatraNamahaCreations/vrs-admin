"use client";

import { useEffect, useState } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineEye } from "react-icons/hi2";
import Shell from "../components/Shell";
import { api, API_URL } from "../lib/api";
import common from "../components/Common.module.css";
import styles from "../products/products.module.css";

const statuses = ["placed", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"];
const paymentStatuses = ["pending", "paid", "failed", "refunded"];

const paymentBadge = (s) =>
  s === "paid" ? "badge-ok" :
  s === "failed" ? "badge-danger" :
  s === "refunded" ? "badge-neutral" :
  "badge-warn";

function resolveImg(url) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (url.startsWith("/uploads/")) return `${API_URL}${url}`;
  return url;
}

function orderCode(order) {
  const num = order?.orderNumber;
  if (num) return String(num).toUpperCase();
  const raw = typeof order === "object" ? order?._id : order;
  if (!raw) return "—";
  return `#${String(raw).slice(-6).toUpperCase()}`;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

export default function OrdersPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (status) query.set("status", status);
      if (q) query.set("q", q);
      const res = await api(`/api/admin/orders?${query.toString()}`);
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const changeStatus = async (id, next) => {
    const updated = await api(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ orderStatus: next }),
    });
    // Patch the row locally so the table reflects the change without a full refetch.
    setItems((rows) => rows.map((r) => (r._id === id ? { ...r, orderStatus: updated.orderStatus } : r)));
    if (detailId === id) setDetail(updated);
  };

  const changePayment = async (id, next) => {
    const updated = await api(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ paymentStatus: next }),
    });
    setItems((rows) => rows.map((r) => (r._id === id ? { ...r, paymentStatus: updated.paymentStatus } : r)));
    if (detailId === id) setDetail(updated);
  };

  const openDetail = async (id) => {
    setDetailId(id);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await api(`/api/admin/orders/${id}`);
      setDetail(res);
    } catch (err) {
      setDetailError(err.message || "Couldn't load order.");
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
    <Shell title="Orders" subtitle={`${total} total orders.`}>
      <div className={common.card}>
        <div className={common.cardHead}>
          <div className={common.searchWrap}>
            <HiOutlineMagnifyingGlass />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search order ID, name or phone…"
            />
          </div>
          <select className={common.selectSmall} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={load}>Refresh</button>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : items.length === 0 ? (
          <div className={common.empty}><b>No orders</b><span>Nothing matches these filters.</span></div>
        ) : (
          <div className={common.tableWrap}>
            <table className={common.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Placed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o._id}>
                    <td style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                      {orderCode(o)}
                    </td>
                    <td>
                      <b style={{ display: "block", fontFamily: "var(--font-display)" }}>{o.user?.name || "—"}</b>
                      <em style={{ color: "var(--muted)", fontStyle: "normal", fontSize: 12 }}>+91 {o.user?.phone}</em>
                    </td>
                    <td>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                    <td>
                      <b style={{ fontFamily: "var(--font-display)" }}>₹{o.total.toLocaleString("en-IN")}</b>
                    </td>
                    <td>
                      <span className={`badge ${paymentBadge(o.paymentStatus)}`}>
                        {o.paymentStatus} · {o.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <select
                        className={common.selectSmall}
                        value={o.orderStatus}
                        onChange={(e) => changeStatus(o._id, e.target.value)}
                      >
                        {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        className={common.dangerBtn}
                        onClick={() => openDetail(o._id)}
                        style={{ color: "var(--brand-700)" }}
                        title="View order"
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
            style={{ maxWidth: 760 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              Order {detail ? orderCode(detail) : orderCode(items.find((i) => i._id === detailId) || detailId)}
            </h3>

            {detailLoading ? (
              <p style={{ color: "var(--muted)" }}>Loading…</p>
            ) : detailError ? (
              <p style={{ color: "var(--danger)" }}>{detailError}</p>
            ) : detail ? (
              <OrderDetail
                data={detail}
                onChangeStatus={(next) => changeStatus(detail._id, next)}
                onChangePayment={(next) => changePayment(detail._id, next)}
              />
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

function OrderDetail({ data, onChangeStatus, onChangePayment }) {
  const { user, items = [], shippingAddress, subtotal, discount, delivery, total, promoCode, paymentMethod, paymentStatus, orderStatus, createdAt } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary strip */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, fontSize: "0.85rem" }}>
        <span><em style={{ color: "var(--muted)", fontStyle: "normal" }}>Placed:</em> {formatDateTime(createdAt)}</span>
        <span><em style={{ color: "var(--muted)", fontStyle: "normal" }}>Total:</em> <b style={{ fontFamily: "var(--font-display)" }}>₹{(total || 0).toLocaleString("en-IN")}</b></span>
        <span>
          <em style={{ color: "var(--muted)", fontStyle: "normal", marginRight: 6 }}>Status:</em>
          <select
            className={common.selectSmall}
            value={orderStatus}
            onChange={(e) => onChangeStatus(e.target.value)}
          >
            {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </span>
        <span>
          <em style={{ color: "var(--muted)", fontStyle: "normal", marginRight: 6 }}>Payment:</em>
          <select
            className={common.selectSmall}
            value={paymentStatus}
            onChange={(e) => onChangePayment(e.target.value)}
          >
            {paymentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="badge badge-neutral" style={{ marginLeft: 6 }}>{paymentMethod}</span>
        </span>
      </section>

      {/* Customer */}
      <section>
        <b style={{ display: "block", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
          Customer
        </b>
        <div style={{ fontSize: "0.9rem" }}>
          <b style={{ fontFamily: "var(--font-display)" }}>{user?.name || "—"}</b>
          <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 2 }}>
            +91 {user?.phone}{user?.email && ` · ${user.email}`}
          </div>
        </div>
      </section>

      {/* Shipping */}
      <section>
        <b style={{ display: "block", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
          Shipping address
        </b>
        {shippingAddress ? (
          <div style={{ fontSize: "0.85rem", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}>
            {shippingAddress.line1}
            {shippingAddress.line2 && `, ${shippingAddress.line2}`}<br />
            {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.pincode}
            {shippingAddress.landmark && (
              <><br /><em style={{ color: "var(--muted)", fontStyle: "normal" }}>Landmark: {shippingAddress.landmark}</em></>
            )}
          </div>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No address on file.</p>
        )}
      </section>

      {/* Items */}
      <section>
        <b style={{ display: "block", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
          Items ({items.length})
        </b>
        <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "rgba(15,127,191,0.05)" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}></th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Product</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Qty</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Price</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Line</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "8px 12px" }}>
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveImg(it.image)} alt="" className={common.thumb} />
                    ) : (
                      <div className={common.thumb} />
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", fontFamily: "var(--font-display)" }}>{it.name}</td>
                  <td style={{ padding: "8px 12px" }}>{it.qty}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "var(--font-display)" }}>₹{(it.price || 0).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                    ₹{((it.price || 0) * (it.qty || 0)).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Totals */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr max-content", rowGap: 6, columnGap: 40, fontSize: "0.9rem" }}>
        <span style={{ color: "var(--muted)" }}>Subtotal</span>
        <b style={{ fontFamily: "var(--font-display)", textAlign: "right" }}>₹{(subtotal || 0).toLocaleString("en-IN")}</b>
        {discount > 0 && (
          <>
            <span style={{ color: "var(--muted)" }}>Discount{promoCode && ` (${promoCode})`}</span>
            <b style={{ fontFamily: "var(--font-display)", textAlign: "right" }}>− ₹{discount.toLocaleString("en-IN")}</b>
          </>
        )}
        <span style={{ color: "var(--muted)" }}>Delivery</span>
        <b style={{ fontFamily: "var(--font-display)", textAlign: "right" }}>
          {delivery === 0 ? "FREE" : `₹${delivery.toLocaleString("en-IN")}`}
        </b>
        <span style={{ paddingTop: 6, borderTop: "1px solid var(--line)", fontWeight: 700, color: "var(--ink)" }}>Total</span>
        <b style={{ paddingTop: 6, borderTop: "1px solid var(--line)", fontFamily: "var(--font-display)", fontSize: "1.05rem", textAlign: "right" }}>
          ₹{(total || 0).toLocaleString("en-IN")}
        </b>
      </section>
    </div>
  );
}
