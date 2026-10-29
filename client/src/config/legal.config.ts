import type { SiteLegalConfig } from "@/lib/legal/types";

// Оператор и контакты — те же, что в next-portfolio-аdvertising (src/config/site.config.ts).
// При изменении реквизитов обновлять оба проекта и поднимать редакцию документов.
export const legalConfig: SiteLegalConfig = {
  operator: {
    kind: "individual",
    fullName: "Вронский Виталий Федорович",
    shortName: "Вронский В.Ф.",
    inn: "505029904347",
    ogrn: null,
    kpp: null,
    legalAddress:
      "142072, город Домодедово, микрорайон Востряково, улица Донская, дом 1, квартира 251",
    actualAddress:
      "город Домодедово, микрорайон Востряково, улица Донская, дом 1, квартира 251",
  },

  contacts: {
    email: "vronskyvitaly@gmail.com",
    privacyEmail: "vronskyvitaly@gmail.com",
    phone: "+7 (925) 131-31-78",
    postalAddress:
      "142072, город Домодедово, микрорайон Востряково, улица Донская, дом 1, квартира 251",
  },

  site: {
    domain: "todo.vronskyvitaly.ru",
    url: "https://todo.vronskyvitaly.ru",
    name: "TodoList — менеджер задач и Kanban-досок",
  },

  rkn: {
    submitted: true,
    registryNumber: "100349765",
    registeredAt: "2026-07-13",
  },

  dataLocalizedInRussia: true,

  crossBorderTransfer: {
    enabled: true,
    countries: [
      "США (Google LLC, Apple Inc., Mozilla Corporation — доставка push-уведомлений, только для пользователей, включивших уведомления)",
    ],
  },

  dataSubjects: [
    "зарегистрированные пользователи Сервиса",
    "посетители Сервиса, в том числе открывшие публичную ссылку на заметки доски",
  ],

  purposes: [
    {
      id: "account",
      title:
        "Регистрация и авторизация в Сервисе, хранение и синхронизация задач, досок и заметок Пользователя",
      dataCategories: [
        "адрес электронной почты",
        "пароль (хранится только в виде криптографического хэша)",
        "данные, которые Пользователь самостоятельно вносит в задачи, доски и заметки",
      ],
      legalBasis: "consent",
      retention: "до удаления учётной записи либо отзыва согласия",
    },
    {
      id: "push",
      title: "Отправка push-уведомлений с напоминаниями о задачах",
      dataCategories: [
        "идентификатор push-подписки браузера и ключи шифрования",
        "название задачи и время напоминания",
      ],
      legalBasis: "consent",
      retention: "до отключения уведомлений, удаления учётной записи либо отзыва согласия",
    },
  ],

  processors: [
    {
      name: "Coolify (VPS-хостинг, сервер в РФ)",
      purpose: "размещение Сервиса и хранение данных",
      dataCategories: ["все категории персональных данных, обрабатываемые в Сервисе"],
      country: "Российская Федерация",
    },
    {
      name: "Google LLC (Firebase Cloud Messaging), Apple Inc. (Apple Push Notification service), Mozilla Corporation (Mozilla Push Service) — в зависимости от браузера Пользователя",
      purpose: "доставка push-уведомлений на устройство Пользователя",
      dataCategories: [
        "идентификатор push-подписки",
        "содержимое уведомления в зашифрованном виде",
      ],
      country: "США",
    },
  ],

  cookies: [
    {
      name: "token",
      category: "essential",
      provider: "Сервис",
      purpose: "авторизация Пользователя и защита закрытых страниц",
      lifetime: "7 дней либо до выхода из учётной записи",
    },
  ],

  localStorage: [
    {
      name: "token",
      category: "essential",
      provider: "Сервис",
      purpose: "авторизация при подключении к серверу",
      lifetime: "до выхода из учётной записи",
    },
    {
      name: "user",
      category: "essential",
      provider: "Сервис",
      purpose: "идентификатор и адрес электронной почты текущего пользователя для отображения в интерфейсе",
      lifetime: "до выхода из учётной записи",
    },
  ],

  revisions: {
    "privacy-policy": { effectiveDate: "2026-10-29", version: "1.0" },
    "personal-data-consent": { effectiveDate: "2026-10-29", version: "1.0" },
    "cookie-policy": { effectiveDate: "2026-10-29", version: "1.0" },
    "terms-of-use": { effectiveDate: "2026-10-29", version: "1.0" },
  },
};
