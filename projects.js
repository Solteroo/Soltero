// ═══════════════════════════════════════════════════════════
//  projects.js — Soltero Dev | Project Data Layer
//  Add / edit projects only here. All pages use this file.
// ═══════════════════════════════════════════════════════════

const PROJECTS = [
  {
    id: 1,
    category: "web",          // web | ai | mobile | automation
    year: 2026,
    status: "live",           // live | wip | private
    image: "https://solteroo.github.io/Soltero/soltero.png",
    url: "https://solteroo.github.io/Soltero/index.html",
    tech: ["React", "Node.js", "Tailwind"],
    title: { tk: "Soltero Dev Portfolio", en: "Soltero Dev Portfolio", ru: "Soltero Dev Portfolio" },
    desc: {
      tk: "Şahsy portfolio saýty — Hyzmatlar, taslamalar we aragatnaşyk bölümleri bolan doly PWA goldawly portfolio.",
      en: "Personal portfolio website with services, projects and contact sections. Full PWA support.",
      ru: "Личный портфолио сайт с разделами услуг, проектов и контактов. Полная PWA поддержка."
    }
  },
  {
    id: 2,
    category: "web",
    year: 2026,
    status: "live",
    image: "https://solteroo.github.io/Soltero/barber.webp",
    url: "https://barsal.base44.app/",
    tech: ["React", "Node.js", "Tailwind"],
    title: { tk: "Barber & Salon web sahypasy", en: "Barbershop website", ru: "Сайт Барбершопа" },
    desc: {
    tk: "Professional barber salon web sahypa. Müşderiler üçin hyzmatlar, onlaýn bron we arassa, häzirki zaman UI dizaýn.",
    en: "Professional barbershop website with services, online booking and clean modern UI design for customers.",
    ru: "Профессиональный сайт барбершопа с услугами, онлайн-записью и чистым современным UI дизайном."
    }
  },
  {
    id: 3,
    category: "mobile",
    year: 2026,
    status: "live",
    image: "https://solteroo.github.io/Soltero/gamehub.png",
    url: "https://solteroo.github.io/Gamehub/",
    tech: ["React Native", "Firebase", "Redux"],
    title: { tk: "Kompýuter Oýunlary", en: "PC Games Mobile App", ru: "Мобильное приложение для пс игры" },
    desc: {
    tk: "Oýun platformasy: iOS we Android üçin oýun katalogy, onlaýn mümkinçilikler we oýunlaryň yzarlaýyş ulgamy.",
    en: "Gaming platform for iOS & Android. Game catalog, online features and game tracking system.",
    ru: "Игровая платформа для iOS и Android. Каталог игр, онлайн-функции и система отслеживания."
      }
  },
  {
    id: 4,
    category: "ai",
    year: 2026,
    status: "live",
    image: "https://solteroo.github.io/Soltero/bot.png",
    url: "https://t.me/solterodev_bot",
    tech: ["Python", "Telegram Bot API", "Selenium"] ,
    title: { tk: "Telegram AI Boty", en: "Telegram AI Bot", ru: "Telegram Бот ИИ" },
    desc: {
    tk: "AI bilen işleýän Telegram boty. Habarlaşma, awtomatlaşdyrylan jogaplar, tertipnama dolandyryşy we maglumat işlemleri üçin döredilen.",
    en: "AI-powered Telegram bot for messaging automation, smart replies, scheduling and data processing tasks.",
    ru: "Telegram-бот на базе ИИ для автоматизации сообщений, умных ответов, управления расписанием и обработки данных."
     }
  },
  {
    id: 5,
    category: "web",
    year: 2026,
    status: "live",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80",
    url: "#",
    tech: ["Next.js", "Supabase", "TypeScript"],
    title: { tk: "SaaS Dolandyryş Paneli", en: "SaaS Dashboard", ru: "SaaS Панель Управления" },
    desc: {
      tk: "Kärhanalar üçin analitika we dolandyryş paneli. Hakyky wagtda statistika we hasabat beriş.",
      en: "Analytics and admin dashboard for businesses. Real-time statistics and reporting.",
      ru: "Аналитическая панель управления для бизнеса. Статистика в реальном времени и отчётность."
    }
  },
  {
    id: 6,
    category: "ai",
    year: 2026,
    status: "live",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    url: "#",
    tech: ["Python", "TensorFlow", "Flask"],
    title: { tk: "Surat Tanama Ulgamy", en: "Image Recognition System", ru: "Система Распознавания Изображений" },
    desc: {
      tk: "Önümleri we adamlary tanamagy başarýan emeli intellekt ulgamy. 98% takyklyk derejesi.",
      en: "AI system for recognizing products and people. 98% accuracy rate.",
      ru: "ИИ-система для распознавания товаров и людей. Точность 98%."
    }
  }
];

// Category metadata
const CATEGORIES = {
  all:        { tk: "Ähli",             en: "All",        ru: "Все"           },
  web:        { tk: "Web",              en: "Web",        ru: "Web"           },
  ai:         { tk: "AI",               en: "AI",         ru: "AI"            },
  mobile:     { tk: "Mobil",            en: "Mobile",     ru: "Мобил"         },
  automation: { tk: "Awto",             en: "Auto",       ru: "Авто" }
};

const STATUS_LABELS = {
  live:    { tk: "Görmek",       en: "View Live",    ru: "Смотреть"   },
  wip:     { tk: "Dowam edýär",  en: "In Progress",  ru: "В процессе" },
  private: { tk: "Hususy",       en: "Private",      ru: "Приватный"  }
};

const CAT_COLORS = {
  web:        { bg: "rgba(42,171,238,.1)",  border: "rgba(42,171,238,.25)",  text: "#2aabee",  glow: "rgba(42,171,238,.2)"  },
  ai:         { bg: "rgba(167,139,250,.1)", border: "rgba(167,139,250,.25)", text: "#a78bfa",  glow: "rgba(167,139,250,.2)" },
  mobile:     { bg: "rgba(61,210,138,.1)",  border: "rgba(61,210,138,.25)",  text: "#3DD28A",  glow: "rgba(61,210,138,.2)"  },
  automation: { bg: "rgba(251,191,36,.1)",  border: "rgba(251,191,36,.25)",  text: "#fbbf24",  glow: "rgba(251,191,36,.2)"  }
};
