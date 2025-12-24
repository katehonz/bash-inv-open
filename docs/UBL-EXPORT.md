# UBL XML Експорт - Електронно фактуриране

## Обзор

Системата поддържа експорт на документи в **UBL 2.1 XML** формат съгласно европейския стандарт **EN 16931** за електронно фактуриране. Този формат е съвместим с мрежата **Peppol** и може да бъде импортиран директно в повечето ERP системи.

## Съответствие със стандарти

| Стандарт | Версия | Статус |
|----------|--------|--------|
| UBL (OASIS) | 2.1 | ✅ Пълна поддръжка |
| EN 16931 | 2017 | ✅ Пълна поддръжка |
| Peppol BIS | Billing 3.0 | ✅ Пълна поддръжка |
| UN/ECE Rec 20 | Rev 11e | ✅ 120+ мерни единици |
| UNCL1001 | D.16B | ✅ 30+ типа документи |
| ISO 3166-1 | alpha-2 | ✅ 70+ държави |
| ISO 4217 | - | ✅ Валутни кодове |

## Поддържани типове документи (UNCL1001)

### Фактури

| Код | Име (БГ) | Име (EN) | Описание |
|-----|----------|----------|----------|
| 380 | Търговска фактура | Commercial invoice | Стандартна фактура за продажба |
| 384 | Коригираща фактура | Corrected invoice | Фактура с коригирана информация |
| 386 | Авансова фактура | Prepayment invoice | Фактура за авансово плащане |
| 388 | Данъчна фактура | Tax invoice | Фактура за данъчни цели |
| 389 | Самофактура | Self-billed invoice | Издадена от получателя |
| 383 | Дебитно известие | Debit note | Документ за дебитиране |
| 326 | Частична фактура | Partial invoice | За част от поръчка |

### Кредитни известия

| Код | Име (БГ) | Име (EN) | Описание |
|-----|----------|----------|----------|
| 381 | Кредитно известие | Credit note | Стандартно кредитно известие |
| 396 | Факторинг кредитно известие | Factored credit note | Прехвърлено на трета страна |
| 308 | Кредитно известие от доставчик | Supplier credit note | Издадено от доставчик |

## Функционалности

### 1. Ръчен експорт на UBL XML

В страницата на документа има бутон **"UBL XML"** в секцията "Действия":

- Натиснете бутона за да изтеглите XML файла
- Файлът се именува: `ubl-{тип}-{номер}.xml` (напр. `ubl-invoice-0000001.xml`)
- Бутонът е активен само за финализирани документи

### 2. Изпращане по имейл с UBL прикачен файл

При изпращане на документ по имейл:

1. Отворете диалога "Изпрати по имейл"
2. Отметнете **"Прикачи UBL XML за ERP интеграция"** (по подразбиране включено)
3. Получателят ще получи:
   - PDF файл за визуален преглед
   - UBL XML файл за автоматичен импорт в ERP система

## Техническа спецификация

### Стандарти

- **UBL версия**: 2.1
- **Профил**: EN 16931 (European Standard for e-invoicing)
- **Peppol BIS**: Billing 3.0

### XML Namespace-и

```xml
xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
```

### Идентификация

| Поле | Стойност |
|------|----------|
| CustomizationID | `urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0` |
| ProfileID | `urn:fdc:peppol.eu:2017:poacc:billing:01:1.0` |

### Peppol Endpoint схеми (ISO 6523)

Системата съдържа пълен списък на Peppol схеми за всички ЕС държави:

| Държава | Код | SchemeID | Държава | Код | SchemeID |
|---------|-----|----------|---------|-----|----------|
| България | BG | 9947 | Португалия | PT | 9946 |
| Германия | DE | 9930 | Румъния | RO | 9948 |
| Австрия | AT | 9914 | Словакия | SK | 9929 |
| Франция | FR | 9957 | Словения | SI | 9928 |
| Италия | IT | 9906 | Испания | ES | 9920 |
| Нидерландия | NL | 9944 | Швеция | SE | 9955 |
| Полша | PL | 9945 | Великобритания | GB | 9959 |

### Мерни единици (UN/ECE Rec 20)

Системата поддържа **120+ мерни единици** по стандарта UN/ECE Recommendation 20:

#### Най-често използвани

| Код | Българска | English | Символ | Категория |
|-----|-----------|---------|--------|-----------|
| C62 | Единица | One (unit) | бр. | UNIT |
| EA | Брой | Each | бр. | UNIT |
| KGM | Килограм | Kilogram | кг | MASS |
| GRM | Грам | Gram | г | MASS |
| TNE | Метричен тон | Tonne | т | MASS |
| LTR | Литър | Litre | л | VOLUME |
| MTR | Метър | Metre | м | LENGTH |
| MTK | Квадратен метър | Square metre | м² | AREA |
| MTQ | Кубичен метър | Cubic metre | м³ | VOLUME |
| HUR | Час | Hour | ч | TIME |
| DAY | Ден | Day | дни | TIME |
| MON | Месец | Month | мес. | TIME |
| KWH | Киловатчас | Kilowatt hour | kWh | ELECTRICAL |

#### Категории мерни единици

- **UNIT** - Единици (C62, EA, PCE, SET, PR, DZN)
- **MASS** - Маса (KGM, GRM, TNE, LBR, ONZ)
- **LENGTH** - Дължина (MTR, CMT, MMT, KMT, INH, FOT)
- **AREA** - Площ (MTK, CMK, HAR, ACR)
- **VOLUME** - Обем (MTQ, LTR, MLT, GLI, BLL)
- **TIME** - Време (SEC, MIN, HUR, DAY, WEE, MON, ANN)
- **PACKAGING** - Опаковки (PK, BX, CT, BT, ROL)
- **ELECTRICAL** - Електричество (WTT, KWT, WHR, KWH, AMP, VLT)
- **INFORMATION** - Информация (E34-GB, E35-TB, 4L-MB)
- **TEMPERATURE** - Температура (CEL, FAH, KEL)
- **PRESSURE** - Налягане (BAR, PAL, PSI, ATM)

### ДДС категории (EN 16931)

| Ставка | Категория | Описание |
|--------|-----------|----------|
| 20% | S | Standard rate |
| 9% | S | Standard rate (reduced) |
| 0% | Z | Zero rated |
| 0% (освободено) | E | Exempt |
| 0% (вътреобщностна) | K | Intra-community |
| 0% (износ) | G | Export |
| 0% (обратно начисляване) | AE | Reverse charge |

## GraphQL API

### Експорт на UBL

```graphql
query ExportDocumentAsUbl($documentId: ID!) {
  exportDocumentAsUbl(documentId: $documentId) {
    success
    xml
    filename
    message
    validationErrors
  }
}
```

### Номенклатури

#### Мерни единици

```graphql
# Търсене на мерни единици (по код, име БГ/EN, символ)
query SearchUnits($search: String!) {
  searchUnitsOfMeasure(search: $search) {
    code
    name
    nameEn
    symbol
    category
  }
}

# Всички мерни единици по категория
query UnitsByCategory($category: String!) {
  unitsOfMeasureByCategory(category: $category) {
    code
    name
    nameEn
    symbol
  }
}

# Списък на категории
query Categories {
  unitCategories
}
```

#### Типове документи

```graphql
# Търсене на типове документи
query SearchDocTypes($search: String, $appliesTo: String) {
  searchDocumentTypeCodes(search: $search, appliesTo: $appliesTo) {
    code
    name
    nameEn
    description
    appliesTo
  }
}

# Типове за фактури
query InvoiceTypes {
  invoiceTypeCodes {
    code
    name
    nameEn
  }
}

# Типове за кредитни известия
query CreditNoteTypes {
  creditNoteTypeCodes {
    code
    name
    nameEn
  }
}
```

#### Държави

```graphql
# Търсене на държави
query SearchCountries($search: String!) {
  searchCountries(search: $search) {
    code
    name
    nameEn
    isEuMember
    peppolSchemeId
  }
}

# ЕС държави
query EuCountries {
  euCountries {
    code
    name
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
```

### Изпращане на имейл с UBL

```graphql
mutation SendDocumentByEmail($input: SendDocumentEmailInput!) {
  sendDocumentByEmail(input: $input) {
    success
    message
  }
}

# Input:
# {
#   documentId: "123",
#   recipientEmail: "client@example.com",
#   pdfBase64: "...",
#   includeUblXml: true
# }
```

## Примерен UBL XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>0000001</cbc:ID>
  <cbc:IssueDate>2024-01-15</cbc:IssueDate>
  <cbc:DueDate>2024-02-14</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="9947">BG123456789</cbc:EndpointID>
      <cac:PartyName>
        <cbc:Name>Моята Фирма ООД</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:EndpointID schemeID="9930">DE987654321</cbc:EndpointID>
      <cac:PartyName>
        <cbc:Name>German Customer GmbH</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">20.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">100.00</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">20.00</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>20.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">100.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">100.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">120.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">120.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1.000</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">100.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Консултантска услуга</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>20.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">100.00</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
</Invoice>
```

## Интеграция с ERP системи

Генерираният UBL XML може да бъде импортиран в следните системи:

- **SAP** - чрез SAP Document Compliance
- **Oracle** - чрез Oracle E-Business Suite
- **Microsoft Dynamics** - директен импорт
- **Navision** - чрез модул за е-фактуриране
- **Bulgarian ERP системи** - повечето поддържат EN 16931

## Бъдещи подобрения

- [ ] Валидация срещу XSD схема преди експорт
- [ ] Цифров подпис (XAdES)
- [ ] Директна интеграция с Peppol мрежата
- [ ] Автоматично изпращане през AS2/AS4 протокол
- [x] ~~Пълна поддръжка на UN/ECE Rec 20 мерни единици~~
- [x] ~~Пълна поддръжка на UNCL1001 типове документи~~
- [x] ~~Пълна поддръжка на ISO 3166-1 държави с Peppol схеми~~

## Референции

- [EN 16931 European Standard](https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/EN+16931)
- [Peppol BIS Billing 3.0](https://docs.peppol.eu/poacc/billing/3.0/)
- [OASIS UBL 2.1](http://docs.oasis-open.org/ubl/UBL-2.1.html)
- [UN/ECE Recommendation 20](https://unece.org/trade/uncefact/cl-recommendations)
- [UNCL1001 Document Type Codes](https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL1001-inv/)
- [ISO 3166-1 Country Codes](https://www.iso.org/iso-3166-country-codes.html)
- [Peppol Participant Identifier Schemes](https://docs.peppol.eu/poacc/billing/3.0/codelist/ICD/)
