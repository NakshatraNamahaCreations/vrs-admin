"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "../components/Shell";
import { api } from "../lib/api";
import common from "../components/Common.module.css";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/admin/stats").then(setData).catch((e) => setError(e.message));
  }, []);

  return (
    <Shell title="Dashboard" subtitle="At-a-glance overview of your VRS store.">
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {!data && !error && <p style={{ color: "var(--muted)" }}>Loading…</p>}

      {data && (
        <>
          <div className={common.statsGrid}>
            <div className={common.statCard}>
              <span>Customers</span>
              <b>{data.counts.users.toLocaleString("en-IN")}</b>
              <em>total registered</em>
            </div>
            <div className={common.statCard}>
              <span>Products</span>
              <b>{data.counts.products.toLocaleString("en-IN")}</b>
              <em>in catalogue</em>
            </div>
            <div className={common.statCard}>
              <span>Orders</span>
              <b>{data.counts.orders.toLocaleString("en-IN")}</b>
              <em>lifetime</em>
            </div>
            <div className={common.statCard}>
              <span>Revenue (30d)</span>
              <b>₹{data.revenue30d.toLocaleString("en-IN")}</b>
              <em>excludes refunds</em>
            </div>
          </div>

          <div className={common.card}>
            <div className={common.cardHead}>
              <h2>Recent orders</h2>
              <Link href="/orders" className="btn btn-ghost">View all</Link>
            </div>
            {data.recentOrders.length === 0 ? (
              <div className={common.empty}>
                <b>No orders yet</b>
                <span>Orders will appear here as customers check out.</span>
              </div>
            ) : (
              <div className={common.tableWrap}>
                <table className={common.table}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Placed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((o) => (
                      <tr key={o._id}>
                        <td style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                          #{o._id.slice(-6).toUpperCase()}
                        </td>
                        <td>
                          <b style={{ display: "block", fontFamily: "var(--font-display)" }}>{o.user?.name || "—"}</b>
                          <em style={{ color: "var(--muted)", fontStyle: "normal", fontSize: 12 }}>
                            +91 {o.user?.phone}
                          </em>
                        </td>
                        <td>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                        <td>₹{o.total.toLocaleString("en-IN")}</td>
                        <td>
                          <span className={`badge badge-info`}>{o.orderStatus.replace(/_/g, " ")}</span>
                        </td>
                        <td>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {data.counts.newEnquiries > 0 && (
            <div className={common.card} style={{ marginTop: 20 }}>
              <div className={common.cardHead}>
                <h2>New enquiries</h2>
                <Link href="/enquiries" className="btn btn-primary">
                  Review {data.counts.newEnquiries}
                </Link>
              </div>
              <p style={{ color: "var(--muted)" }}>
                You have <b style={{ color: "var(--brand-700)" }}>{data.counts.newEnquiries}</b> unread contact-form
                {data.counts.newEnquiries === 1 ? " message" : " messages"}.
              </p>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
