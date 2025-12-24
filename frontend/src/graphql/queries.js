import { gql } from '@apollo/client';

export const GET_ME = gql`
  query GetMe {
    me {
      id
      username
      email
      role
      isActive
      company {
        id
        name
      }
    }
  }
`;

export const SEARCH_CLIENTS = gql`
  query SearchClients($companyId: ID!, $searchTerm: String!) {
    searchClients(companyId: $companyId, searchTerm: $searchTerm) {
      id
      name
      eik
      vatNumber
      address
      phone
      email
    }
  }
`;

export const GET_CLIENTS = gql`
  query GetClients($companyId: ID!) {
    clientsByCompany(companyId: $companyId) {
      id
      name
      eik
      vatNumber
      address
      phone
      email
      clientType
      isActive
      isEuVatPayer
      website
      paymentTerms
      creditLimit
      discountPercent
    }
  }
`;

export const GET_VIES_COMPANY_DATA = gql`
  query GetViesCompanyData($vatNumber: String!) {
    getViesCompanyData(vatNumber: $vatNumber) {
      vatNumber
      countryCode
      companyName
      address
      requestDate
      isValid
    }
  }
`;

export const GET_BANK_ACCOUNTS_BY_COMPANY = gql`
  query GetBankAccountsByCompany($companyId: ID!) {
    bankAccountsByCompany(companyId: $companyId) {
      id
      bankName
      iban
      bic
      currencyCode
      accountName
      isActive
      isDefault
      sortOrder
      description
      displayName
      formattedIban
      isBgnAccount
      isForeignCurrencyAccount
    }
  }
`;

export const GET_ITEMS = gql`
  query GetItems($companyId: ID!) {
    itemsByCompany(companyId: $companyId) {
      id
      name
      description
      unit
      unitPrice
      vatRate {
        id
        name
        rate
      }
    }
  }
`;

export const GET_DOCUMENT_SEQUENCES = gql`
  query GetDocumentSequences($companyId: ID!) {
    documentSequences(companyId: $companyId) {
      id
      sequenceType
      currentNumber
      nextNumber
      lastUpdated
    }
  }
`;
export const GET_ALL_COMPANIES_WITH_DETAILS = gql`
  query GetAllCompaniesWithDetails {
    allCompanies {
      id
      name
      nameEn
      eik
      vatNumber
      address
      phone
      email
      website
      userLimit
      activeUserCount
      adminUsername
    }
  }
`;

export const GET_CLIENT_BY_ID = gql`
  query GetClientById($id: ID!) {
    client(id: $id) {
      id
      name
      nameEn
      address
      vatNumber
      eik
      email
      phone
      website
      clientType
      isActive
      isEuVatPayer
      isIndividual
      paymentTerms
      creditLimit
      discountPercent
      notes
      createdAt
      updatedAt
    }
  }
`;

export const GET_CLIENT_DOCUMENTS_COUNT = gql`
  query GetClientDocumentsCount($clientId: ID!) {
    clientDocumentsCount(clientId: $clientId) {
      hasDocuments
      totalDocuments
    }
  }
`;

export const VALIDATE_VAT_NUMBER = gql`
  query ValidateVatNumber($vatNumber: String!) {
    validateVatNumber(vatNumber: $vatNumber) {
      isValid
      vatNumber
      countryCode
      companyName
      address
      requestDate
    }
  }
`;

export const SEARCH_CLIENT_BY_VAT_NUMBER = gql`
  query SearchClientByVatNumber($companyId: ID!, $vatNumber: String!) {
    searchClientByVatNumber(companyId: $companyId, vatNumber: $vatNumber) {
      success
      client {
        id
        name
        eik
        vatNumber
        address
        email
        phone
        clientType
      }
      message
      errors
      fromVies
      requiresManualEntry
      errorMessage
      errorType
      viesData {
        vatNumber
        countryCode
        companyName
        address
        isValid
      }
    }
  }
`;

export const GET_COMPANY_DETAILS = gql`
  query GetCompanyDetails($id: ID!) {
    companyById(id: $id) {
      id
      name
      nameEn
      address
      vatNumber
      eik
      email
      phone
      website
      isVatRegistered
      defaultPaymentTerms
      logoUrl
      companyStampUrl
      signatureUrl
      invoiceFooter
      invoiceFooterEn
      compiledBy
    }
  }
`;

export const GET_NOMENCLATURES = gql`
  query GetNomenclatures {
    allCountries {
      code
      name
      nameEn
      isEuMember
    }
    allUnitsOfMeasure {
      code
      name
      nameEn
      symbol
      category
    }
  }
`;

export const GET_PAYMENT_METHODS_BY_COMPANY = gql`
  query GetPaymentMethodsByCompany($companyId: ID!) {
    paymentMethodsByCompany(companyId: $companyId) {
      id
      name
      nameEn
      methodCode
      isActive
      isDefault
      requiresBankAccount
      sortOrder
      description
    }
  }
`;

export const GET_NEXT_DOCUMENT_NUMBER = gql`
  query GetNextDocumentNumber($companyId: ID!, $documentType: DocumentType!) {
    nextDocumentNumber(companyId: $companyId, documentType: $documentType)
  }
`;

export const GET_ACTIVE_VAT_RATES = gql`
  query GetActiveVatRates {
    activeVatRates {
      id
      rateValue
      rateName
      rateNameEn
      isDefault
      isActive
      description
      sortOrder
      isZeroRate
      formattedRate
    }
  }
`;

export const GET_LATEST_EXCHANGE_RATES = gql`
  query GetLatestExchangeRates {
    latestExchangeRates {
      id
      currency {
        code
        name
        symbol
      }
      rateDate
      rate
      baseCurrency
    }
  }
`;

export const GET_ACTIVE_ITEMS_BY_COMPANY = gql`
  query GetActiveItemsByCompany($companyId: ID!) {
    activeItemsByCompany(companyId: $companyId) {
      id
      itemNumber
      name
      nameEn
      description
      unitOfMeasure
      unitPrice
      defaultVatRate
      accountingAccountNumber
      isActive
    }
  }
`;

export const GET_ALL_CURRENCIES = gql`
  query GetAllCurrencies {
    allCurrencies {
      code
      name
      symbol
      isActive
    }
  }
`;

export const GET_ACTIVE_CURRENCIES = gql`
  query GetActiveCurrencies {
    activeCurrencies {
      code
      name
      symbol
      isActive
    }
  }
`;

export const GET_ITEMS_BY_COMPANY = gql`
  query GetItemsByCompany($companyId: ID!) {
    itemsByCompany(companyId: $companyId) {
      id
      itemNumber
      name
      nameEn
      description
      unitOfMeasure
      unitPrice
      defaultVatRate
      accountingAccountNumber
      isActive
    }
  }
`;

export const SEARCH_ITEMS = gql`
  query SearchItems($searchTerm: String!, $companyId: ID!) {
    searchItems(searchTerm: $searchTerm, companyId: $companyId) {
      id
      itemNumber
      name
      nameEn
      description
      unitOfMeasure
      unitPrice
      defaultVatRate
      accountingAccountNumber
      isActive
      company {
        id
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_VAT_EXEMPTION_REASONS = gql`
  query GetAllVatExemptionReasons {
    allVatExemptionReasons {
      id
      reasonCode
      reasonName
      reasonNameEn
      legalBasis
      legalBasisEn
      description
      isActive
      sortOrder
      ublCategoryCode
      ublExemptionCode
    }
  }
`;

export const GET_CURRENCY_SYSTEM_STATUS = gql`
  query GetCurrencySystemStatus {
    currencySystemStatus {
      eurozoneActive
      transitionDate
      activeProvider
      baseCurrency
      defaultCurrency
      bgnToEurRate
      forceEurozoneMode
    }
  }
`;
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($companyId: ID!) {
    dashboardStats(companyId: $companyId) {
      totalClients
      totalInvoices
      totalRevenue
      pendingInvoices
      overduedInvoices
      recentInvoices {
        id
        documentNumber
        clientName
        totalAmountWithVat
        currency
        issueDate
        dueDate
        status
      }
      monthlyRevenue {
        month
        revenue
      }
    }
  }
`;

export const GET_CLIENTS_BY_COMPANY = gql`
  query GetClientsByCompany($companyId: ID!) {
    clientsByCompany(companyId: $companyId) {
      id
      name
      nameEn
      eik
      vatNumber
      address
      email
      phone
      clientType
      isActive
      isEuVatPayer
      isIndividual
      paymentTerms
      creditLimit
      discountPercent
      notes
      createdAt
      updatedAt
    }
  }
`;

export const GET_DOCUMENTS_BY_COMPANY = gql`
  query GetDocumentsByCompany($companyId: ID!) {
    documentsByCompany(companyId: $companyId) {
      id
      documentNumber
      documentType
      issueDate
      dueDate
      totalAmountWithVat
      currencyCode
      status
      clientId
      clientName
      notes
      createdAt
      updatedAt
    }
  }
`;
export const GET_DOCUMENT_BY_ID = gql`
  query GetDocumentById($id: ID!) {
    documentById(id: $id) {
      id
      documentUuid
      documentNumber
      fullDocumentNumber
      documentType
      status
      issueDate
      vatDate
      dueDate
      totalAmountWithVat
      subtotalAmount
      vatAmount
      currencyCode
      exchangeRate
      exchangeRateDate
      totalAmountWithVatBaseCurrency
      isTaxDocument
      isCancelled
      cancelledAt
      cancellationReason
      hasValidVatDate
      effectiveVatDate
      createdAt
      updatedAt
      client {
        id
        name
        address
        vatNumber
        eik
        email
      }
      company {
        id
        name
        address
        vatNumber
        eik
        compiledBy
      }
      paymentMethod {
        id
        name
      }
      bankAccount {
        id
        bankName
        iban
        bic
      }
      notes
      documentItems {
        id
        itemDescription
        effectiveItemName
        quantity
        unitPrice
        vatRate
        lineTotal
        vatAmount
        item {
          id
          itemNumber
          name
          unitOfMeasure
        }
        vatExemptionReason {
          id
          reasonName
          legalBasis
        }
      }
    }
  }
`;
export const GET_DOCUMENTS = gql`
  query GetDocuments($companyId: ID!) {
    documentsByCompany(companyId: $companyId) {
      id
      documentNumber
      fullDocumentNumber
      documentType
      status
      issueDate
      dueDate
      totalAmountWithVat
      currencyCode
      isPaid
      paidAt
      paymentMethod {
        id
        methodCode
        name
      }
      client {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
  `;

export const GET_DOCUMENTS_FOR_REPORTS = gql`
  query GetDocumentsForReports($companyId: ID!) {
    documentsByCompany(companyId: $companyId) {
      id
      documentNumber
      fullDocumentNumber
      documentType
      status
      issueDate
      dueDate
      totalAmountWithVat
      currencyCode
      isPaid
      paidAt
      paymentMethod {
        id
        methodCode
        name
      }
      client {
        id
        name
      }
      documentItems {
        id
        quantity
        unitPrice
        lineTotal
        item {
          id
          name
          itemNumber
        }
      }
      createdAt
      updatedAt
    }
  }
  `;
  
  export const GET_ALL_USERS = gql`
    query GetAllUsers {
      allUsers {
        id
        username
        email
        role
        isActive
        company {
          id
          name
        }
      }
    }
  `;
  
  export const GET_USERS_BY_COMPANY = gql`
    query GetUsersByCompany($companyId: ID!) {
      usersByCompany(companyId: $companyId) {
        id
        username
        email
        role
        isActive
      }
    }
  `;
  
  export const GET_COMPANY_WITH_USERS = gql`
    query GetCompanyWithUsers($id: ID!) {
      companyById(id: $id) {
        id
        name
        nameEn
        eik
        vatNumber
        address
        phone
        email
        website
        userLimit
        users {
          id
          username
          email
          role
          isActive
        }
      }
    }
  `;

export const GET_EXCHANGE_RATES_FOR_DATE = gql`
  query GetExchangeRatesForDate($date: String!) {
    exchangeRatesForDate(date: $date) {
      id
      currency {
        code
        name
        symbol
      }
      rate
      rateDate
      baseCurrency
    }
  }
`;

// SMTP Settings queries
export const GET_SMTP_SETTINGS = gql`
  query GetSmtpSettings {
    allSmtpSettings {
      id
      smtpHost
      smtpPort
      smtpUsername
      useTls
      useSsl
      smtpAuth
      fromEmail
      fromName
      isActive
      providerName
      createdAt
      updatedAt
    }
  }
`;

export const VERIFY_DOCUMENT = gql`
  query VerifyDocument($uuid: String!) {
    verifyDocument(uuid: $uuid) {
      documentUuid
      documentNumber
      documentType
      issueDate
      totalAmountWithVat
      currencyCode
      companyName
      companyEik
      clientName
      isValid
    }
  }
`;

export const GET_ACTIVE_SMTP_SETTINGS = gql`
  query GetActiveSmtpSettings {
    activeSmtpSettings {
      id
      smtpHost
      smtpPort
      smtpUsername
      useTls
      useSsl
      smtpAuth
      fromEmail
      fromName
      isActive
      providerName
      createdAt
      updatedAt
    }
  }
`;

export const GET_EXCHANGE_RATE_FOR_CURRENCY = gql`
  query GetExchangeRateForCurrency($currencyCode: String!, $date: String!) {
    exchangeRateForCurrency(currencyCode: $currencyCode, date: $date) {
      id
      currency {
        code
        name
        symbol
      }
      rateDate
      rate
      baseCurrency
    }
  }
`;

// Backup Settings queries
export const GET_BACKUP_SETTINGS = gql`
  query GetBackupSettings {
    backupSettings {
      id
      s3Endpoint
      s3Region
      s3BucketName
      s3AccessKey
      backupPrefix
      autoBackupEnabled
      backupCronExpression
      retentionDays
      maxBackups
      isActive
      lastBackupAt
      lastBackupStatus
      lastBackupSizeBytes
      lastBackupFilename
      lastErrorMessage
      createdAt
      updatedAt
      hasValidConfiguration
    }
  }
`;

export const GET_BACKUP_HISTORY = gql`
  query GetBackupHistory {
    backupHistory {
      id
      filename
      s3Key
      sizeBytes
      status
      backupType
      startedAt
      completedAt
      durationSeconds
      errorMessage
      databaseName
      checksum
      initiatedBy
      deletedAt
      formattedSize
    }
  }
`;

export const GET_ALL_BACKUP_HISTORY = gql`
  query GetAllBackupHistory {
    allBackupHistory {
      id
      filename
      s3Key
      sizeBytes
      status
      backupType
      startedAt
      completedAt
      durationSeconds
      errorMessage
      databaseName
      checksum
      initiatedBy
      deletedAt
      formattedSize
    }
  }
`;

export const GET_BACKUP_STATS = gql`
  query GetBackupStats {
    backupStats {
      totalBackups
      totalSizeBytes
      formattedTotalSize
      lastBackupAt
      lastBackupStatus
      isScheduled
      nextBackupTime
    }
  }
`;

// UBL Export query
export const EXPORT_DOCUMENT_AS_UBL = gql`
  query ExportDocumentAsUbl($documentId: ID!) {
    exportDocumentAsUbl(documentId: $documentId) {
      success
      xml
      filename
      message
      validationErrors
    }
  }
`;