import type { Metadata } from "next";
import MethodView from "@/components/pages/MethodView";

export const metadata: Metadata = {
  title: "Método ARGOS-IT | Trabajo técnico ordenado",
  description:
    "Diagnóstico, plan, implementación y seguimiento para una infraestructura estable, segura y preparada para crecer."
};

export default function MetodoPage() {
  return <MethodView />;
}
