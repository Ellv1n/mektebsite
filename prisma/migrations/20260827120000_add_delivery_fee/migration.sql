-- Sifarişə çatdırılma haqqı sütunu əlavə edilir.
--
-- Default 0 olduğuna görə mövcud sətirlər problemsiz doldurulur:
-- köhnə sifarişlərdə çatdırılma haqqı alınmayıb, ona görə 0 düzgün dəyərdir.
ALTER TABLE "Order" ADD COLUMN "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0;
