import type { Metadata } from "next";
import LegalPageView from "@/components/pages/LegalPageView";

export const metadata: Metadata = {
  title: "Política de cookies | ARGOS-IT",
  description: "Uso de cookies y tecnologías similares en el sitio web de ARGOS-IT."
};

export default function Cookies() {
  return <LegalPageView type="cookies" />;
}
