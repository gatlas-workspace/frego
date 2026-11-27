import type { Metadata } from "next";
import { brand } from "@frego/core";
import { Download } from "@/components/landing/Download";
import { Faq } from "@/components/landing/Faq";
import { ForBusiness } from "@/components/landing/ForBusiness";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingJsonLd } from "@/components/landing/JsonLd";
import { LandingShell } from "@/components/landing/LandingShell";
import { Promises } from "@/components/landing/Promises";
import { PublicCodes } from "@/components/landing/PublicCodes";
import { Rewards } from "@/components/landing/Rewards";
import { Sources } from "@/components/landing/Sources";
import { SponsoredVouchers } from "@/components/landing/SponsoredVouchers";

const TITLE = `${brand.name} – Voucher đặt xe, so giá sau khi trừ mã`;
const DESCRIPTION = `${brand.name} tìm mã giảm giá hợp với chuyến của bạn: mã của quán gần nơi bạn đến, của hãng xe và theo thẻ, ví bạn dùng. Rồi so giá đã trừ mã để bạn chọn chuyến rẻ nhất.`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: brand.name,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og-frego.png", width: 1200, height: 630, alt: `${brand.name}: gắn voucher trước, so giá sau` }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-frego.png"],
  },
};

/** Landing page giới thiệu app Frego (thiết kế "Landing page · giới thiệu app Frego"). */
export default function Page() {
  return (
    <LandingShell>
      <LandingJsonLd description={DESCRIPTION} />
      <Hero />
      <Sources />
      <HowItWorks />
      <SponsoredVouchers />
      <PublicCodes />
      <Rewards />
      <Promises />
      <ForBusiness />
      <Faq />
      <Download />
    </LandingShell>
  );
}
