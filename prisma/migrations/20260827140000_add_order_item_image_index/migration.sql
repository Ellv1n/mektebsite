-- Sifariş sətrinə "hansı variant (şəkil) seçilib" sütunu əlavə edilir.
--
-- Məhsulun bir neçə şəkli variant kimi işlədilir (məs. eyni dəftərin 3 fərqli üzü).
-- Müştəri hansını seçibsə, sifarişdə həm şəkil (productImage), həm də sıra
-- nömrəsi saxlanılır ki, admin panelində "Variant 3" kimi göstərilsin.
--
-- NULL ola bilər: köhnə sifarişlərdə seçim mövcud olmayıb.
ALTER TABLE "OrderItem" ADD COLUMN "imageIndex" INTEGER;
