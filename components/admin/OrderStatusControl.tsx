"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  type OrderStatusValue,
} from "@/lib/constants";

/** Sifarişin statusunun dəyişdirilməsi (ecommerce.md §3.5). */
export function OrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatusValue;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<OrderStatusValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function change(next: OrderStatusValue) {
    if (next === status) return;

    if (next === "CANCELLED" && !confirm("Sifariş ləğv edilsin? Məhsullar stoka qaytarılacaq.")) {
      return;
    }

    setError(null);
    setInfo(null);
    setBusy(next);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; stockChanged?: string }
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Status dəyişdirilə bilmədi.");
        setBusy(null);
        return;
      }

      if (data?.stockChanged === "restored") setInfo("Məhsullar stoka qaytarıldı.");
      if (data?.stockChanged === "reserved") setInfo("Məhsullar yenidən stokdan çıxarıldı.");

      router.refresh();
    } catch {
      setError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="no-print">
      <p className="mb-2 text-sm font-semibold text-gray-900">Status</p>

      <div className="flex flex-wrap gap-2">
        {ORDER_STATUSES.map((value) => {
          const active = value === status;
          return (
            <button
              key={value}
              type="button"
              onClick={() => change(value)}
              disabled={busy !== null || active}
              aria-current={active ? "true" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-inset transition disabled:cursor-default ${
                active
                  ? ORDER_STATUS_STYLES[value]
                  : "bg-white text-gray-600 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              }`}
            >
              {busy === value ? "…" : ORDER_STATUS_LABELS[value]}
            </button>
          );
        })}
      </div>

      {info && <p className="mt-2 text-sm text-green-700">{info}</p>}
      {error && (
        <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
