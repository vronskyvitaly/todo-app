import { Callout, Clause, Doc, DocLink, List, Mail, Section, Table, Text } from "@/components/legal/primitives";
import { operatorCredentials } from "@/lib/legal/format";
import type { SiteLegalConfig } from "@/lib/legal/types";

export function PersonalDataConsent({ config }: { config: SiteLegalConfig }) {
  const { operator, contacts, site, purposes, processors } = config;

  const consentPurposes = purposes.filter((purpose) => purpose.legalBasis === "consent");
  const consentDataCategories = Array.from(
    new Set(consentPurposes.flatMap((purpose) => purpose.dataCategories)),
  );

  return (
    <Doc>
      <Text>
        Настоящее Согласие является самостоятельным документом и даётся Пользователем свободно, своей
        волей и в своём интересе в соответствии со статьёй 9 Федерального закона от 27.07.2006 № 152-ФЗ
        «О персональных данных» при регистрации в веб-приложении {site.url} (далее — «Сервис») путём
        проставления соответствующей отметки в форме регистрации.
      </Text>

      <Callout>
        Согласие является конкретным, предметным, информированным, сознательным и однозначным. Отметка о
        согласии не проставляется заранее и не объединяется с принятием иных документов.
      </Callout>

      <Section title="Оператор, получающий согласие">
        <Clause>
          {operator.fullName}, {operatorCredentials(operator)}.
        </Clause>
        <Clause>Адрес: {operator.legalAddress}.</Clause>
        <Clause>
          Телефон: {contacts.phone}. Адрес электронной почты: <Mail address={contacts.email} />.
        </Clause>
      </Section>

      <Section title="Субъект персональных данных">
        <Clause>
          Субъектом является Пользователь, самостоятельно зарегистрировавшийся в Сервисе и указавший свои
          персональные данные.
        </Clause>
        <Clause>
          Согласие даётся лицом, достигшим возраста 14 лет. За несовершеннолетних, не достигших 14 лет,
          согласие даёт их законный представитель.
        </Clause>
      </Section>

      <Section title="Цели обработки персональных данных">
        <Clause>Согласие даётся на обработку персональных данных в следующих целях:</Clause>
        <List items={consentPurposes.map((purpose) => `${purpose.title};`)} />
        <Clause>
          Обработка данных для отправки push-уведомлений начинается только после того, как Пользователь
          дополнительно разрешит уведомления в настройках браузера.
        </Clause>
      </Section>

      <Section title="Перечень персональных данных">
        <Clause>Согласие даётся на обработку следующих персональных данных:</Clause>
        <List items={consentDataCategories.map((category) => `${category};`)} />
        <Clause>
          Согласие не распространяется на специальные категории и биометрические данные — Оператор их не
          обрабатывает.
        </Clause>
      </Section>

      <Section title="Перечень действий с персональными данными">
        <Clause>
          Согласие даётся на: сбор, запись, систематизацию, накопление, хранение, уточнение, извлечение,
          использование, передачу, обезличивание, блокирование, удаление, уничтожение персональных данных
          как с использованием средств автоматизации, так и без.
        </Clause>
      </Section>

      <Section title="Лица, которым поручается обработка">
        <Clause>Согласие даётся на поручение обработки следующим лицам:</Clause>
        <Table
          headers={["Лицо", "Цель обработки", "Состав данных", "Страна"]}
          rows={processors.map((processor) => [
            processor.name,
            processor.purpose,
            processor.dataCategories.join("; "),
            processor.country,
          ])}
        />
      </Section>

      <Section title="Срок действия и порядок отзыва">
        <Clause>
          Согласие действует до достижения целей обработки, удаления учётной записи либо до момента его
          отзыва Пользователем.
        </Clause>
        <Clause>
          Согласие может быть отозвано путём направления письменного уведомления на{" "}
          <Mail address={contacts.privacyEmail} /> либо по адресу: {contacts.postalAddress}.
        </Clause>
        <Clause>
          После отзыва Оператор прекращает обработку, удаляет учётную запись и уничтожает данные в срок не
          более 30 дней, за исключением случаев, когда обработка допускается законом без согласия.
        </Clause>
      </Section>

      <Section title="Подтверждение согласия">
        <Clause>
          Проставляя отметку в поле согласия и создавая учётную запись, Пользователь подтверждает, что
          ознакомлен с настоящим Согласием и{" "}
          <DocLink href="/legal/privacy-policy">Политикой конфиденциальности</DocLink>, их положения ему
          понятны.
        </Clause>
      </Section>
    </Doc>
  );
}
