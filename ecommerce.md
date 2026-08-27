# Məktəb Ləvazimatları Onlayn Mağaza — Layihə Promptu

> Bu mətni olduğu kimi kopyalayıb istifadə etdiyin AI kod alətinə (Claude Code, Cursor, Lovable, v0 və s.) ver.

---

## ROL VƏ TAPŞIRIQ

Sən təcrübəli full-stack developersən. Mənim üçün **məktəb ləvazimatları satan onlayn mağaza saytı** qur. Sayt tam işlək olmalıdır: müştəri tərəfi + admin panel + sifariş bildirişi e-poçtu.

**Sayt dili:** Azərbaycan dili (bütün interfeys mətnləri Azərbaycan dilində).
**Valyuta:** AZN (₼).
**Ödəniş:** YALNIZ nağd, çatdırılma zamanı (onlayn ödəniş sistemi YOXDUR).

---

## TEXNOLOGİYA

- **Framework:** Next.js (App Router) + TypeScript
- **Stil:** Tailwind CSS
- **Verilənlər bazası:** PostgreSQL + Prisma ORM (lokal testdə SQLite işlədə bilərsən)
- **Şəkil yükləmə:** local `/public/uploads` qovluğu və ya Cloudinary/UploadThing
- **E-poçt:** Nodemailer (Gmail SMTP) və ya Resend
- **Admin autentifikasiyası:** NextAuth (credentials) və ya sadə JWT + cookie sessiya
- **Deploy:** Vercel-də işləyə bilən quruluş

Bütün gizli məlumatlar `.env` faylında saxlanılsın, `.env.example` nümunəsi də yaradılsın.

---

## 1. MƏHSUL KATEQORİYALARI

Başlanğıc üçün bu kateqoriyalar seed data kimi bazaya yazılsın (admin sonra əlavə/silə bilər):

- Dəftərlər
- Gündəliklər
- Qələmlər
- Rəngli karandaşlar
- Flomasterlər
- Boyalar
- Kley
- Kitablar
- Dəftər üzləri
- Albomlar
- Rəngli kağızlar
- Penallar
- Termoslar
- Pozanlar
- Yonanlar
- Xətkeşlər
- Pərgarlar
- Digər

---

## 2. MÜŞTƏRİ TƏRƏFİ (Public Sayt)

### 2.1 Ana səhifə
- Yuxarıda header: loqo, axtarış sahəsi, kateqoriya menyusu, səbət ikonu (içindəki məhsul sayı göstərilsin)
- Banner / hero bölməsi (məktəb mövsümü üçün)
- Kateqoriya kartları (şəkil + ad)
- "Yeni məhsullar" və "Populyar məhsullar" bölmələri
- Footer: əlaqə nömrəsi, ünvan, sosial şəbəkə linkləri, iş saatları

### 2.2 Kateqoriya / Məhsullar səhifəsi
- Məhsullar grid şəklində (şəkil, ad, qiymət, "Səbətə at" düyməsi)
- Kateqoriyaya görə filtr
- Qiymətə görə sıralama (ucuzdan bahaya / bahadan ucuza)
- Ad üzrə axtarış
- Səhifələmə (pagination)

### 2.3 Məhsul detalı səhifəsi
- Böyük şəkil (bir neçə şəkil olarsa qalereya)
- Ad, qiymət, kateqoriya, ətraflı təsvir, stok vəziyyəti
- Say seçimi (miqdar +/-)
- **Rəng seçimi** (aşağıda 2.4-ə bax)
- **Oğlan / Qız seçimi** (aşağıda 2.4-ə bax)
- "Səbətə əlavə et" düyməsi

### 2.4 ⚠️ VACİB — Səbətə əlavə edərkən seçim sahələri

Məhsul səbətə əlavə edilərkən müştəriyə mütləq bu sahələr göstərilməlidir:

1. **Rəng** — mətn sahəsi (input) VƏ/VƏ YA admin tərəfindən məhsula təyin edilmiş rənglərdən seçim (dropdown). Əgər admin həmin məhsul üçün rəng siyahısı daxil edibsə → dropdown göstər, həm də "Digər rəng yaz" variantı olsun. Əgər rəng siyahısı yoxdursa → sərbəst mətn sahəsi göstər.
2. **Kimin üçün** — 3 variantlı seçim: `Oğlan` / `Qız` / `Fərqi yoxdur`
3. **Əlavə qeyd** — sərbəst mətn sahəsi (məsələn: "üzərində maşın şəkli olsun", "açıq mavi olsun"), məcburi deyil.

Bu üç məlumat həmin səbət elementinə yazılmalı, sifariş verildikdə **hər məhsulun yanında ayrıca admin panelə düşməlidir**. Yəni eyni məhsul fərqli rənglərdə səbətdə ayrı-ayrı sətir kimi görünməlidir.

### 2.5 Səbət səhifəsi
- Səbətdəki məhsulların siyahısı: şəkil, ad, qiymət, say, seçilmiş **rəng**, **oğlan/qız**, **qeyd**
- Səbətdəki elementin sayını dəyişmək və silmək imkanı
- Seçimləri (rəng, oğlan/qız, qeyd) redaktə etmək imkanı
- Ara cəmi, endirim, ümumi məbləğ
- Səbət `localStorage`-də saxlanılsın ki, səhifə yenilənəndə itməsin

### 2.6 ⚠️ VACİB — Promokod sistemi
Səbətdə/checkout səhifəsində promokod daxil etmək üçün sahə olsun:

- Düzgün kodlar: **`RTH2026`** və **`TABİB2026`**
- Kod böyük/kiçik hərfə həssas olmasın (`rth2026` da işləsin)
- `TABİB2026` yazılışında **İ** hərfi var — həm `TABİB2026`, həm `TABIB2026` variantı qəbul edilsin
- Düzgün kod daxil edildikdə **ümumi məbləğə 10% endirim** tətbiq olunsun
- Ekranda göstərilsin: `Ara cəmi: 50.00 ₼` → `Endirim (RTH2026, 10%): -5.00 ₼` → `Yekun: 45.00 ₼`
- Səhv kod daxil edilərsə: "Promokod düzgün deyil" xəbərdarlığı
- Bir sifarişdə yalnız bir promokod işlədilə bilər
- Promokodlar bazada `PromoCode` cədvəlində saxlanılsın ki, admin gələcəkdə yeni kod əlavə edə/söndürə bilsin (seed ilə bu iki kod yazılsın)

### 2.7 ⚠️ VACİB — Sifariş (Checkout) səhifəsi

Müştəri sifarişi tamamlamaq üçün bu məlumatları daxil etməlidir:

| Sahə | Məcburi | Qeyd |
|---|---|---|
| **Ad** | Bəli | minimum 2 hərf |
| **Soyad** | Bəli | minimum 2 hərf |
| **Telefon nömrəsi** | Bəli | Azərbaycan formatı: `+994 XX XXX XX XX` — maska/validasiya olsun (050, 051, 055, 070, 077, 010, 099 prefiksləri) |
| **Şəhər / Rayon** | Bəli | |
| **Çatdırılma ünvanı** | Bəli | ətraflı ünvan (küçə, bina, mənzil) |
| **E-poçt** | Xeyr | könüllü |
| **Sifarişə qeyd** | Xeyr | sərbəst mətn |
| **Promokod** | Xeyr | 2.6-ya bax |

- Ödəniş üsulu bölməsində yalnız bir seçim göstərilsin: **"Nağd ödəniş (çatdırılma zamanı)"**
- Formada validasiya olsun, boş sahə ilə sifariş göndərilə bilməsin, səhvlər Azərbaycan dilində göstərilsin
- Sifariş göndərildikdən sonra **təşəkkür səhifəsi** açılsın: sifariş nömrəsi (məs. `#2026-0001`), sifarişin xülasəsi, "sizinlə tezliklə əlaqə saxlanılacaq" mesajı
- Sifariş uğurla yaradıldıqdan sonra səbət təmizlənsin

### 2.8 ⚠️ VACİB — E-poçt bildirişi
Yeni sifariş yaradılan kimi **`liyevelvin22@gmail.com`** ünvanına avtomatik e-poçt getsin.

E-poçtun məzmunu (HTML formatında, Azərbaycan dilində):
- Mövzu: `Yeni sifariş #2026-0001 — [Ad Soyad]`
- Müştəri: ad, soyad, telefon, e-poçt
- Ünvan: şəhər + tam ünvan
- Sifariş tarixi və saatı
- Məhsulların cədvəli: ad, say, qiymət, **rəng**, **oğlan/qız**, **qeyd**
- Ara cəmi, promokod və endirim məbləği, yekun məbləğ
- Ödəniş üsulu: Nağd (çatdırılma zamanı)
- Admin panelə keçid linki

Əgər e-poçt göndərilməsə, sifariş yenə də bazaya yazılsın (e-poçt xətası sifarişi ləğv etməsin), xəta log-a yazılsın.

---

## 3. ADMİN PANEL (`/admin`)

### 3.1 Giriş
- İstifadəçi adı + şifrə ilə giriş səhifəsi
- Şifrə bazada hash-lənmiş (bcrypt) saxlanılsın
- `/admin` altındakı bütün səhifələr middleware ilə qorunsun — giriş etməyən istifadəçi ora düşə bilməsin
- İlkin admin hesabı seed ilə yaradılsın (istifadəçi adı və şifrə `.env`-dən oxunsun)

### 3.2 Dashboard (ana səhifə)
- Bugünkü sifariş sayı
- Yeni (baxılmamış) sifariş sayı — diqqət çəkən nişanla
- Ümumi sifariş sayı və ümumi satış məbləği
- Ümumi məhsul sayı, stokda bitən məhsullar
- Son 5 sifarişin qısa siyahısı

### 3.3 Kateqoriyaların idarə edilməsi
- Kateqoriyaların siyahısı
- Yeni kateqoriya əlavə et: **ad**, **şəkil** (könüllü), **sıra nömrəsi**
- Redaktə və silmə (kateqoriyada məhsul varsa xəbərdarlıq versin)

### 3.4 Məhsulların idarə edilməsi
Məhsul əlavə etmə/redaktə formasında bu sahələr olsun:

- **Şəkil** (yükləmə, birdən çox şəkil dəstəklənsin, önizləmə göstərilsin)
- **Məhsulun adı**
- **Kateqoriya** (dropdown)
- **Qiymət** (₼)
- **Endirimli qiymət** (könüllü — varsa saytda köhnə qiymət üstündən xətli göstərilsin)
- **Təsvir** (uzun mətn)
- **Mövcud rənglər** (vergüllə ayrılmış siyahı, məs: `qırmızı, mavi, yaşıl`) — bu, müştəri tərəfindəki rəng dropdown-unu doldurur
- **Stok sayı**
- **Aktiv / Deaktiv** (deaktiv məhsul saytda görünməsin)
- **Seçilmiş məhsul (populyar)** — bəli/xeyr

Məhsullar siyahısında: axtarış, kateqoriyaya görə filtr, redaktə və silmə düymələri.

### 3.5 ⚠️ VACİB — Sifarişlərin idarə edilməsi
- Bütün sifarişlərin siyahısı (ən yeni yuxarıda): sifariş nömrəsi, ad soyad, telefon, məbləğ, status, tarix
- **Yeni sifarişlər fərqli rənglə / "YENİ" nişanı ilə seçilsin**
- Statusa görə filtr, tarixə görə filtr, ad/telefon üzrə axtarış
- Sifariş detalı səhifəsi:
  - Müştərinin adı, soyadı, telefonu (üzərinə basanda zəng edilsin — `tel:` linki), e-poçtu, ünvanı
  - Məhsulların cədvəli — **hər məhsulun yanında seçilmiş rəng, oğlan/qız və qeyd mütləq görünsün**
  - Ara cəmi, işlədilmiş promokod, endirim, yekun məbləğ
  - Sifariş qeydi
- **Status dəyişdirmə:** `Yeni` → `Təsdiqləndi` → `Yolda` → `Çatdırıldı` / `Ləğv edildi`
- Sifarişi çap etmək (print) imkanı — kuryer üçün sadə çek görünüşü

### 3.6 Promokodların idarə edilməsi (əlavə)
- Promokodların siyahısı: kod, endirim faizi, aktiv/deaktiv, neçə dəfə istifadə olunub
- Yeni kod əlavə etmə və mövcud kodu söndürmə
- `RTH2026` və `TABİB2026` seed ilə 10% endirimlə əvvəlcədən yazılsın

---

## 4. VERİLƏNLƏR BAZASI SXEMİ (Prisma)

```prisma
model Category {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  image     String?
  order     Int       @default(0)
  products  Product[]
  createdAt DateTime  @default(now())
}

model Product {
  id            String      @id @default(cuid())
  name          String
  slug          String      @unique
  description   String?     @db.Text
  price         Decimal
  salePrice     Decimal?
  images        String[]    // şəkil URL-ləri
  colors        String[]    // mövcud rənglər
  stock         Int         @default(0)
  isActive      Boolean     @default(true)
  isFeatured    Boolean     @default(false)
  categoryId    String
  category      Category    @relation(fields: [categoryId], references: [id])
  orderItems    OrderItem[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Order {
  id             String      @id @default(cuid())
  orderNumber    String      @unique   // məs. 2026-0001
  firstName      String                // Ad
  lastName       String                // Soyad
  phone          String                // Telefon
  email          String?
  city           String
  address        String
  note           String?
  promoCode      String?
  discountAmount Decimal     @default(0)
  subtotal       Decimal
  total          Decimal
  paymentMethod  String      @default("CASH_ON_DELIVERY")
  status         OrderStatus @default(NEW)
  items          OrderItem[]
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

model OrderItem {
  id         String   @id @default(cuid())
  orderId    String
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  productName String              // sifariş anındakı ad (snapshot)
  price      Decimal              // sifariş anındakı qiymət
  quantity   Int
  color      String?              // müştərinin seçdiyi rəng
  gender     String?              // "OGLAN" | "QIZ" | "FERQI_YOXDUR"
  note       String?              // müştərinin əlavə qeydi
}

model PromoCode {
  id          String   @id @default(cuid())
  code        String   @unique
  discountPct Int      @default(10)
  isActive    Boolean  @default(true)
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
}

model Admin {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

enum OrderStatus {
  NEW          // Yeni
  CONFIRMED    // Təsdiqləndi
  SHIPPING     // Yolda
  DELIVERED    // Çatdırıldı
  CANCELLED    // Ləğv edildi
}
```

---

## 5. DİZAYN TƏLƏBLƏRİ

- Tam **mobil uyğun** (responsive) — müştərilərin əksəriyyəti telefondan girəcək
- Şən, təmiz, məktəb mövsümünə uyğun rəng palitrası (mavi/narıncı/sarı vurğular, ağ fon)
- Böyük, aydın "Səbətə at" və "Sifarişi tamamla" düymələri
- Yüklənmə vəziyyətləri (loading), boş səbət görünüşü, xəta mesajları — hamısı Azərbaycan dilində
- Sifariş uğurla göndəriləndə vizual təsdiq (toast/modal)

---

## 6. TƏHLÜKƏSİZLİK VƏ KEYFİYYƏT

- Bütün form məlumatları həm frontend-də, həm də serverdə (API route) yoxlanılsın (Zod ilə)
- Qiymət və endirim hesablaması **yalnız serverdə** aparılsın — müştəri tərəfindən göndərilən məbləğə etibar edilməsin
- Promokod yoxlaması serverdə edilsin
- Admin API route-ları sessiya olmadan işləməsin
- SQL injection və XSS-ə qarşı qorunma (Prisma + input sanitization)
- Şəkil yükləməsində fayl tipi və ölçü limiti (məs. maks. 5MB, yalnız jpg/png/webp)

---

## 7. TƏHVİL VERİLƏCƏKLƏR

1. Tam işlək Next.js layihəsi (frontend + API + admin panel)
2. Prisma sxemi + miqrasiyalar + seed skripti (kateqoriyalar, promokodlar, admin hesabı, bir neçə nümunə məhsul)
3. `.env.example` faylı — bütün lazımi dəyişənlərlə:
   ```
   DATABASE_URL=
   ADMIN_USERNAME=
   ADMIN_PASSWORD=
   NEXTAUTH_SECRET=
   SMTP_HOST=
   SMTP_PORT=
   SMTP_USER=
   SMTP_PASSWORD=
   ORDER_NOTIFICATION_EMAIL=liyevelvin22@gmail.com
   ```
4. `README.md` — quraşdırma, işə salma və Vercel-ə yükləmə təlimatı **Azərbaycan dilində**
5. Kodda əsas hissələr üçün qısa şərhlər

---

## 8. ADDIMLARLA İŞ QAYDASI

Layihəni bu ardıcıllıqla qur və hər mərhələdən sonra nəyi bitirdiyini qısa yaz:

1. Layihə quruluşu + Prisma sxemi + seed
2. Admin autentifikasiyası + admin layout
3. Admin: kateqoriya və məhsul CRUD (şəkil yükləmə daxil)
4. Public: ana səhifə, kateqoriya, məhsul detalı
5. Səbət (rəng + oğlan/qız + qeyd sahələri ilə)
6. Checkout (ad, soyad, telefon, ünvan + promokod + nağd ödəniş)
7. Sifariş API + e-poçt bildirişi
8. Admin: sifarişlərin siyahısı, detalı, status idarəetməsi
9. Dizayn cilası + mobil uyğunluq + test

**Başla və birinci addımdan işə düş.**

