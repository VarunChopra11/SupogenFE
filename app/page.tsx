import { Twitter } from "lucide-react";

import Image from "next/image";
import { HeroSection } from "@/components/blocks/hero-section-2";
import { Footer } from "@/components/ui/footer";

export default function Home() {
  return (
    <>
      <HeroSection />
      <Footer
        logo={
          <Image
            src={"/logo-light.png"}
            width={10}
            height={10}
            className="h-10 w-10"
            alt={"logo"}
          />
        }
        brandName="Supogen"
        socialLinks={[
          {
            icon: <Twitter className="h-5 w-5" />,
            href: "https://twitter.com",
            label: "Twitter",
          },
        ]}
        mainLinks={[{ href: "/contact", label: "Contact" }]}
        legalLinks={[
          { href: "/privacy", label: "Privacy" },
          { href: "/terms", label: "Terms" },
        ]}
        copyright={{
          text: "© 2025 Supogen",
          license: "All rights reserved",
        }}
      />
    </>
  );
}
