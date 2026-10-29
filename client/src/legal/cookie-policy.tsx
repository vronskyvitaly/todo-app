import { Callout, Clause, Doc, DocLink, List, Mail, Section, Table, Text } from "@/components/legal/primitives";
import { cookieCategoryLabel, requiresConsent } from "@/lib/legal/format";
import type { CookieEntry, SiteLegalConfig } from "@/lib/legal/types";

function cookieRows(entries: CookieEntry[]) {
  return entries.map((entry) => [entry.name, entry.provider, entry.purpose, entry.lifetime]);
}

export function CookiePolicy({ config }: { config: SiteLegalConfig }) {
  const { contacts, site, cookies, localStorage } = config;

  const essential = cookies.filter((cookie) => !requiresConsent(cookie.category));
  const optional = cookies.filter((cookie) => requiresConsent(cookie.category));

  return (
    <Doc>
      <Text>
        Настоящая Политика использования cookie-файлов разъясняет, какие cookie-файлы и иные данные на
        устройстве Пользователя использует веб-приложение {site.url} (далее — «Сервис») и с какими целями.
      </Text>

      <Section title="Что такое cookie-файлы">
        <Clause>
          Cookie — небольшой фрагмент данных, который веб-сервер сохраняет на устройстве Пользователя при
          посещении Сервиса и который передаётся обратно при последующих запросах.
        </Clause>
        <Clause>
          Локальное хранилище браузера (localStorage) — аналогичная технология, позволяющая Сервису
          сохранять данные на устройстве Пользователя. В отличие от cookie, эти данные не передаются на
          сервер автоматически.
        </Clause>
        <Clause>
          Такие данные в совокупности с иной информацией могут позволить определить Пользователя. Поэтому
          Оператор обрабатывает их в соответствии с{" "}
          <DocLink href="/legal/privacy-policy">Политикой в отношении обработки персональных данных</DocLink>.
        </Clause>
      </Section>

      <Section title="Правовые основания использования">
        <Clause>
          Строго необходимые (технические) cookie и данные локального хранилища устанавливаются без
          отдельного согласия Пользователя: без них невозможна авторизация и работа Сервиса.
        </Clause>
        <Clause>
          {optional.length > 0
            ? "Аналитические и иные нетехнические cookie устанавливаются исключительно после получения предварительного согласия Пользователя."
            : "Сервис не использует аналитические, рекламные и иные нетехнические cookie, поэтому баннер согласия на cookie не показывается. Если такие cookie будут добавлены, они станут устанавливаться только после получения согласия Пользователя, а настоящая Политика будет обновлена."}
        </Clause>
      </Section>

      <Section title="Строго необходимые cookie-файлы">
        <Clause>Устанавливаются после входа в учётную запись:</Clause>
        <Table
          headers={["Наименование", "Кто устанавливает", "Назначение", "Срок хранения"]}
          rows={cookieRows(essential)}
        />
      </Section>

      {localStorage.length > 0 ? (
        <Section title="Данные локального хранилища">
          <Clause>Сохраняются в браузере после входа в учётную запись и удаляются при выходе из неё:</Clause>
          <Table
            headers={["Ключ", "Кто сохраняет", "Назначение", "Срок хранения"]}
            rows={cookieRows(localStorage)}
          />
        </Section>
      ) : null}

      {optional.length > 0 ? (
        <Section title="Cookie-файлы, требующие согласия">
          <Clause>Устанавливаются только после получения согласия Пользователя:</Clause>
          <Table
            headers={["Наименование", "Категория", "Кто устанавливает", "Назначение", "Срок хранения"]}
            rows={optional.map((cookie) => [
              cookie.name,
              cookieCategoryLabel(cookie.category),
              cookie.provider,
              cookie.purpose,
              cookie.lifetime,
            ])}
          />
        </Section>
      ) : null}

      <Section title="Управление cookie-файлами">
        <Clause>
          При выходе из учётной записи Сервис удаляет установленные им cookie и данные локального
          хранилища. Пользователь также может удалить их в любой момент средствами браузера:
        </Clause>
        <List
          items={[
            "Google Chrome: Настройки → Конфиденциальность и безопасность → Файлы cookie;",
            "Mozilla Firefox: Настройки → Приватность и защита → Куки и данные сайтов;",
            "Safari: Настройки → Конфиденциальность → Управление данными веб-сайтов;",
            "Microsoft Edge: Настройки → Файлы cookie и разрешения сайтов.",
          ]}
        />
        <Callout>
          Блокировка или удаление строго необходимых cookie приведёт к выходу из учётной записи и
          невозможности пользоваться Сервисом до повторного входа.
        </Callout>
      </Section>

      <Section title="Контакты">
        <Clause>
          Вопросы об использовании cookie-файлов направляются на адрес{" "}
          <Mail address={contacts.privacyEmail} />.
        </Clause>
      </Section>
    </Doc>
  );
}
