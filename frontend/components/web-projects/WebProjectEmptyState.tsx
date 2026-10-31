import { EmptyState } from "@/components/client/Status";

export function WebProjectEmptyState({
  canCreate,
  memberHint,
  viewerHint,
  onCreate
}: {
  canCreate: boolean;
  memberHint: boolean;
  viewerHint: boolean;
  onCreate?: () => void;
}) {
  return (
    <div className="cp-card wp-empty">
      <EmptyState
        title="Crea o mejora con nosotros tu web"
        description="Cuéntanos qué necesitas y ARGOS te guiará paso a paso para reunir la información necesaria para crear o renovar tu web."
      />
      {canCreate ? (
        <div className="wp-empty__actions">
          <button type="button" className="cp-btn cp-btn--primary" onClick={onCreate}>
            Iniciar proyecto web
          </button>
          <p className="cp-disclaimer">
            Se envía una solicitud en fase de recopilación. No implica que el proyecto esté aceptado.
          </p>
        </div>
      ) : null}
      {memberHint ? (
        <p className="cp-disclaimer">
          Puedes completar la información de un proyecto existente. Un propietario o administrador debe
          iniciar la solicitud.
        </p>
      ) : null}
      {viewerHint ? (
        <p className="cp-disclaimer">Tu rol es de solo lectura. Puedes consultar los proyectos cuando existan.</p>
      ) : null}
    </div>
  );
}
