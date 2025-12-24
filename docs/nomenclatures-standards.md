# Номенклатури по международни стандарти

## Обзор

Системата използва официални международни стандарти за всички номенклатури, което гарантира съвместимост с:

- Електронно фактуриране (UBL, Peppol)
- ERP системи
- Митнически и статистически декларации
- Европейски и международен обмен на данни

## Имплементирани стандарти

| Стандарт | Обхват | Брой записи | Езици |
|----------|--------|-------------|-------|
| UN/ECE Rec 20 | Мерни единици | 120+ | БГ, EN |
| UNCL1001 | Типове документи | 30+ | БГ, EN |
| ISO 3166-1 | Държави | 70+ | БГ, EN |
| ISO 4217 | Валути | 50+ | БГ, EN |
| EN 16931 | ДДС категории | 7 | БГ, EN |

---

## 1. Мерни единици (UN/ECE Recommendation 20)

### Описание

UN/ECE Recommendation 20 е международен стандарт за кодове на мерни единици, използван в международната търговия, EDI съобщения и UBL документи.

**Версия:** Revision 11e (2024)
**Източник:** [UNECE](https://unece.org/trade/uncefact/cl-recommendations)

### Категории

| Категория | Код | Описание | Примери |
|-----------|-----|----------|---------|
| UNIT | Единици | Броеми единици | C62, EA, PCE, SET, PR |
| MASS | Маса | Тегло | KGM, GRM, TNE, LBR |
| LENGTH | Дължина | Линейни мерки | MTR, CMT, MMT, KMT |
| AREA | Площ | Квадратни мерки | MTK, CMK, HAR, ACR |
| VOLUME | Обем | Кубични и течни мерки | MTQ, LTR, MLT, BLL |
| TIME | Време | Времеви единици | SEC, MIN, HUR, DAY, MON, ANN |
| PACKAGING | Опаковки | Видове опаковки | PK, BX, CT, BT, ROL |
| ELECTRICAL | Електричество | Електрически величини | WTT, KWT, KWH, AMP, VLT |
| INFORMATION | Информация | Дигитални данни | E34, E35, 4L, AD |
| TEMPERATURE | Температура | Термични единици | CEL, FAH, KEL |
| PRESSURE | Налягане | Единици за налягане | BAR, PAL, PSI, ATM |
| FREQUENCY | Честота | Честотни единици | HTZ, KHZ, MHZ, GHZ |
| SPEED | Скорост | Единици за скорост | KMH, MTS, KNT |
| PERCENT | Процент | Относителни единици | P1, E40 |
| SERVICE | Услуги | Специални за услуги | LS, E48, ACT |
| MISCELLANEOUS | Други | Други единици | NMP, NPR, H87 |

### Най-използвани кодове

| Код | Име (БГ) | Name (EN) | Символ | Категория |
|-----|----------|-----------|--------|-----------|
| C62 | Единица | One (unit) | бр. | UNIT |
| EA | Брой | Each | бр. | UNIT |
| PCE | Парче | Piece | бр. | UNIT |
| SET | Комплект | Set | к-т | UNIT |
| KGM | Килограм | Kilogram | кг | MASS |
| GRM | Грам | Gram | г | MASS |
| TNE | Метричен тон | Tonne | т | MASS |
| LTR | Литър | Litre | л | VOLUME |
| MLT | Милилитър | Millilitre | мл | VOLUME |
| MTR | Метър | Metre | м | LENGTH |
| CMT | Сантиметър | Centimetre | см | LENGTH |
| MTK | Квадратен метър | Square metre | м² | AREA |
| MTQ | Кубичен метър | Cubic metre | м³ | VOLUME |
| HUR | Час | Hour | ч | TIME |
| DAY | Ден | Day | дни | TIME |
| MON | Месец | Month | мес. | TIME |
| ANN | Година | Year | год. | TIME |
| KWH | Киловатчас | Kilowatt hour | kWh | ELECTRICAL |
| PK | Пакет | Pack | пак. | PACKAGING |
| BX | Кутия | Box | кут. | PACKAGING |

### GraphQL API

```graphql
# Търсене по код, име (БГ/EN), символ
query SearchUnits($search: String!) {
  searchUnitsOfMeasure(search: $search) {
    code
    name      # Българско име
    nameEn    # Английско име
    symbol    # Символ
    category  # Категория
  }
}

# Всички единици от определена категория
query UnitsByCategory($category: String!) {
  unitsOfMeasureByCategory(category: $category) {
    code
    name
    nameEn
    symbol
  }
}

# Списък на всички категории
query AllCategories {
  unitCategories
}

# Конкретна единица по код
query UnitByCode($code: String!) {
  unitOfMeasureByCode(code: $code) {
    code
    name
    nameEn
    symbol
    category
  }
}
```

---

## 2. Типове документи (UNCL1001)

### Описание

UNCL1001 е стандарт за кодове на типове документи, използван в EDIFACT и UBL съобщения.

**Версия:** UN/EDIFACT D.16B
**Източник:** [Peppol Codelist](https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL1001-inv/)

### Типове фактури

| Код | Име (БГ) | Name (EN) | Описание |
|-----|----------|-----------|----------|
| 380 | Търговска фактура | Commercial invoice | Стандартна фактура за продажба на стоки/услуги |
| 384 | Коригираща фактура | Corrected invoice | Фактура с коригирана информация от предишна |
| 386 | Авансова фактура | Prepayment invoice | Фактура за авансово плащане |
| 388 | Данъчна фактура | Tax invoice | Фактура издадена за данъчни цели |
| 389 | Самофактура | Self-billed invoice | Фактура издадена от получателя вместо продавача |
| 383 | Дебитно известие | Debit note | Документ за дебитиране на клиент |
| 326 | Частична фактура | Partial invoice | Фактура за частична доставка |
| 331 | Фактура с опаковъчен лист | Commercial invoice with packing list | Фактура включваща опаковъчен лист |
| 393 | Факторинг фактура | Factored invoice | Прехвърлена на трета страна |
| 780 | Фрахтова фактура | Freight invoice | Фактура за транспортни разходи |

### Типове кредитни известия

| Код | Име (БГ) | Name (EN) | Описание |
|-----|----------|-----------|----------|
| 381 | Кредитно известие | Credit note | Стандартно кредитно известие |
| 396 | Факторинг кредитно известие | Factored credit note | Прехвърлено на трета страна |
| 308 | Кредитно известие от доставчик | Supplier credit note | Издадено от доставчик |
| 261 | Самоиздадено кредитно известие | Self billed credit note | Издадено от получателя |

### GraphQL API

```graphql
# Търсене по код или име
query SearchDocTypes($search: String, $appliesTo: String) {
  searchDocumentTypeCodes(search: $search, appliesTo: $appliesTo) {
    code
    name
    nameEn
    description
    descriptionEn
    appliesTo    # INVOICE, CREDIT_NOTE, BOTH
    isCommon
  }
}

# Всички типове за фактури
query InvoiceTypes {
  invoiceTypeCodes {
    code
    name
    nameEn
    description
  }
}

# Всички типове за кредитни известия
query CreditNoteTypes {
  creditNoteTypeCodes {
    code
    name
    nameEn
    description
  }
}

# Най-често използвани типове
query CommonTypes {
  commonDocumentTypeCodes {
    code
    name
    nameEn
  }
}
```

---

## 3. Държави (ISO 3166-1 alpha-2)

### Описание

ISO 3166-1 alpha-2 е двубуквен стандарт за кодове на държави.

**Източник:** [ISO](https://www.iso.org/iso-3166-country-codes.html)

### ЕС членки (27 държави)

| Код | Име (БГ) | Name (EN) | Peppol SchemeID |
|-----|----------|-----------|-----------------|
| AT | Австрия | Austria | 9914 |
| BE | Белгия | Belgium | 9956 |
| BG | България | Bulgaria | 9947 |
| CY | Кипър | Cyprus | 9925 |
| CZ | Чехия | Czech Republic | 9932 |
| DE | Германия | Germany | 9930 |
| DK | Дания | Denmark | 9917 |
| EE | Естония | Estonia | 9931 |
| ES | Испания | Spain | 9920 |
| FI | Финландия | Finland | 9935 |
| FR | Франция | France | 9957 |
| GR | Гърция | Greece | 9933 |
| HR | Хърватия | Croatia | 9934 |
| HU | Унгария | Hungary | 9910 |
| IE | Ирландия | Ireland | 9955 |
| IT | Италия | Italy | 9906 |
| LT | Литва | Lithuania | 9938 |
| LU | Люксембург | Luxembourg | 9915 |
| LV | Латвия | Latvia | 9939 |
| MT | Малта | Malta | 9923 |
| NL | Нидерландия | Netherlands | 9944 |
| PL | Полша | Poland | 9945 |
| PT | Португалия | Portugal | 9946 |
| RO | Румъния | Romania | 9948 |
| SE | Швеция | Sweden | 9955 |
| SI | Словения | Slovenia | 9928 |
| SK | Словакия | Slovakia | 9929 |

### Други държави

Системата включва и други държави: Великобритания, Швейцария, Норвегия, САЩ, Китай, Русия, Турция и др.

### GraphQL API

```graphql
# Търсене по код или име
query SearchCountries($search: String!) {
  searchCountries(search: $search) {
    code
    name
    nameEn
    isEuMember
    peppolSchemeId
  }
}

# Само ЕС членки
query EuCountries {
  euCountries {
    code
    name
    nameEn
    peppolSchemeId
  }
}

# Държави с Peppol поддръжка
query PeppolCountries {
  peppolCountries {
    code
    name
    peppolSchemeId
  }
}

# Всички държави (сортирани: ЕС първо)
query AllCountries {
  allCountries {
    code
    name
    nameEn
    isEuMember
    peppolSchemeId
  }
}
```

---

## 4. ДДС категории (EN 16931)

### Описание

EN 16931 дефинира стандартни категории за ДДС в електронните фактури.

| Категория | Код | Описание (БГ) | Description (EN) |
|-----------|-----|---------------|------------------|
| Стандартна | S | Стандартна ставка | Standard rate |
| Нулева | Z | Нулева ставка | Zero rated |
| Освободена | E | Освободена от ДДС | Exempt from tax |
| Вътреобщностна | K | Вътреобщностна доставка | Intra-community supply |
| Износ | G | Износ извън ЕС | Export outside the EU |
| Обратно начисляване | AE | Обратно начисляване | Reverse charge |
| Не подлежи на ДДС | O | Извън обхвата на ДДС | Not subject to VAT |

---

## 5. База данни структура

### Таблици

```sql
-- Мерни единици
CREATE TABLE units_of_measure (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,        -- Българско име
    name_en VARCHAR(255),              -- Английско име
    symbol VARCHAR(20),                -- Символ (напр. "кг")
    category VARCHAR(50)               -- Категория (MASS, LENGTH, etc.)
);

-- Типове документи
CREATE TABLE document_type_codes (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,        -- Българско име
    name_en VARCHAR(255) NOT NULL,     -- Английско име
    description TEXT,                  -- Описание (БГ)
    description_en TEXT,               -- Описание (EN)
    applies_to VARCHAR(50) NOT NULL,   -- INVOICE, CREDIT_NOTE, BOTH
    is_common BOOLEAN DEFAULT FALSE,   -- Често използван
    sort_order INT DEFAULT 999
);

-- Държави
CREATE TABLE countries (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,        -- Българско име
    name_en VARCHAR(255),              -- Английско име
    is_eu_member BOOLEAN DEFAULT FALSE,
    peppol_scheme_id VARCHAR(10)       -- Peppol идентификатор
);
```

### Миграции

- `V3__Full_UNECE_Units_Of_Measure.sql` - Мерни единици
- `V4__Document_Types_And_Full_Countries.sql` - Типове документи и държави

---

## 6. Frontend компоненти

### UnitSearchModal

Модал за търсене и избор на мерни единици:

```jsx
import { UnitSearchModal } from './components/UnitSearchModal';

<UnitSearchModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onUnitSelected={(unit) => {
    console.log('Избрана единица:', unit.code, unit.name);
  }}
  currentUnit="KGM"  // Текущо избраната единица
/>
```

**Функционалности:**
- Търсене по код, име (БГ/EN), символ
- Филтриране по категория
- Таблична визуализация
- Показване на текущо избраната единица

---

## 7. Актуализация на данните

Номенклатурите се поддържат чрез Flyway миграции. За добавяне на нови записи:

1. Създайте нов файл `V{N}__Description.sql`
2. Добавете INSERT/UPDATE изрази с `ON CONFLICT DO UPDATE`
3. Рестартирайте backend-а

Пример:
```sql
INSERT INTO units_of_measure (code, name, name_en, symbol, category)
VALUES ('NEW', 'Нова единица', 'New unit', 'nu', 'UNIT')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en;
```

---

## Референции

- [UN/ECE Recommendation 20](https://unece.org/trade/uncefact/cl-recommendations)
- [UN/ECE Recommendation 21](https://unece.org/trade/uncefact/cl-recommendations) (Опаковки)
- [UNCL1001 - Peppol](https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL1001-inv/)
- [ISO 3166-1](https://www.iso.org/iso-3166-country-codes.html)
- [EN 16931 European Standard](https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/EN+16931)
- [Peppol BIS Billing 3.0](https://docs.peppol.eu/poacc/billing/3.0/)
