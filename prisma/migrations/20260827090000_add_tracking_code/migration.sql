-- "Order" cədvəlinə gizli izləmə kodu əlavə edilir.
--
-- Cədvəldə artıq sətirlər olduğuna görə birbaşa NOT NULL sütun əlavə etmək olmur.
-- Addımlar: nullable əlavə et → mövcud sətirləri doldur → NOT NULL et → unikal indeks.

-- 1) Sütunu nullable əlavə edirik
ALTER TABLE "Order" ADD COLUMN "trackingCode" TEXT;

-- 2) Mövcud sifarişlərə təsadüfi kod veririk.
--    md5 onaltılıq (0-9, A-F) simvollar qaytarır — bunların hamısı
--    Crockford Base32 əlifbasına daxildir (I, L, O, U yoxdur),
--    yəni telefonda diktə edərkən qarışmır.
--    `id` sətrə qarışdırıldığı üçün hər sətir üçün ayrıca hesablanır.
UPDATE "Order"
SET "trackingCode" = upper(substr(md5(random()::text || "id"), 1, 8))
WHERE "trackingCode" IS NULL;

-- 3) Artıq boş sətir yoxdur — sütunu məcburi edirik
ALTER TABLE "Order" ALTER COLUMN "trackingCode" SET NOT NULL;

-- 4) Unikal indeks
CREATE UNIQUE INDEX "Order_trackingCode_key" ON "Order"("trackingCode");
