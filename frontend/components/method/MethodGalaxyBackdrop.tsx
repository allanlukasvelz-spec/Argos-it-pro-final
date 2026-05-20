type Props = {
  /**
   * full: legado (muy pesado; no usar en shell actual).
   * section: bloque Home MethodArgosShowcase.
   * method-lite: /metodo y /metodo/[slug] — misma estética galáctica, sin capas animadas costosas.
   */
  variant?: "full" | "section" | "method-lite";
};

export default function MethodGalaxyBackdrop({ variant = "full" }: Props) {
  const isSection = variant === "section";
  const isMethodLite = variant === "method-lite";
  /** Menos capas DOM (sin sol/luna/planetas/asteroides/cometas pesados) */
  const isLight = isSection || isMethodLite;

  const backdropClass = [
    "argos-method-galaxy-backdrop",
    isSection ? "argos-method-galaxy-backdrop--section" : "",
    isMethodLite ? "argos-method-galaxy-backdrop--method-lite" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={backdropClass} aria-hidden>
      <span className="argos-bg-layer argos-method-galaxy-base" />
      <span className="argos-bg-layer argos-method-galaxy-sky-tint" />
      {!isLight && (
        <>
          <span className="argos-bg-layer argos-method-galaxy-sun" />
          <span className="argos-bg-layer argos-method-galaxy-planets-far">
            <span className="argos-method-galaxy-planet argos-method-galaxy-planet--gas" />
            <span className="argos-method-galaxy-planet argos-method-galaxy-planet--ice" />
            <span className="argos-method-galaxy-planet argos-method-galaxy-planet--rust" />
            <span className="argos-method-galaxy-planet argos-method-galaxy-planet--earth" />
            <span className="argos-method-galaxy-planet argos-method-galaxy-planet--dwarf" />
          </span>
          <span className="argos-bg-layer argos-method-galaxy-moon" />
          <span className="argos-bg-layer argos-method-galaxy-orbit argos-method-galaxy-orbit--one" />
          <span className="argos-bg-layer argos-method-galaxy-orbit argos-method-galaxy-orbit--two" />
          <span className="argos-bg-layer argos-method-galaxy-planets-orbit">
            <span className="argos-method-galaxy-planet argos-method-galaxy-planet--ringed" />
            <span className="argos-method-galaxy-planet argos-method-galaxy-planet--volcanic" />
          </span>
        </>
      )}
      <span className="argos-bg-layer argos-method-galaxy-nebula argos-method-galaxy-nebula--one" />
      {!isLight && (
        <span className="argos-bg-layer argos-method-galaxy-nebula argos-method-galaxy-nebula--two" />
      )}
      <span className="argos-bg-layer argos-method-galaxy-stars argos-method-galaxy-stars--small" />
      <span className="argos-bg-layer argos-method-galaxy-stars argos-method-galaxy-stars--large" />
      {!isMethodLite && (
        <span className="argos-bg-layer argos-method-galaxy-stars argos-method-galaxy-stars--twinkle" />
      )}
      <span className="argos-bg-layer argos-method-galaxy-constellations" />
      {!isLight && <span className="argos-bg-layer argos-method-galaxy-rocky-belt" />}
      {!isLight && (
        <>
          <span className="argos-bg-layer argos-method-galaxy-asteroid argos-method-galaxy-asteroid--1" />
          <span className="argos-bg-layer argos-method-galaxy-asteroid argos-method-galaxy-asteroid--2" />
          <span className="argos-bg-layer argos-method-galaxy-asteroid argos-method-galaxy-asteroid--3" />
          <span className="argos-bg-layer argos-method-galaxy-asteroid argos-method-galaxy-asteroid--4" />
          <span className="argos-bg-layer argos-method-galaxy-asteroid argos-method-galaxy-asteroid--5" />
          <span className="argos-bg-layer argos-method-galaxy-asteroid argos-method-galaxy-asteroid--6" />
          <span className="argos-bg-layer argos-method-galaxy-asteroid argos-method-galaxy-asteroid--7" />
          <span className="argos-bg-layer argos-method-galaxy-asteroid argos-method-galaxy-asteroid--8" />
          <span className="argos-bg-layer argos-method-galaxy-rock argos-method-galaxy-rock--1" />
          <span className="argos-bg-layer argos-method-galaxy-rock argos-method-galaxy-rock--2" />
          <span className="argos-bg-layer argos-method-galaxy-rock argos-method-galaxy-rock--3" />
          <span className="argos-bg-layer argos-method-galaxy-rock argos-method-galaxy-rock--4" />
        </>
      )}
      {!isMethodLite && (
        <>
          <span className="argos-bg-layer argos-method-galaxy-comets" />
          <span className="argos-bg-layer argos-method-galaxy-comets argos-method-galaxy-comets--secondary" />
          {!isSection && (
            <span className="argos-bg-layer argos-method-galaxy-comets argos-method-galaxy-comets--tertiary" />
          )}
        </>
      )}
      <span className="argos-bg-layer argos-method-galaxy-grid" />
      <span className="argos-bg-layer argos-method-galaxy-algorithm-veil" />
      <span className="argos-bg-layer argos-method-galaxy-void" />
      <span className="argos-bg-layer argos-method-galaxy-readability" />
    </div>
  );
}
