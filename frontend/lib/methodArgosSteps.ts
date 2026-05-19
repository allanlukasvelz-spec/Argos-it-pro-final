import type { ServiceSlug } from "@/lib/services";

export const METHOD_ARGOS_SLUGS = ["analizar", "reforzar", "guiar", "optimizar", "supervisar"] as const;

export type MethodArgosSlug = (typeof METHOD_ARGOS_SLUGS)[number];

export type MethodStepCta =
  | { type: "diagnostic"; label: string }
  | { type: "contact"; label: string }
  | { type: "services"; label: string; href?: string }
  | { type: "register"; label: string }
  | { type: "login"; label: string };

export type MethodFaqItem = {
  question: string;
  answer: string;
};

export type MethodArgosStep = {
  order: number;
  slug: MethodArgosSlug;
  letter: string;
  name: string;
  path: string;
  seoTitle: string;
  description: string;
  h1: string;
  subtitle: string;
  valuePhrase: string;
  primaryCta: MethodStepCta;
  secondaryCta: MethodStepCta;
  meaning: string;
  problems: string[];
  warningSigns: string[];
  argosActions: string[];
  results: string[];
  diagnosticRelation: string;
  relatedServiceSlugs: ServiceSlug[];
  portalCopy: {
    title: string;
    body: string;
  };
  processSteps: string[];
  faq: MethodFaqItem[];
  prevSlug: MethodArgosSlug | null;
  nextSlug: MethodArgosSlug | null;
};

export const METHOD_ARGOS_STATIC_SLUGS: MethodArgosSlug[] = [...METHOD_ARGOS_SLUGS];

const steps: MethodArgosStep[] = [
  {
    order: 1,
    slug: "analizar",
    letter: "A",
    name: "Analizar",
    path: "/metodo/analizar",
    seoTitle: "Analizar (A) | Método ARGOS-IT",
    description:
      "Fase Analizar: entender el estado real de tu entorno digital antes de decidir presupuesto, proveedores o cambios estructurales.",
    h1: "Analizar antes de decidir",
    subtitle:
      "Pasamos de intuiciones y suposiciones a una fotografía ordenada de riesgos, dependencias y prioridades, alineada con tu operación y tus objetivos.",
    valuePhrase:
      "Decisiones con información: menos sorpresas, menos costes rectificativos y una hoja de ruta que el equipo directivo puede entender y defender.",
    primaryCta: { type: "diagnostic", label: "Iniciar diagnóstico ARGOS" },
    secondaryCta: { type: "contact", label: "Enviar consulta prioritaria" },
    meaning:
      "Analizar es el contrapeso a la improvisación: reunimos hechos sobre web, sistemas de trabajo, seguridad, rendimiento, integraciones livianas y puntos donde la información es sensible. El objetivo no es emitir un informe ornamental, sino clarificar qué está estabilizado, qué es frágil y qué debe abordarse primero según impacto para el negocio.",
    problems: [
      "Inversión o cambios de plataforma sin una lectura previa del riesgo, la deuda operativa y las dependencias actuales.",
      "Incidencias que se repiten porque nunca se documentó el origen, los responsables ni el alcance real del sistema.",
      "Ausencia de criterios compartidos entre dirección y operación: cada uno mide el éxito con métricas distintas o inexistentes.",
      "Exposición silenciosa: accesos amplios, configuraciones por defecto o procesos que dependen de una sola persona o cuenta.",
      "Obstáculos de rendimiento y captación que se perciben como \"cosas de la web\" sin conectar con procesos internos o datos de negocio."
    ],
    warningSigns: [
      "Nadie puede explicar con precisión quién administra dominios, DNS, accesos críticos o copias de recuperación.",
      "Cuando falla algo, la resolución depende de memoria informal o de hilos dispersos sin una cadena clara de decisión.",
      "Existen plazos de negocio (campañas, cierres, auditorías) y la tecnología asociada no ha sido revisada con antelación.",
      "Se han acumulado integraciones, formularios o automatizaciones sin un mapa de quién las mantiene.",
      "La dirección pide \"más digitalización\" sin saber qué parte de la carga real es técnica y qué parte es proceso.",
      "El proveedor actual propone ampliaciones sin que internamente exista una línea base verificada del estado actual."
    ],
    argosActions: [
      "Inventariar activos relevantes para el negocio: presencia digital, puntos de contacto con clientes, flujos internos críticos y accesos.",
      "Contrastar configuración, permisos, copias de recuperación y prácticas mínimas de seguridad frente a una operación prudente.",
      "Evaluar rendimiento percibido, fricción en formularios o vías de contacto, y coherencia entre lo prometido al cliente y lo sostenible técnicamente.",
      "Priorizar hallazgos por impacto y urgencia: qué puede esperar, qué no debe esperar, y qué depende de decisiones de negocio.",
      "Entregar una lectura ejecutiva y una versión técnica suficiente para contratar, internalizar o replanificar sin perder el hilo."
    ],
    results: [
      "Un diagnóstico accionable: lista priorizada de riesgos, brechas y oportunidades con lenguaje claro para dirección y operación.",
      "Menor dispersión: menos reuniones inconclusas y menos propuestas que no encajan con la realidad medida.",
      "Base sólida para presupuestar mejoras, negociar con proveedores o redistribuir responsabilidades internas.",
      "Reducción de sorpresas en campañas, lanzamientos o cierres contables ligados a sistemas digitales.",
      "Criterio compartido sobre qué es \"suficientemente seguro\" y qué requiere actuación inmediata.",
      "Contexto listo para encajar la fase Reforzar sin solapar trabajos ni duplicar costes."
    ],
    diagnosticRelation:
      "El diagnóstico ARGOS es la puerta natural a esta fase: estructura preguntas y revisión para que no quede nada crítico en zona gris antes de comprometer recursos.",
    relatedServiceSlugs: ["auditoria-digital", "consultoria-it"],
    portalCopy: {
      title: "Cómo encaja el área privada para clientes después de analizar",
      body:
        "Cuando los hallazgos ya están ordenados, muchos equipos prefieren centralizar acuerdos, entregables y siguientes pasos en un solo espacio. Si trabajas con nosotros de forma recurrente, el acceso al área privada te permite seguir solicitudes y documentación sin perder contexto entre correos sueltos."
    },
    processSteps: [
      "Reunión breve de contexto: objetivos de negocio, plazos sensibles y responsables internos.",
      "Recopilación segura de evidencias y revisión técnica sin interrumpir la operación cotidiana.",
      "Síntesis de riesgos y oportunidades con clasificación por impacto y esfuerzo relativo.",
      "Sesión de lectura con dirección: decisiones explícitas sobre prioridades y próximos movimientos.",
      "Plan de transición a Reforzar (o a la siguiente fase acordada) con responsables y criterios de verificación."
    ],
    faq: [
      {
        question: "¿Es imprescindible un diagnóstico antes de contratar desarrollos o cambios grandes?",
        answer:
          "No siempre en forma exhaustiva, pero sí es prudente tener una línea base. Sin ella es fácil duplicar trabajo, heredar problemas o firmar alcances que no resuelven el origen del fallo."
      },
      {
        question: "¿Cuánto tiempo suele requerir esta fase?",
        answer:
          "Depende del tamaño del entorno y de la calidad de la información disponible. Lo habitual es avanzar por hitos claros: contexto, revisión, priorización y handoff, sin alargar lo innecesario."
      },
      {
        question: "¿Recibimos solo un informe o también orientación práctica?",
        answer:
          "Ambos: documentación suficiente para decidir y criterios prácticos sobre qué hacer primero, qué puede esperar y qué requiere validación interna adicional."
      },
      {
        question: "¿Podemos limitar el alcance a un solo ámbito (por ejemplo, presencia digital o seguridad)?",
        answer:
          "Sí. Aun así conviene explicitar fronteras para no ignorar dependencias evidentes que afecten al resultado (por ejemplo, accesos o DNS si lo digital es el foco)."
      },
      {
        question: "¿Qué diferencia esta fase de una auditoría genérica?",
        answer:
          "El encaje con decisiones reales: priorizamos lo que mueve el riesgo operativo o la continuidad del negocio, no listas interminables sin dueño."
      }
    ],
    prevSlug: null,
    nextSlug: "reforzar"
  },
  {
    order: 2,
    slug: "reforzar",
    letter: "R",
    name: "Reforzar",
    path: "/metodo/reforzar",
    seoTitle: "Reforzar (R) | Método ARGOS-IT",
    description:
      "Fase Reforzar: cerrar brechas de seguridad, estabilidad y gobierno básico del acceso antes de escalar cambios o campañas.",
    h1: "Reforzar lo vulnerable",
    subtitle:
      "Endurecemos lo esencial: permisos, copias de recuperación, configuraciones y prácticas mínimas que reducen incidentes evitables y limitan el alcance si algo falla.",
    valuePhrase:
      "Menos superficie de riesgo y más previsibilidad: el entorno deja de ser una sucesión de parches reactivos.",
    primaryCta: { type: "contact", label: "Solicitar refuerzo priorizado" },
    secondaryCta: { type: "services", label: "Ver servicios relacionados", href: "/servicios" },
    meaning:
      "Reforzar traduce el análisis en controles tangibles. No pretende paralizar al negocio con burocracia, sino equilibrar agilidad y prudencia: copias verificables, accesos acotados, actualizaciones razonadas y trazabilidad mínima de cambios sensibles. Es la fase donde muchas empresas recuperan confianza en su propia infraestructura.",
    problems: [
      "Copias de recuperación existentes solo \"en papel\" o nunca restauradas; dependencia de un único punto de fallo.",
      "Cuentas compartidas, permisos amplios o exceso de administradores sin justificación de negocio.",
      "Configuraciones heredadas de instalaciones rápidas, sin revisión periódica ni responsable claro.",
      "Integraciones o formularios expuestos a abuso o fugas de datos por falta de revisión sistemática.",
      "Actualizaciones pospuestas hasta que el incidente obliga a actuar en modo urgencia, con mayor coste y estrés."
    ],
    warningSigns: [
      "Los accesos críticos están concentrados en una persona; si falta, el riesgo operativo es máximo.",
      "No hay pruebas recientes de restauración o simulacros documentados.",
      "Se detectan intentos de acceso indebido, pero no hay un protocolo acordado de respuesta.",
      "Cambios recientes en presencia digital o automatizaciones sin registro ni validación cruzada.",
      "El equipo directivo pregunta por cumplimiento o continuidad y no existen respuestas verificables.",
      "La carga de incidencias crece en paralelo a la ampliación de servicios sin reforzar la base."
    ],
    argosActions: [
      "Aplicar endurecimiento proporcional: cerrar brechas claras sin bloquear procesos legítimos del negocio.",
      "Definir y documentar copias de recuperación, retención prudente y pruebas de restauración según criticidad.",
      "Reordenar permisos, cuentas de servicio y flujos de aprobación en línea con responsabilidades reales.",
      "Alinear formularios, canales de captación y automatizaciones con prácticas de privacidad y seguridad razonables.",
      "Dejar checklist verificable de controles mínimos y responsables internos o externos."
    ],
    results: [
      "Mayor resiliencia ante fallos de hardware, errores humanos o intentos de abuso.",
      "Reducción de incidentes repetitivos ligados a configuración o accesos mal gestionados.",
      "Mejor postura para negociar con aseguradoras, socios o auditores internos cuando existan requisitos explícitos.",
      "Base técnica más limpia para escalar optimización o campañas sin arrastrar deuda crítica.",
      "Equipos con menos ansiedad operativa: saben qué está cubierto y qué queda pendiente consciente."
    ],
    diagnosticRelation:
      "Si el diagnóstico ya identificó brechas, Reforzar ejecuta el cierre ordenado de las prioritarias y deja medido lo que debe vigilarse después.",
    relatedServiceSlugs: ["seguridad-informatica", "mantenimiento-informatico"],
    portalCopy: {
      title: "Orden después del refuerzo",
      body:
        "Los refuerzos dejan tareas verificables y, en muchos casos, decisiones que conviene dejar registradas. El área privada para clientes ayuda a mantener visibles las acciones completadas, las pendientes con dueño y los siguientes hitos sin depender de mensajes sueltos."
    },
    processSteps: [
      "Traducción del análisis a un plan de endurecimiento por lotes (rápidos vs. planificados).",
      "Ejecución controlada con ventanas acordadas y comunicación a usuarios internos cuando aplica.",
      "Verificación: pruebas de restauración, revisión de permisos y validación cruzada de cambios.",
      "Entrega de estado refortalecido con indicadores simples de mantenimiento futuro.",
      "Puente a Guiar para que el día a día no rompa lo reforzado."
    ],
    faq: [
      {
        question: "¿Reforzar significa parar la operación o congelar proyectos?",
        answer:
          "No debería. Se planifica por criticidad y, cuando hace falta, en ventanas acordadas. El objetivo es reducir incidentes, no bloquear ingresos."
      },
      {
        question: "¿Podemos priorizar solo seguridad o solo continuidad?",
        answer:
          "Sí, aunque suelen estar ligados: una copia sólida es continuidad y también mitiga rescates tras incidentes de seguridad."
      },
      {
        question: "¿Qué pasa con el personal que se resiste a perder permisos amplios?",
        answer:
          "Trabajamos roles y justificaciones de negocio. El criterio es mínimo privilegio con excepciones documentadas, no castigo organizativo."
      },
      {
        question: "¿Quién mantiene después el nivel alcanzado?",
        answer:
          "Conviene repartir dueños internos y, si aplica, soporte recurrente. Por eso Reforzar enlaza con Guiar y más adelante con Supervisar."
      },
      {
        question: "¿Incluye formación al equipo?",
        answer:
          "Cuando aporta valor: prácticas básicas, señales de alerta y protocolos sencillos. No sustituye políticas internas, pero las hace creíbles."
      }
    ],
    prevSlug: "analizar",
    nextSlug: "guiar"
  },
  {
    order: 3,
    slug: "guiar",
    letter: "G",
    name: "Guiar",
    path: "/metodo/guiar",
    seoTitle: "Guiar (G) | Método ARGOS-IT",
    description:
      "Fase Guiar: convertir complejidad operativa en claridad — solicitudes, prioridades, responsables y comunicación sin ruido.",
    h1: "Guiar de la complejidad a la claridad",
    subtitle:
      "Cuando la tecnología ya no es un capítulo único sino muchos frentes simultáneos, hace falta gobierno liviano: criterios de prioridad, canales claros y trazabilidad sin colapsar al equipo.",
    valuePhrase:
      "Menos urgencias artificiales: las decisiones visibles, las peticiones en contexto y el avance medible.",
    primaryCta: { type: "contact", label: "Organizar mi operación digital" },
    secondaryCta: { type: "register", label: "Crear acceso al área de clientes" },
    meaning:
      "Guiar no es microgestionar: es dar estructura para que dirección, operación y soporte compartan la misma foto de lo prioritario. Centralizamos solicitudes, estados y acuerdos con un ritmo profesional, evitando que todo sea \"crítico\" o que desaparezca el hilo entre cambios de personal o proveedores.",
    problems: [
      "Múltiples canales (mensajería, correo, llamadas) sin reglas: lo urgente tapa lo importante y se pierde contexto.",
      "Falta de dueños claros para cada tipo de incidencia o mejora: todo cae en la misma persona simplemente porque \"sabe más\".",
      "Documentación inexistente o dispersa: cada resolución parte de cero.",
      "Desalineación entre expectativas de negocio y capacidad real del entorno o del soporte contratado.",
      "Rotación interna o cambios de colaboradores externos que rompen el conocimiento tácito acumulado."
    ],
    warningSigns: [
      "Las reuniones técnicas terminan sin próximos pasos escritos o sin responsable explícito.",
      "Existen listas de pendientes incompatibles entre departamentos.",
      "El volumen de peticiones crece más rápido que la capacidad de clasificarlas.",
      "Se repiten errores porque nadie tiene visibilidad de lo ya intentado.",
      "La dirección descubre tarde proyectos improvisados con impacto transversal."
    ],
    argosActions: [
      "Diseñar un flujo simple de entrada y clasificación de solicitudes alineado con vuestra cultura (sin burocracia innecesaria).",
      "Definir prioridades con criterios de negocio: impacto, plazo legal o contractual, seguridad y visibilidad al cliente.",
      "Documentar decisiones relevantes y dejar plantillas livianas para cambios recurrentes.",
      "Acompañar en la adopción: roles, ritos breves de seguimiento y acuerdos de escalado.",
      "Integrar herramientas de apoyo (área privada, formularios estructurados) donde aporten claridad real."
    ],
    results: [
      "Colas de trabajo legibles con explicación del porqué de cada prioridad.",
      "Menor dependencia de héroes individuales: el sistema de trabajo sostiene el conocimiento.",
      "Comunicación más adulta entre dirección y operación: menos fricción emocional, más criterio.",
      "Base para escalar proyectos de Optimizar sin que el día a día colapse.",
      "Transición más suave ante cambios de personal o proveedor."
    ],
    diagnosticRelation:
      "Cuando el diagnóstico revela dispersión operativa, Guiar implementa el marco mínimo para que las mejoras no se pierdan entre mensajes sueltos.",
    relatedServiceSlugs: ["consultoria-it", "mantenimiento-informatico"],
    portalCopy: {
      title: "Portal y formularios como parte del gobierno diario",
      body:
        "El área privada para clientes y los formularios estructurados no son un adorno: consolidan solicitudes, historial y acuerdos. Esta fase es donde suele notarse más el valor de tener un solo sitio para ver qué está en curso, qué está bloqueado y qué falta por decidir."
    },
    processSteps: [
      "Diagnóstico operativo rápido: canales, cuellos de botella y expectativas reales.",
      "Diseño del flujo acordado y pilotaje con un volumen manejable de solicitudes.",
      "Ajuste de plantillas, estados y responsables según lo aprendido en el piloto.",
      "Formación breve a puntos de contacto internos para mantener disciplina mínima.",
      "Revisión trimestral o mensual (según ritmo) para evitar regresiones al caos."
    ],
    faq: [
      {
        question: "¿Esto es ITIL o un sistema pesado de tickets?",
        answer:
          "No por defecto. Es un gobierno liviano adaptado a vuestra escala: suficiente núcleo para no perder el hilo, sin convertir cada paso en un trámite."
      },
      {
        question: "¿Si ya usamos otro canal, hay que abandonarlo?",
        answer:
          "No necesariamente. Lo importante es acordar qué canal manda para qué tipo de petición y cómo se archiva la decisión."
      },
      {
        question: "¿Cuánto tiempo tarda verse impacto?",
        answer:
          "Suelen notarse cambios en semanas si hay compromiso de dirección y un responsable interno que sostenga el ritual mínimo."
      },
      {
        question: "¿ARGOS-IT se convierte en dirección de proyecto permanente?",
        answer:
          "Podemos liderar transitoriamente el marco; el objetivo es que vuestra organización pueda sostenerlo, con o sin nosotros en segundo plano."
      },
      {
        question: "¿Qué pasa con la confidencialidad de las solicitudes?",
        answer:
          "Se acotan permisos y alcance como en cualquier buen servicio profesional: solo quien debe intervenir ve el detalle necesario."
      }
    ],
    prevSlug: "reforzar",
    nextSlug: "optimizar"
  },
  {
    order: 4,
    slug: "optimizar",
    letter: "O",
    name: "Optimizar",
    path: "/metodo/optimizar",
    seoTitle: "Optimizar (O) | Método ARGOS-IT",
    description:
      "Fase Optimizar: alinear velocidad, procesos y captación con objetivos de negocio — sin optimizar métricas vanas.",
    h1: "Optimizar con criterio de negocio",
    subtitle:
      "Mejoramos lo que mueve resultados: experiencia real de usuario, tiempo de respuesta percibido, claridad en formularios y automatización donde reduce fricción interna.",
    valuePhrase:
      "Eficiencia que se nota en productividad y en conversión, no solo en gráficos aislados.",
    primaryCta: { type: "diagnostic", label: "Priorizar mejoras con diagnóstico" },
    secondaryCta: { type: "services", label: "Explorar automatización y presencia digital", href: "/servicios" },
    meaning:
      "Optimizar es donde el entorno ya es estable y gobernado lo suficiente como para evolucionar sin cavar nuevos agujeros. Traducimos objetivos comerciales en cambios técnicos medibles, evitando proyectos que lucen bien en presentación pero no alteran el embudo, el coste operativo o la calidad del dato.",
    problems: [
      "Webs o canales digitales lentos o confusos que erosionan la confianza antes del primer contacto humano.",
      "Procesos internos manuales que consumen horas de personas clave sin aportar diferenciación.",
      "Automatizaciones mal enlazadas que duplican datos o generan excepciones constantes.",
      "SEO o contenidos desalineados con la propuesta real de servicio: traen tráfico que no convierte.",
      "Herramientas inconexas: cada departamento optimiza su isla y el conjunto empeora."
    ],
    warningSigns: [
      "Los formularios tienen abandono alto y no se investiga por fricción vs. propuesta vs. técnica.",
      "Los informes de rendimiento existen, pero nadie los conecta con decisiones de inversión.",
      "Cada nueva campaña añade parches visuales sin arquitectura de conversión coherente.",
      "Se intenta \"automatizar todo\" sin mapa de procesos y termina en trabajo manual de limpieza.",
      "La dirección pide innovación y el cuello de botella real es operativo o de datos."
    ],
    argosActions: [
      "Identificar cuellos de botella de negocio y traducirlos a cambios concretos en la experiencia digital o en procesos.",
      "Optimizar rendimiento percibido, claridad de mensajes y confianza en puntos de captación.",
      "Diseñar automatizaciones con control humano en los puntos de riesgo y trazabilidad suficiente.",
      "Alinear contenidos, llamadas a la acción y seguimiento con la capacidad real de respuesta del equipo.",
      "Definir indicadores mínimos útiles para decidir siguiente iteración, no para llenar tableros."
    ],
    results: [
      "Menos fricción para clientes y partners en los puntos digitales críticos.",
      "Horas recuperadas en equipos internos al eliminar pasos manuales de bajo valor.",
      "Mayor coherencia entre lo que se promete fuera y lo que se puede sostener dentro.",
      "Automatizaciones que se mantienen porque tienen dueño y reglas claras.",
      "Base preparada para supervisión continua sin sorpresas tras cada cambio."
    ],
    diagnosticRelation:
      "El diagnóstico ayuda a no optimizar en falso: señala dónde la base aún es frágil y dónde una mejora sí moverá resultados.",
    relatedServiceSlugs: ["automatizacion-ia", "web-wordpress"],
    portalCopy: {
      title: "Seguimiento de mejoras y peticiones de evolución",
      body:
        "Las optimizaciones generan historias de cambio que deben conservarse. El área privada permite registrar peticiones de evolución, ver el estado de implementaciones y evitar que una mejora reciente se pierda ante un nuevo proveedor o un cambio de equipo interno."
    },
    processSteps: [
      "Definición conjunta de objetivos de negocio y restricciones (plazos, marca, cumplimiento).",
      "Mapa rápido de embudo y procesos internos relacionados con lo digital.",
      "Lotes de implementación priorizados con verificación tras cada despliegue.",
      "Medición mínima acordada y decisión explícita de siguiente iteración.",
      "Handoff a Supervisar para asegurar que los avances se mantienen en el tiempo."
    ],
    faq: [
      {
        question: "¿Optimizar incluye rediseño completo?",
        answer:
          "Solo si es necesario para el objetivo. Muchas veces bastan ajustes focales de mensaje, rendimiento y flujo antes de proyectos grandes."
      },
      {
        question: "¿Cómo evitamos el \"parche eterno\"?",
        answer:
          "Con criterios de salida por lote: cada entrega debe cerrar un problema definido o medir un experimento con tiempo límite."
      },
      {
        question: "¿Qué rol juega la automatización aquí?",
        answer:
          "La aplicamos donde reduce error humano repetitivo o acelera validaciones; no como fin en sí misma."
      },
      {
        question: "¿Podemos optimizar sin haber reforzado antes?",
        answer:
          "A veces en modo acotado, pero es riesgoso construir sobre bases frágiles: puede amplificar incidentes o deuda oculta."
      },
      {
        question: "¿Quién posee los indicadores después?",
        answer:
          "Idealmente dirección y operación comparten una versión mínima comprobable; nosotros ayudamos a definirla y a mantenerla viva en la fase de supervisión."
      }
    ],
    prevSlug: "guiar",
    nextSlug: "supervisar"
  },
  {
    order: 5,
    slug: "supervisar",
    letter: "S",
    name: "Supervisar",
    path: "/metodo/supervisar",
    seoTitle: "Supervisar (S) | Método ARGOS-IT",
    description:
      "Fase Supervisar: acompañamiento tras la mejora — revisiones, vigilancia prudente y ajustes antes de que el problema vuelva a crecer.",
    h1: "Supervisar después de mejorar",
    subtitle:
      "Las mejoras no se congelan solas: hace falta ritmo de revisión, alertas sensatas y conversaciones cortas que corrijan deriva antes de que sea costosa.",
    valuePhrase:
      "Continuidad sin vigilar el reloj: el método convierte la prevención en un hábito organizado, no en ansiedad.",
    primaryCta: { type: "services", label: "Ver mantenimiento y vigilancia", href: "/servicios/mantenimiento-informatico" },
    secondaryCta: { type: "login", label: "Acceder al área de clientes" },
    meaning:
      "Supervisar cierra el ciclo ARGOS: transforma logros puntuales en estabilidad. Vigilamos señales tempranas, contraste de copias, espacio para mejoras incrementales y coherencia con lo acordado en fases anteriores. No es mirar por mirar: es intervenir cuando la tendencia empeora, no cuando ya es emergencia.",
    problems: [
      "Éxitos puntuales que se degradan silenciosamente por falta de ritmo de revisión.",
      "Nuevos bordes del sistema (accesos, integraciones, campañas) que nadie monitoriza.",
      "Dependencia emocional de \"siempre ha funcionado\" hasta que deja de hacerlo en el peor momento.",
      "Pérdida de contexto cuando cambia el equipo interno y no hay continuidad documentada.",
      "Costes crecientes de soporte reactivo que anulan el ahorro logrado en la optimización."
    ],
    warningSigns: [
      "Los informes periódicos dejaron de leerse o nunca existieron.",
      "Las alertas se ignoran por fatiga o por falta de dueño.",
      "Los permisos vuelven a inflarse sin revisión periódica.",
      "Las actualizaciones se acumulan \"para más tarde\" de forma recurrente.",
      "La dirección solo oye de tecnología cuando algo rompe."
    ],
    argosActions: [
      "Definir calendario de revisiones proporcional al riesgo y al ritmo del negocio.",
      "Supervisar copias, espacio disponible, salud básica de servicios y coherencia de accesos.",
      "Mantener un tablero mínimo compartido: qué está verde, ambar o rojo y por qué.",
      "Proponer micro-mejoras antes de que se conviertan en proyectos de rescate.",
      "Ajustar el nivel de soporte según estacionalidad o fases de crecimiento."
    ],
    results: [
      "Curva de incidentes más plana: menos picos graves y menos tiempo en modo urgencia.",
      "Mayor previsibilidad presupuestaria en tecnología y soporte.",
      "Confianza renovada de dirección: ven señales, no solo promesas.",
      "Mejor integración entre mejoras pasadas y nuevas iniciativas.",
      "Organización menos vulnerable a rotación de personas o proveedores."
    ],
    diagnosticRelation:
      "El diagnóstico periódico o focal puede ser parte del ritmo de supervisión para validar que no aparecieron nuevas áreas grises.",
    relatedServiceSlugs: ["mantenimiento-informatico", "auditoria-digital"],
    portalCopy: {
      title: "Supervisión visible desde el área privada",
      body:
        "Las revisiones y estados quedan más útiles cuando se ven en un solo lugar. El acceso para clientes concentra solicitudes abiertas, actualizaciones y acuerdos recientes para que la supervisión no dependa de reconstruir hilos en el correo."
    },
    processSteps: [
      "Acuerdo de ritmo: frecuencia de revisiones, indicadores mínimos y responsables.",
      "Línea base post-mejora: fotografía de lo alcanzado y condiciones de aceptación.",
      "Revisiones breves documentadas con decisiones explícitas.",
      "Ventana anual o semestral para reevaluar riesgos y oportunidades.",
      "Reconexión con Analizar si el negocio cambia de escenario de forma relevante."
    ],
    faq: [
      {
        question: "¿Supervisar es lo mismo que soporte 24/7?",
        answer:
          "No necesariamente. Se define cobertura según criticidad: algunas organizaciones necesitan ventanas amplias; otras, un ritmo fijo de revisión y punta de contacto clara."
      },
      {
        question: "¿Qué ocurre si ignoramos esta fase tras un gran proyecto?",
        answer:
          "Es común ver regresión en meses: permisos relajados, actualizaciones acumuladas o integraciones nuevas sin dueño. Supervisar evita convertir cada mejora en deuda futura."
      },
      {
        question: "¿Podemos alternar intensidad según temporada?",
        answer:
          "Sí. Lo importante es que los cambios de intensidad sean explícitos, no accidentales."
      },
      {
        question: "¿Cómo se relaciona con cumplimiento o auditorías externas?",
        answer:
          "Un ritmo de supervisión ordenado facilita evidencias: fechas, revisiones, responsables y acciones tomadas."
      },
      {
        question: "¿Cuándo volvemos a Analizar?",
        answer:
          "Cuando hay cambio relevante de modelo de negocio, adquisiciones, cambio masivo de plataforma o señales de que el mapa de riesgo quedó obsoleto."
      }
    ],
    prevSlug: "optimizar",
    nextSlug: null
  }
];

const bySlug = new Map<MethodArgosSlug, MethodArgosStep>(steps.map((s) => [s.slug, s]));

export function getMethodArgosStep(slug: string): MethodArgosStep | undefined {
  if (!METHOD_ARGOS_SLUGS.includes(slug as MethodArgosSlug)) return undefined;
  return bySlug.get(slug as MethodArgosSlug);
}

export function getAllMethodArgosSteps(): MethodArgosStep[] {
  return steps;
}
