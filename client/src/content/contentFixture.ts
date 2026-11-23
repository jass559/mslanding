/**
 * The public routes supported by the corporate SPA.
 */
export type PublicPath =
  | '/'
  | '/nosotros'
  | '/servicios'
  | '/faq'
  | '/contacto';

export interface NavItem {
  label: string;
  href: PublicPath;
}

export interface CtaContent {
  label: string;
  href: PublicPath | `https://wa.me/${string}`;
}

export interface HeroContent {
  eyebrow: string;
  title: string;
  description: string;
  cta: CtaContent;
  secondaryCta: CtaContent;
}

export interface BenefitContent {
  id: string;
  title: string;
  description: string;
}

export interface FeaturedServiceContent {
  id: string;
  title: string;
  description: string;
  cta: CtaContent;
}

export interface ServiceContent {
  id: string;
  title: string;
  description: string;
  cta: string;
  ctaHref: PublicPath;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ContactFormContent {
  title: string;
  helperText: string;
  labels: {
    fullName: string;
    email: string;
    phone: string;
    service: string;
    message: string;
  };
  serviceOptions: string[];
  requiredFields: Array<'fullName' | 'email' | 'service' | 'message'>;
  optionalFields: Array<'phone'>;
  requiredMarker: string;
  optionalLabel: string;
  submitLabel: string;
  submittingLabel: string;
  successMessage: string;
}

export interface ContactChannel {
  label: string;
  href: `https://wa.me/${string}`;
}

export interface ContentFixture {
  brand: string;
  nav: {
    home: string;
    about: string;
    services: string;
    faq: string;
    contact: string;
    items: NavItem[];
    openMenuLabel: string;
    closeMenuLabel: string;
    mainNavLabel: string;
  };
  home: {
    hero: HeroContent;
    proposition: string;
    benefits: BenefitContent[];
    featuredServices: FeaturedServiceContent[];
    cta: CtaContent;
    ctaTitle: string;
    ctaDescription: string;
  };
  about: {
    title: string;
    identity: string;
    history: string;
    values: Array<{ id: string; title: string; description: string }>;
  };
  services: ServiceContent[];
  faq: {
    title: string;
    items: FaqItem[];
  };
  contact: {
    title: string;
    description: string;
    corporateData: {
      companyName: string;
      whatsappLabel: string;
      whatsappNumber: string;
      whatsappDisplay: string;
      whatsappUrl: `https://wa.me/${string}`;
      schedule: string;
    };
    channels: ContactChannel[];
    whatsappCta: CtaContent;
    form: ContactFormContent;
  };
  footer: {
    companyName: string;
    links: NavItem[];
    description: string;
    navLabel: string;
  };
  messages: {
    api: {
      contactCreated: 'CONTACT_CREATED';
      validationError: 'VALIDATION_ERROR';
      methodNotAllowed: 'METHOD_NOT_ALLOWED';
      rateLimited: 'RATE_LIMITED';
      persistenceError: 'PERSISTENCE_ERROR';
      internalError: 'INTERNAL_ERROR';
    };
    formStates: {
      idle: 'idle';
      editing: 'editing';
      validating: 'validating';
      submitting: 'submitting';
      validationError: 'validationError';
      serverError: 'serverError';
      networkError: 'networkError';
      success: 'success';
    };
  };
}

export const COPY_SOURCE = 'original-feature-request' as const;

/**
 * Approved page copy taken from the original feature request. All page copy
 * below is cleared for publishing.
 */
export const CONTENT_SOURCE_STATUS = {
  source: COPY_SOURCE,
  approvedPageCopyAvailable: true,
  note: 'Approved page copy supplied by the original feature request; fixture fully populated for publishing.',
  unavailableBlocks: [],
} as const;

const publicNavigation: NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Quiénes Somos', href: '/nosotros' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contacto', href: '/contacto' },
];

const whatsappUrl = 'https://wa.me/584162459941' as const;

/**
 * Typed content source consumed by presentation components.
 *
 * Every entry below is literal copy approved in the original feature request.
 */
export const Content_Fixture = {
  brand: 'Multiservicios Sanabria',
  nav: {
    home: 'Inicio',
    about: 'Quiénes Somos',
    services: 'Servicios',
    faq: 'FAQ',
    contact: 'Contacto',
    items: publicNavigation,
    openMenuLabel: 'Abrir menú de navegación',
    closeMenuLabel: 'Cerrar menú de navegación',
    mainNavLabel: 'Navegación principal',
  },
  home: {
    hero: {
      eyebrow: 'Multiservicios Sanabria',
      title: 'Automatiza tus procesos, atiende a tus clientes 24/7 y lleva tu empresa al siguiente nivel.',
      description:
        'En Multiservicios Sanabria diseñamos soluciones informáticas a la medida, flujos de automatización inteligente y asistentes virtuales que eliminan las tareas repetitivas y multiplican la productividad de tu equipo.',
      cta: { label: 'Agendar una asesoría gratuita', href: '/contacto' },
      secondaryCta: { label: 'Explorar soluciones', href: '/servicios' },
    },
    proposition: 'Tecnología pensada para personas, no para expertos en sistemas.',
    benefits: [
      {
        id: 'ahorro-tiempo',
        title: 'Ahorro real de tiempo',
        description:
          'Recupera horas valiosas de tu jornada delegando lo operativo a sistemas confiables.',
      },
      {
        id: 'acompanamiento-cercano',
        title: 'Acompañamiento cercano',
        description:
          'Hablamos tu mismo idioma. Te guiamos desde la idea inicial hasta que todo esté funcionando sin fricciones.',
      },
      {
        id: 'escalabilidad-segura',
        title: 'Escalabilidad segura',
        description:
          'Nuestras soluciones crecen al ritmo de tu empresa sin que tengas que multiplicar tu nómina operativa.',
      },
    ],
    featuredServices: [
      {
        id: 'chatbots-asistentes',
        title: 'Chatbots y Asistentes Virtuales',
        description:
          'No pierdas ni una sola venta por tardar en responder. Implementamos bots inteligentes en WhatsApp y tu web capaces de atender, calificar prospectos y agendar citas de forma natural las 24 horas.',
        cta: { label: 'Conocer más', href: '/servicios' },
      },
      {
        id: 'automatizacion-procesos',
        title: 'Automatización de Procesos',
        description:
          'Conectamos tus herramientas actuales para que los datos fluyan solos. Facturación, reportes, seguimiento de clientes y tareas administrativas en piloto automático y sin errores humanos.',
        cta: { label: 'Conocer más', href: '/servicios' },
      },
      {
        id: 'soluciones-medida',
        title: 'Soluciones Informáticas a la Medida',
        description:
          'Desarrollamos software, integraciones y soporte técnico especializado adaptado exactamente a la forma en que opera tu negocio, no al revés.',
        cta: { label: 'Conocer más', href: '/servicios' },
      },
    ],
    cta: { label: 'Hablar con un especialista', href: whatsappUrl },
    ctaTitle: '¿Listo para modernizar la operación de tu empresa?',
    ctaDescription:
      'Cuéntanos qué procesos te están quitando tiempo hoy y diseñaremos una solución práctica para resolverlo.',
  },
  about: {
    title: 'Impulsamos la evolución digital de empresas con visión de futuro.',
    identity:
      'Multiservicios Sanabria nació con una convicción clara: las herramientas de automatización e inteligencia artificial no deberían ser exclusivas de las grandes corporaciones.',
    history:
      'Trabajamos mano a mano con empresas y emprendedores para transformar operaciones lentas y manuales en sistemas ágiles, rentables y fáciles de usar. Nuestra misión es brindar soluciones informáticas, automatizaciones y asistentes virtuales de alto impacto que simplifiquen la gestión diaria de nuestros clientes y potencien su rentabilidad. Nuestra visión es ser el aliado tecnológico de referencia para las empresas que buscan innovar, optimizar sus recursos y ofrecer experiencias de atención excepcionales.',
    values: [
      {
        id: 'cercania',
        title: 'Cercanía',
        description: 'Escuchamos antes de proponer. Cada empresa tiene su propia esencia.',
      },
      {
        id: 'eficiencia',
        title: 'Eficiencia',
        description:
          'Buscamos el camino más directo, estable y rentable para resolver cada reto técnico.',
      },
      {
        id: 'compromiso',
        title: 'Compromiso',
        description:
          'No solo entregamos un sistema; aseguramos que funcione y genere valor real día tras día.',
      },
    ],
  },
  services: [
    {
      id: 'chatbots-whatsapp-web',
      title: 'Chatbots Inteligentes para WhatsApp y Web',
      description:
        'Transforma tu atención al cliente con asistentes virtuales entrenados con la información de tu negocio. Responden dudas frecuentes, envían catálogos, califican clientes potenciales y derivan los casos complejos a tu equipo humano en el momento justo. Beneficio clave: respuestas inmediatas 24/7 y mayor tasa de conversión de ventas.',
      cta: 'Cotizar mi Chatbot',
      ctaHref: '/contacto',
    },
    {
      id: 'automatizacion-workflows',
      title: 'Automatización de Flujos de Trabajo (Workflows)',
      description:
        'Eliminamos el trabajo manual de copiar y pegar datos entre plataformas. Integramos tu CRM, hojas de cálculo, correo electrónico, pasarelas de pago y sistemas internos para que cada acción dispare el siguiente paso automáticamente. Beneficio clave: cero errores por distracción y reducción drástica en tiempos operativos.',
      cta: 'Automatizar mis procesos',
      ctaHref: '/contacto',
    },
    {
      id: 'desarrollo-corporativo',
      title: 'Desarrollo y Soluciones Informáticas Corporativas',
      description:
        'Creamos plataformas web, paneles administrativos, APIs e integraciones personalizadas cuando las herramientas comerciales se quedan cortas para las necesidades específicas de tu empresa. Beneficio clave: control total sobre tu información y procesos exclusivos.',
      cta: 'Consultar proyecto a medida',
      ctaHref: '/contacto',
    },
    {
      id: 'consultoria-optimizacion',
      title: 'Consultoría y Optimización Tecnológica',
      description:
        'Auditamos tus herramientas digitales actuales para detectar fugas de tiempo, mejorar la seguridad de tus datos y trazar una hoja de ruta clara hacia la digitalización de tu negocio. Beneficio clave: inversión tecnológica inteligente con retorno medible.',
      cta: 'Solicitar diagnóstico',
      ctaHref: '/contacto',
    },
  ],
  faq: {
    title: 'Preguntas Frecuentes',
    items: [
      {
        id: 'faq-conocimientos-tecnicos',
        question: '¿Necesito tener conocimientos técnicos para usar los chatbots o automatizaciones?',
        answer:
          'En absoluto. Nosotros nos encargamos de toda la arquitectura técnica, configuración y puesta en marcha. Te entregamos una solución lista para usar, intuitiva y con una capacitación breve para tu equipo.',
      },
      {
        id: 'faq-chatbots-roboticos',
        question: '¿Los chatbots suenan muy robóticos con mis clientes?',
        answer:
          'No. Diseñamos flujos conversacionales naturales y amigables, utilizando procesamiento de lenguaje moderno para que tus clientes sientan que reciben una atención cálida, rápida y resolutiva.',
      },
      {
        id: 'faq-tiempo-implementacion',
        question: '¿Cuánto tiempo toma implementar una automatización o un chatbot?',
        answer:
          'Depende de la complejidad, pero la mayoría de los asistentes virtuales y automatizaciones iniciales están operativos en un plazo de 1 a 3 semanas.',
      },
      {
        id: 'faq-soporte-post-entrega',
        question: '¿Ofrecen soporte después de entregar el proyecto?',
        answer:
          'Sí. Contamos con planes de mantenimiento, monitoreo y ajustes continuos para garantizar que tus sistemas evolucionen junto con los cambios de tu empresa.',
      },
    ],
  },
  contact: {
    title: 'Hablemos sobre cómo impulsar tu empresa',
    description:
      'Completa el formulario o escríbenos directamente por WhatsApp. Estamos listos para escucharte y proponerte la mejor solución.',
    corporateData: {
      companyName: 'Multiservicios Sanabria',
      whatsappLabel: 'WhatsApp Directo',
      whatsappNumber: '584162459941',
      whatsappDisplay: '+58 416-2459941',
      whatsappUrl,
      schedule: 'Lunes a Viernes, de 8:00 AM a 6:00 PM',
    },
    channels: [{ label: 'WhatsApp', href: whatsappUrl }],
    whatsappCta: { label: 'WhatsApp', href: whatsappUrl },
    form: {
      title: 'Envíanos tu solicitud',
      helperText: 'Completa los campos para enviar tu solicitud.',
      labels: {
        fullName: 'Nombre completo',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        service: 'Servicio de interés',
        message: 'Mensaje',
      },
      serviceOptions: [
        'Chatbot para WhatsApp / Web',
        'Automatización de procesos empresariales',
        'Desarrollo web o software a la medida',
        'Consultoría y soporte informático',
        'Otro requerimiento',
      ],
      requiredFields: ['fullName', 'email', 'service', 'message'],
      optionalFields: ['phone'],
      requiredMarker: '*',
      optionalLabel: '(opcional)',
      submitLabel: 'Enviar solicitud',
      submittingLabel: 'Enviando…',
      successMessage:
        '¡Gracias por escribirnos! Hemos recibido tus datos correctamente. Un especialista de Multiservicios Sanabria se pondrá en contacto contigo muy pronto.',
    },
  },
  footer: {
    companyName: 'Multiservicios Sanabria',
    links: publicNavigation,
    description:
      'Tecnología que trabaja por ti, para que tú te enfoques en hacer crecer tu negocio.',
    navLabel: 'Enlaces del pie de página',
  },
  messages: {
    api: {
      contactCreated: 'CONTACT_CREATED',
      validationError: 'VALIDATION_ERROR',
      methodNotAllowed: 'METHOD_NOT_ALLOWED',
      rateLimited: 'RATE_LIMITED',
      persistenceError: 'PERSISTENCE_ERROR',
      internalError: 'INTERNAL_ERROR',
    },
    formStates: {
      idle: 'idle',
      editing: 'editing',
      validating: 'validating',
      submitting: 'submitting',
      validationError: 'validationError',
      serverError: 'serverError',
      networkError: 'networkError',
      success: 'success',
    },
  },
} satisfies ContentFixture;

/** Lower-camel alias for components that follow normal value naming. */
export const contentFixture = Content_Fixture;