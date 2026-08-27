# Sədərək — Məktəb Ləvazimatları Onlayn Mağazası

Next.js (App Router) + TypeScript + Tailwind CSS + Prisma + PostgreSQL ilə qurulmuş
tam işlək onlayn mağaza: müştəri saytı, admin panel və sifariş e-poçt bildirişi.

- **Dil:** Azərbaycan dili
- **Valyuta:** AZN (₼)
- **Ödəniş:** yalnız nağd, çatdırılma zamanı

---

## Tələblər

| Alət | Versiya | Yoxlamaq üçün |
|---|---|---|
| Node.js | 20 və ya daha yeni | `node -v` |
| npm | 10 və ya daha yeni | `npm -v` |
| Docker Desktop | son versiya | `docker --version` |

> **Windows-da Docker Desktop:** quraşdırma zamanı **"Use WSL 2 based engine"**
> seçili qalsın. Quraşdırmadan sonra Docker Desktop-u aç və işlədiyinə əmin ol
> (tapşırıq panelindəki balina ikonu yaşıl olmalıdır).

---

## Lokalda işə salma — 5 addım

Bütün əmrlər layihə qovluğunda (`sadarak`) icra olunur.

### 1. Asılılıqları quraşdır

```bash
npm install
```

### 2. `.env` faylını hazırla

```bash
cp .env.example .env
```

Windows PowerShell-də:

```powershell
Copy-Item .env.example .env
```

Sonra `.env` faylını aç və ən azı bunları doldur:

- `ADMIN_USERNAME` — admin panelinə giriş adı
- `ADMIN_PASSWORD` — admin şifrəsi
- `AUTH_SECRET` — təsadüfi uzun sətir. Yaratmaq üçün:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

> `SMTP_*` sahələrini **boş saxla** — lokalda e-poçt göndərilmir,
> məzmunu terminal konsoluna çap olunur (aşağıya bax).

### 3. Verilənlər bazasını Docker-də qaldır

```bash
docker compose up -d
```

Bu əmr `postgres:16` konteynerini host maşında **`5433`** portunda işə salır.
Məlumat `sederek_pgdata` adlı Docker volume-də saxlanılır — konteyner silinsə də itmir.

> **Niyə 5433, 5432 yox?** Çox Windows maşınında artıq PostgreSQL quraşdırılıb və
> `5432` portunu tutur. Belə halda Prisma konteynerə yox, həmin köhnə Postgres-ə
> qoşulur və `Authentication failed` xətası verir. Ona görə konteyner 5433-ə
> bağlanıb. Konteynerin **içində** port yenə 5432-dir.

Bazanın hazır olduğunu yoxla:

```bash
docker compose ps
```

`STATUS` sütununda `healthy` yazılmalıdır.

### 4. Cədvəlləri yarat və başlanğıc məlumatı yaz

```bash
npx prisma migrate dev
npx prisma db seed
```

Seed bunları yazır:
- 18 kateqoriya (Dəftərlər, Qələmlər, Boyalar, ...)
- 2 promokod: `RTH2026` və `TABİB2026` — hər ikisi **10% endirim**
- 1 admin hesabı (`.env`-dəki ad və şifrə ilə)
- Məhsullar — `sederek/product-catalog.json` faylı varsa oradan

### 5. Saytı işə sal

```bash
npm run dev
```

- Sayt: <http://localhost:3000>
- Admin panel: <http://localhost:3000/admin>

---

## Qısa əmr siyahısı

```bash
docker compose up -d      # bazanı qaldır
npx prisma migrate dev    # cədvəlləri yarat / yenilə
npx prisma db seed        # başlanğıc məlumatı yaz
npm run dev               # saytı işə sal
```

Və ya npm skriptləri ilə:

```bash
npm run db:up             # docker compose up -d
npm run db:migrate        # prisma migrate dev
npm run db:seed           # prisma db seed
npm run dev
```

---

## Faydalı əmrlər

| Əmr | Nə edir |
|---|---|
| `npm run db:up` | Postgres konteynerini qaldırır |
| `npm run db:down` | Konteyneri dayandırır (**məlumat qalır**) |
| `npm run db:logs` | Baza log-larını canlı göstərir |
| `npm run db:studio` | Prisma Studio — bazanı brauzerdə görüntüləyir |
| `npm run db:reset` | ⚠️ Bazanı **tam sıfırlayır** və seed-i yenidən işlədir |
| `npm run typecheck` | TypeScript xətalarını yoxlayır |
| `npm run build` | Produksiya build-i |
| `docker compose down -v` | ⚠️ Konteyner **və bütün baza məlumatını** silir |

---

## E-poçt bildirişi

Yeni sifariş yaradılanda `.env`-dəki `ORDER_NOTIFICATION_EMAIL` ünvanına
(standart: `liyevelvin22@gmail.com`) avtomatik bildiriş gedir.

### Lokalda (SMTP olmadan)

`SMTP_HOST` boş olduqda **e-poçt göndərilmir** — əvəzinə tam məzmun
`npm run dev` işlədiyin terminala çap olunur:

```
────────────────────────────────────────────────────────────────
📧  E-POÇT (SMTP qurulmayıb — göndərilmədi, yalnız çap olunur)
────────────────────────────────────────────────────────────────
Kimə:    liyevelvin22@gmail.com
Mövzu:   Yeni sifariş #2026-0001 — Elvin Əliyev
...
```

Bu, sifarişin yaranmasına **mane olmur**. Sifariş bazaya normal yazılır.

### Real göndəriş (Gmail)

1. Gmail hesabında **2 mərhələli doğrulamanı** aktivləşdir
2. <https://myaccount.google.com/apppasswords> ünvanından **App Password** yarat
3. `.env` faylını doldur:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="senin@gmail.com"
SMTP_PASSWORD="16-simvolluq-app-password"
SMTP_FROM="Sədərək Mağaza <senin@gmail.com>"
```

4. `npm run dev` prosesini yenidən başlat

> Adi Gmail şifrəsi işləmir — mütləq **App Password** lazımdır.

---

## Şəkillər

- **Mənbə şəkillər:** `sederek/sederekphoto/` — 193 real məhsul fotosu.
  Bu qovluq **dəyişdirilmir**, yalnız oxunur.
- **Saytın işlətdiyi şəkillər:** `public/uploads/products/` —
  kataloq qurularkən mənbədən buraya slug adı ilə kopyalanır.
- **Admin panelindən yüklənən şəkillər:** yenə `public/uploads/` qovluğuna düşür.
  Limit: maksimum **5 MB**, yalnız `jpg` / `png` / `webp`.
- **Kataloq faylı:** `sederek/product-catalog.json` — məhsulların adı, kateqoriyası,
  qiyməti və rəngləri burada saxlanılır. Qiymətləri bir yerdən redaktə edib
  `npx prisma db seed` işlətməklə bazaya tətbiq etmək olar.

### Kataloqu yenidən qurmaq

```bash
npm run catalog      # şəkilləri yoxlayır, kopyalayır, product-catalog.json yazır
npm run db:seed      # nəticəni bazaya yazır
```

`npm run catalog` bunları yoxlayır və uyğunsuzluq tapsa **dayanır**:
- hər `sourceFile` diskdə mövcuddur
- heç bir şəkil kataloqdan kənarda qalmayıb
- kateqoriya adları düzgündür, slug-lar təkrarlanmır
- kopyalanmış hər şəkil diskdə tapılır

Xam məlumat `sederek/catalog-raw.jsonl` faylındadır (hər sətir bir şəkil).
Bir məhsulun adını və ya qiymətini dəyişmək üçün ya həmin sətri, ya da
`product-catalog.json` faylını redaktə et.

---

## Tez-tez rast gəlinən problemlər

**`prisma migrate dev` xəta verir: `P1000: Authentication failed`**
Ən çox rast gəlinən səbəb: maşındakı **başqa bir PostgreSQL** həmin portu tutub və
Prisma konteynerə yox, ona qoşulur. Yoxla:

```powershell
Get-Service | Where-Object { $_.Name -like "*postgre*" }
Get-NetTCPConnection -LocalPort 5433 -State Listen
```

Konteynerin özündə autentifikasiyanı belə yoxlaya bilərsən (işləyirsə problem portdadır):

```bash
docker exec -it sederek-db psql -U sederek -d sederek_shop -c "select current_user;"
```

Həll: `docker-compose.yml`-də sol tərəfdəki portu boş bir portla əvəz et
(məs. `"5434:5432"`) və `.env`-dəki `DATABASE_URL`-də də eyni portu yaz.

**`prisma migrate dev` xəta verir: "Can't reach database server"**
Docker Desktop işləmir və ya konteyner hələ qalxmayıb.
`docker compose ps` ilə yoxla — `STATUS` sütununda `healthy` olmalıdır.

**`docker` əmri tanınmır**
Docker Desktop quraşdırılmayıb, ya da terminal quraşdırmadan **əvvəl** açılıb —
bu halda PATH köhnədir. Terminalı bağlayıb yenidən aç.

Yeni Docker Desktop versiyaları istifadəçi qovluğuna quraşdırılır. PATH-a
düşməyibsə bu qovluğu əlavə et:

```
C:\Users\<istifadəçi>\AppData\Local\Programs\DockerDesktop\resources\bin
```

**Azərbaycan hərfləri (ə, ı, ğ) bazada pozulur**
Konteyner UTF-8 ilə qurulub. Baza əvvəlcədən başqa cür yaradılıbsa
`docker compose down -v` ilə tam sil və yenidən qaldır.

---

## Layihə quruluşu

```
sadarak/
├─ app/                      # Next.js App Router səhifələri və API route-ları
├─ lib/                      # köməkçi modullar
│  ├─ prisma.ts              # Prisma client singleton
│  ├─ constants.ts           # kateqoriyalar, etiketlər, limitlər
│  ├─ money.ts               # pul hesablamaları (qəpik üzərində)
│  ├─ promo.ts               # promokod normalizasiyası (TABİB2026 / TABIB2026)
│  ├─ phone.ts               # Azərbaycan telefon validasiyası
│  ├─ slug.ts                # AZ → latın slug çevirməsi
│  └─ mail.ts                # Nodemailer + konsol fallback
├─ prisma/
│  ├─ schema.prisma          # baza sxemi
│  └─ seed.ts                # başlanğıc məlumat
├─ public/uploads/           # saytın işlətdiyi şəkillər
├─ sederek/sederekphoto/     # mənbə məhsul fotoları (dəyişdirilmir)
├─ docker-compose.yml        # lokal Postgres
├─ ecommerce.md              # texniki tapşırıq
└─ .env                      # gizli dəyərlər (git-ə düşmür)
```

---

## Növbəti addımlar

Layihə `ecommerce.md` §8-dəki ardıcıllıqla qurulur:

- [x] 1. Layihə quruluşu + Prisma sxemi + seed
- [x] 2. Şəkil kataloqu — 193 foto → **172 məhsul**, 192 şəkil
- [x] 3. Admin autentifikasiyası + admin layout + dashboard
- [x] 4. Admin: kateqoriya və məhsul CRUD (şəkil yükləmə daxil)
- [x] 5. Public: ana səhifə, kateqoriya, məhsul detalı (+ səbət saxlancı)
- [x] 6. Səbət səhifəsi + promokod (RTH2026 / TABİB2026)
- [x] 7. Checkout (ad, soyad, telefon, ünvan + nağd ödəniş)
- [x] 8. Sifariş API + e-poçt bildirişi
- [x] 9. Admin: sifarişlərin idarə edilməsi (status, çap, stok bərpası)
- [x] 10. Dizayn cilası + xəta/yükləmə səhifələri + son test

Layihə `ecommerce.md`-dəki bütün mərhələlər üzrə tamamlanıb.
