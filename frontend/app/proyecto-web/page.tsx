import type { Metadata } from "next";
import WebProjectPublicLanding from "@/components/pages/WebProjectPublicLanding";
import {
  SELF_SERVICE_LANDING_LEAD,
  SELF_SERVICE_LANDING_TITLE
} from "@/lib/webProjects/selfServiceUi";

export const metadata: Metadata = {
  title: `${SELF_SERVICE_LANDING_TITLE} | ARGOS-IT`,
  description: SELF_SERVICE_LANDING_LEAD,
  alternates: {
    canonical: "https://argos-it.com/proyecto-web"
  }
};

export default function ProyectoWebPage() {
  return <WebProjectPublicLanding />;
}
