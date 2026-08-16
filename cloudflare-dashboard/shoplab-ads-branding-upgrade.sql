-- Atualiza apenas o nome legado do produto em rótulos já armazenados.
UPDATE shoplab_ads
SET ad_label = replace(
  replace(ad_label, char(65,68,83,69,78,83,69), 'ADS'),
  char(65,100,83,101,110,115,101),
  'Ads'
)
WHERE instr(ad_label, char(65,68,83,69,78,83,69)) > 0
   OR instr(ad_label, char(65,100,83,101,110,115,101)) > 0;
