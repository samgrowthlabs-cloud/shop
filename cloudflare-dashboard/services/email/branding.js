const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function emailBrandingHead(){
  return `<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
.shoplab-email-logo-dark{display:none!important;max-height:0!important;overflow:hidden!important;mso-hide:all!important}
@media (prefers-color-scheme:dark){
  .shoplab-email-logo-light{display:none!important;max-height:0!important;overflow:hidden!important;mso-hide:all!important}
  .shoplab-email-logo-surface{background-color:#173b34!important;background-image:linear-gradient(#173b34,#173b34)!important;border-color:#36534d!important}
  .shoplab-email-logo-dark{display:block!important;max-height:none!important;overflow:visible!important;color:#fff!important}
}
</style>`;
}

export function emailLogo({origin='https://shoplab.com.br',width=180}={}){
  const safeWidth=Math.max(120,Math.min(240,Number(width)||180));
  const logoUrl=new URL('/assets/img/shoplab-wordmark.png',String(origin)).href;
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td class="shoplab-email-logo-surface" bgcolor="#f7faf9" style="background-color:#f7faf9;background-image:linear-gradient(#f7faf9,#f7faf9);border:1px solid #dfe9e6;border-radius:10px;padding:10px 14px"><img class="shoplab-email-logo-light" src="${esc(logoUrl)}" width="${safeWidth}" alt="SHOPLAB" style="display:block;width:${safeWidth}px;max-width:100%;height:auto;border:0"><div class="shoplab-email-logo-dark" style="display:none;max-height:0;overflow:hidden;mso-hide:all;width:${safeWidth}px;color:#fff;font-family:Arial,Helvetica,sans-serif;font-size:31px;line-height:1;font-weight:900;letter-spacing:-1.8px">SHOPLAB</div></td></tr></table>`;
}