import { ORDER_STATUS_LABELS, type OrderStatusValue } from "@/lib/constants";

/**
 * Sifarişin hansı mərhələdə olduğunu göstərən zolaq.
 * Ləğv edilmiş sifariş üçün ayrıca görünüş var.
 */

const FLOW: OrderStatusValue[] = ["NEW", "CONFIRMED", "SHIPPING", "DELIVERED"];

const DESCRIPTIONS: Record<OrderStatusValue, string> = {
  NEW: "Sifarişiniz qeydə alındı",
  CONFIRMED: "Sifarişiniz təsdiqləndi",
  SHIPPING: "Sifarişiniz yola çıxdı",
  DELIVERED: "Sifarişiniz çatdırıldı",
  CANCELLED: "Sifariş ləğv edildi",
};

export function OrderTimeline({ status }: { status: OrderStatusValue }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-center">
        <p className="text-base font-bold text-red-800">Sifariş ləğv edildi</p>
        <p className="mt-1 text-sm text-red-700">
          Sual yaranarsa bizimlə telefonla əlaqə saxlayın.
        </p>
      </div>
    );
  }

  const currentIndex = FLOW.indexOf(status);

  return (
    <div>
      <ol className="flex items-start">
        {FLOW.map((step, index) => {
          const done = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === FLOW.length - 1;

          return (
            <li key={step} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* Sol xətt */}
                <div
                  className={`h-1 flex-1 rounded ${
                    index === 0 ? "bg-transparent" : done ? "bg-brand-500" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    done
                      ? "bg-brand-600 text-white"
                      : "border-2 border-gray-300 bg-white text-gray-400"
                  } ${isCurrent ? "ring-4 ring-brand-200" : ""}`}
                >
                  {done ? "✓" : index + 1}
                </div>
                {/* Sağ xətt */}
                <div
                  className={`h-1 flex-1 rounded ${
                    isLast ? "bg-transparent" : index < currentIndex ? "bg-brand-500" : "bg-gray-200"
                  }`}
                />
              </div>

              <span
                className={`mt-2 px-1 text-center text-xs font-medium sm:text-sm ${
                  done ? "text-brand-800" : "text-gray-400"
                }`}
              >
                {ORDER_STATUS_LABELS[step]}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-center text-sm font-medium text-brand-900">
        {DESCRIPTIONS[status]}
      </p>
    </div>
  );
}
