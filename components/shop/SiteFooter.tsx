import Link from "next/link";

import { WhatsAppLink } from "./WhatsAppButton";
import {
  DELIVERY_FEE_QEPIK,
  FREE_DELIVERY_THRESHOLD_QEPIK,
  STORE_INFO,
} from "@/lib/constants";
import { formatQepik } from "@/lib/money";

export function SiteFooter({ categories }: { categories: { slug: string; name: string }[] }) {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xl font-extrabold text-brand-700">{STORE_INFO.name}</p>
          <p className="mt-1 text-sm text-gray-600">{STORE_INFO.tagline}</p>
          <p className="mt-4 text-sm text-gray-600">
            Bütün məktəb ləvazimatları bir yerdə. Çatdırılma zamanı nağd ödəniş.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900">
            Əlaqə
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <a
                href={`tel:${STORE_INFO.phoneHref}`}
                className="font-medium text-gray-800 hover:text-brand-700"
              >
                {STORE_INFO.phone}
              </a>
            </li>
            <li>{STORE_INFO.address}</li>
            <li>{STORE_INFO.workingHours}</li>
            <li className="pt-1">
              <Link href="/izle" className="font-medium text-brand-700 hover:underline">
                Sifarişi izlə →
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900">
            Kateqoriyalar
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            {categories.slice(0, 6).map((category) => (
              <li key={category.slug}>
                <Link href={`/mehsullar?kateqoriya=${category.slug}`} className="hover:text-brand-700">
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/mehsullar" className="font-medium text-brand-700 hover:underline">
                Hamısına bax →
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900">
            Sosial şəbəkələr
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <a href="https://instagram.com" target="_blank" rel="noreferrer noopener" className="hover:text-brand-700">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://facebook.com" target="_blank" rel="noreferrer noopener" className="hover:text-brand-700">
                Facebook
              </a>
            </li>
            <li>
              <WhatsAppLink className="font-medium text-[#128C7E] hover:underline" />
            </li>
          </ul>
          <div className="mt-4 space-y-2">
            <p className="rounded-lg bg-white px-3 py-2 text-xs text-gray-500 ring-1 ring-gray-200">
              Ödəniş yalnız nağd — çatdırılma zamanı
            </p>
            <p className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-800 ring-1 ring-green-200">
              {formatQepik(FREE_DELIVERY_THRESHOLD_QEPIK)} və yuxarı sifarişlərə çatdırılma
              pulsuz · aşağıda {formatQepik(DELIVERY_FEE_QEPIK)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {STORE_INFO.name}. Bütün hüquqlar qorunur.
      </div>
    </footer>
  );
}
