export type ChicoTip = {
  id: string;
  titulo: string;
  mensajeCorto: string;
  explicacion: string;
  pasos: string[];
  accionRecomendada: string;
};

/**
 * Consejos prácticos para rotación en la tarjeta de Chico (lenguaje claro, sin tecnicismos).
 */
export const chicoTips: readonly ChicoTip[] = [
  {
    id: "revisar-web",
    titulo: "Revisa tu web con frecuencia",
    mensajeCorto: "Entra en tu web como si fueras un cliente y comprueba que todo funcione.",
    explicacion:
      "Tu web es muchas veces el primer contacto entre tu empresa y un cliente. Si hay botones que no funcionan, textos confusos, errores visuales o secciones desactualizadas, puedes perder confianza y oportunidades.",
    pasos: [
      "Abre tu web desde un ordenador.",
      "Abre tu web desde un móvil.",
      "Haz clic en los botones principales.",
      "Revisa que los textos se lean correctamente.",
      "Comprueba que las imágenes carguen bien.",
      "Anota cualquier error para corregirlo."
    ],
    accionRecomendada: "Haz esta revisión al menos una vez al mes."
  },
  {
    id: "formularios-contacto",
    titulo: "Comprueba tus formularios",
    mensajeCorto: "Haz una prueba para confirmar que los mensajes llegan al correo correcto.",
    explicacion:
      "Un formulario que no funciona puede hacer que pierdas clientes sin darte cuenta. Muchas empresas creen que no reciben consultas, cuando en realidad el problema está en el envío del formulario.",
    pasos: [
      "Entra en la página de contacto.",
      "Rellena el formulario con datos de prueba.",
      "Envía el mensaje.",
      "Revisa si llega al correo correcto.",
      "Comprueba también la bandeja de spam.",
      "Si no llega, revisa la configuración del formulario."
    ],
    accionRecomendada: "Prueba tus formularios cada pocas semanas."
  },
  {
    id: "contrasenas-seguras",
    titulo: "Usa contraseñas seguras",
    mensajeCorto: "Evita claves simples y usa combinaciones difíciles de adivinar.",
    explicacion:
      "Las contraseñas débiles son una de las formas más comunes de perder acceso a una web, correo o herramienta de empresa. Una contraseña segura reduce mucho el riesgo de accesos no autorizados.",
    pasos: [
      "No uses fechas de nacimiento, nombres o palabras simples.",
      "Crea contraseñas con letras, números y símbolos.",
      "No uses la misma contraseña en todas tus cuentas.",
      "Guarda tus claves en un gestor de contraseñas.",
      "Cambia las contraseñas si sospechas de algún acceso extraño."
    ],
    accionRecomendada: "Revisa las contraseñas importantes cada 3 o 6 meses."
  },
  {
    id: "verificacion-dos-pasos",
    titulo: "Activa la verificación en dos pasos",
    mensajeCorto: "Añade una segunda capa de seguridad a tus cuentas importantes.",
    explicacion:
      "La verificación en dos pasos ayuda a proteger tus cuentas aunque alguien descubra tu contraseña. Normalmente requiere confirmar el acceso con un código en el móvil o una aplicación de seguridad.",
    pasos: [
      "Entra en la configuración de seguridad de tu cuenta.",
      "Busca la opción de verificación en dos pasos.",
      "Actívala con tu móvil o una app de autenticación.",
      "Guarda los códigos de recuperación en un lugar seguro.",
      "Comprueba que puedes iniciar sesión correctamente."
    ],
    accionRecomendada: "Actívala en correo, hosting, WordPress, redes sociales y herramientas de empresa."
  },
  {
    id: "actualizaciones-web",
    titulo: "Mantén tu web actualizada",
    mensajeCorto: "Actualiza tu web, plugins y herramientas para evitar fallos.",
    explicacion:
      "Una web desactualizada puede volverse lenta, insegura o incompatible con nuevas versiones del sistema. Las actualizaciones ayudan a corregir errores y mejorar la seguridad.",
    pasos: [
      "Revisa si hay actualizaciones disponibles.",
      "Haz una copia de seguridad antes de actualizar.",
      "Actualiza plugins, temas y sistema principal.",
      "Comprueba que la web siga funcionando bien.",
      "Si algo falla, restaura la copia o pide soporte."
    ],
    accionRecomendada: "Actualiza con cuidado y nunca sin copia de seguridad."
  },
  {
    id: "copias-seguridad",
    titulo: "Haz copias de seguridad",
    mensajeCorto: "Guarda copias de tu web y datos importantes para poder recuperarlos.",
    explicacion:
      "Las copias de seguridad permiten recuperar tu web si ocurre un error, ataque, borrado accidental o fallo del servidor. Sin copias, puedes perder información importante.",
    pasos: [
      "Comprueba si tu hosting hace copias automáticas.",
      "Guarda una copia antes de hacer cambios importantes.",
      "Asegúrate de guardar archivos y base de datos.",
      "Prueba que la copia pueda restaurarse.",
      "Conserva varias copias de fechas diferentes."
    ],
    accionRecomendada: "Ten siempre una copia reciente disponible."
  },
  {
    id: "velocidad-web",
    titulo: "Revisa la velocidad de tu web",
    mensajeCorto: "Una web lenta puede hacer que los clientes se vayan antes de contactar.",
    explicacion:
      "La velocidad de carga afecta directamente a la experiencia del usuario. Si una página tarda demasiado en abrir, muchas personas abandonan antes de ver tus servicios.",
    pasos: [
      "Abre tu web desde el móvil.",
      "Comprueba cuánto tarda en cargar.",
      "Revisa si las imágenes pesan demasiado.",
      "Evita vídeos o efectos innecesarios en exceso.",
      "Optimiza las secciones más importantes.",
      "Haz pruebas después de cada cambio."
    ],
    accionRecomendada: "Prioriza que la página de inicio y contacto carguen rápido."
  },
  {
    id: "version-movil",
    titulo: "Comprueba la versión móvil",
    mensajeCorto: "Revisa que tu web se vea bien desde teléfonos y tablets.",
    explicacion:
      "Muchos usuarios visitan webs desde el móvil. Si los botones son pequeños, el texto se corta o las imágenes se ven mal, la experiencia del cliente empeora.",
    pasos: [
      "Abre tu web desde un móvil.",
      "Revisa el menú principal.",
      "Comprueba que los botones sean fáciles de tocar.",
      "Mira si los textos se leen sin hacer zoom.",
      "Prueba formularios y enlaces.",
      "Corrige cualquier sección desordenada."
    ],
    accionRecomendada: "Diseña pensando primero en móvil."
  },
  {
    id: "informacion-clara",
    titulo: "Organiza bien la información",
    mensajeCorto: "Explica claramente qué haces, qué ofreces y cómo pueden contactarte.",
    explicacion:
      "Una web debe guiar al usuario. Si la información está desordenada o cuesta entender los servicios, el cliente puede abandonar la página sin contactar.",
    pasos: [
      "Revisa si tu página explica claramente lo que haces.",
      "Coloca los servicios principales en zonas visibles.",
      "Usa títulos claros y directos.",
      "Evita textos demasiado largos o confusos.",
      "Añade botones de contacto fáciles de encontrar.",
      "Elimina información repetida o innecesaria."
    ],
    accionRecomendada: "Haz que cualquier persona entienda tu web en pocos segundos."
  },
  {
    id: "errores-pequenos",
    titulo: "No ignores pequeños errores",
    mensajeCorto: "Un botón roto o un enlace incorrecto puede dar mala imagen.",
    explicacion:
      "Los pequeños fallos pueden parecer detalles menores, pero para un cliente transmiten descuido. Corregirlos mejora la confianza y la imagen profesional de la empresa.",
    pasos: [
      "Haz clic en todos los enlaces importantes.",
      "Comprueba botones de contacto y llamada.",
      "Revisa que no haya textos cortados.",
      "Corrige errores ortográficos.",
      "Mira que las imágenes no estén deformadas.",
      "Anota los fallos y prioriza los más visibles."
    ],
    accionRecomendada: "Corrige primero los errores que afecten al contacto con clientes."
  },
  {
    id: "control-accesos",
    titulo: "Controla quién tiene acceso",
    mensajeCorto: "Revisa qué personas pueden entrar a tu web, correo o herramientas.",
    explicacion:
      "Dar acceso a demasiadas personas puede ser un riesgo. Es importante saber quién puede modificar la web, ver información privada o gestionar herramientas de empresa.",
    pasos: [
      "Revisa los usuarios con acceso a tu web.",
      "Elimina cuentas que ya no se usen.",
      "No compartas una misma cuenta entre varias personas.",
      "Da permisos solo a quien realmente los necesite.",
      "Cambia contraseñas cuando alguien deje de colaborar.",
      "Activa seguridad adicional en cuentas importantes."
    ],
    accionRecomendada: "Revisa los accesos cada cierto tiempo."
  },
  {
    id: "pedir-ayuda",
    titulo: "Pide ayuda antes de que el problema crezca",
    mensajeCorto: "Si notas fallos, lentitud o errores extraños, revísalo cuanto antes.",
    explicacion:
      "Muchos problemas técnicos empiezan con señales pequeñas. Revisarlos pronto puede evitar pérdidas de datos, caídas de la web o problemas con clientes.",
    pasos: [
      "Anota qué error has visto.",
      "Guarda capturas de pantalla si es posible.",
      "Comprueba si el fallo ocurre en móvil y ordenador.",
      "No hagas cambios al azar si no sabes el motivo.",
      "Consulta con soporte técnico o un profesional.",
      "Haz una copia antes de tocar configuraciones importantes."
    ],
    accionRecomendada: "Actúa pronto cuando detectes algo raro."
  }
];
