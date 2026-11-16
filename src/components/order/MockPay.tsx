"use client";
import { useState } from "react";
import { api } from "@/lib/client";

export function MockPay({ id, k }: { id: string; k: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn btn-primary mt-5 w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await api("/api/dev/mock-pay", { method: "POST", body: JSON.stringify({ orderId: id, k }) });
        window.location.href = `/pedido/${id}?k=${encodeURIComponent(k)}`;
      }}
    >
      Confirmar pago simulado
    </button>
  );
}
