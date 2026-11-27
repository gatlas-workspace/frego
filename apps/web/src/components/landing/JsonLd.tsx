import { brand } from "@frego/core";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${brand.web.domain}`).replace(/\/$/, "");

/** Dữ liệu có cấu trúc (schema.org) cho trang chủ: tổ chức vận hành + ứng dụng di động. */
export function LandingJsonLd({ description }: { description: string }) {
  const orgId = `${SITE_URL}/#to-chuc`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: brand.name,
        legalName: brand.company.legalName,
        url: `${SITE_URL}/`,
        email: brand.company.supportEmail,
        telephone: brand.company.hotline,
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            telephone: brand.company.hotline,
            email: brand.company.supportEmail,
            areaServed: "VN",
            availableLanguage: "vi",
          },
          {
            "@type": "ContactPoint",
            contactType: "sales",
            email: brand.company.businessEmail,
            areaServed: "VN",
            availableLanguage: "vi",
          },
        ],
      },
      {
        "@type": "MobileApplication",
        "@id": `${SITE_URL}/#ung-dung`,
        name: brand.name,
        description,
        url: `${SITE_URL}/`,
        inLanguage: "vi",
        operatingSystem: "iOS, Android",
        applicationCategory: "TravelApplication",
        softwareVersion: brand.appVersion,
        offers: { "@type": "Offer", price: 0, priceCurrency: brand.currency },
        publisher: { "@id": orgId },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
