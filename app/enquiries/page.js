"use client";

import { useEffect, useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import Shell from "../components/Shell";
import { api } from "../lib/api";
import common from "../components/Common.module.css";

const statusFor = (s) =>
  s === "new" ? "badge-warn" :
  s === "contacted" ? "badge-info" :
  "badge-neutral";

export default function EnquiriesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const q = status ? `?status=${status}` : "";
      const res = await api(`/api/admin/enquiries${q}`);
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const changeStatus = async (id, next) => {
    await api(`/api/admin/enquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this enquiry?")) return;
    await api(`/api/admin/enquiries/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <Shell title="Enquiries" subtitle={`${total} contact-form messages.`}>
      <div className={common.card}>
        <div className={common.cardHead}>
          <select className={common.selectSmall} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
          <button className="btn btn-ghost" onClick={load}>Refresh</button>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : items.length === 0 ? (
          <div className={common.empty}><b>No enquiries</b><span>Contact-form submissions will show up here.</span></div>
        ) : (
          <div className={common.tableWrap}>
            <table className={common.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <b style={{ display: "block", fontFamily: "var(--font-display)" }}>{m.name}</b>
                    </td>
                    <td style={{ fontFamily: "var(--font-display)" }}>+91 {m.phone}</td>
                    <td>{m.email || "—"}</td>
                    <td style={{ maxWidth: 320, whiteSpace: "normal" }}>
                      {m.message
                        ? m.message.length > 120 ? m.message.slice(0, 120) + "…" : m.message
                        : <em style={{ color: "var(--muted)", fontStyle: "normal" }}>(no message)</em>}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(m.createdAt).toLocaleDateString("en-IN")}</td>
                    <td>
                      <select className={common.selectSmall} value={m.status} onChange={(e) => changeStatus(m._id, e.target.value)}>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className={common.dangerBtn} onClick={() => remove(m._id)}>
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
    </Shell>
  );
}
