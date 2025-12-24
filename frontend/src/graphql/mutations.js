import { gql } from '@apollo/client';

export const CREATE_CLIENT = gql`
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      id
      name
      eik
      vatNumber
      address
      phone
      email
      website
      clientType
      paymentTerms
      creditLimit
      discountPercent
    }
  }
`;

export const CREATE_CLIENT_WITH_VIES = gql`
  mutation CreateClientWithVies($input: CreateClientWithViesInput!) {
    createClientWithVies(input: $input) {
      success
      client {
        id
        name
        eik
        vatNumber
        address
        phone
        email
        website
        clientType
        paymentTerms
        creditLimit
        discountPercent
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

export const CREATE_ITEM = gql`
  mutation CreateItem($input: CreateItemInput!) {
    createItem(input: $input) {
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
    }
  }
`;

export const UPDATE_ITEM = gql`
  mutation UpdateItem($input: UpdateItemInput!) {
    updateItem(input: $input) {
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
    }
  }
`;

export const CREATE_BANK_ACCOUNT = gql`
  mutation CreateBankAccount($input: CreateBankAccountInput!) {
    createBankAccount(input: $input) {
      id
      bankName
      iban
      bic
      currencyCode
      accountName
      isDefault
      isActive
    }
  }
`;

export const UPDATE_BANK_ACCOUNT = gql`
  mutation UpdateBankAccount($input: UpdateBankAccountInput!) {
    updateBankAccount(input: $input) {
      id
      bankName
      iban
      bic
      currencyCode
      accountName
      isDefault
      isActive
    }
  }
`;

export const DELETE_BANK_ACCOUNT = gql`
  mutation DeleteBankAccount($id: ID!) {
    deleteBankAccount(id: $id)
  }
`;

export const SET_DEFAULT_BANK_ACCOUNT = gql`
  mutation SetDefaultBankAccount($id: ID!) {
    setDefaultBankAccount(id: $id) {
      id
      bankName
      iban
      bic
      currencyCode
      accountName
      isDefault
      isActive
    }
  }
`;

export const ACTIVATE_BANK_ACCOUNT = gql`
  mutation ActivateBankAccount($id: ID!) {
    activateBankAccount(id: $id) {
      id
      bankName
      iban
      bic
      currencyCode
      accountName
      isDefault
      isActive
    }
  }
`;

export const DEACTIVATE_BANK_ACCOUNT = gql`
  mutation DeactivateBankAccount($id: ID!) {
    deactivateBankAccount(id: $id) {
      id
      bankName
      iban
      bic
      currencyCode
      accountName
      isDefault
      isActive
    }
  }
`;

export const RESET_SEQUENCE = gql`
  mutation ResetSequence($companyId: ID!, $sequenceType: SequenceType!, $newStartNumber: Int!) {
    resetSequence(companyId: $companyId, sequenceType: $sequenceType, newStartNumber: $newStartNumber) {
      id
      sequenceType
      currentNumber
      nextNumber
      lastUpdated
    }
  }
`;
export const INITIALIZE_COMPANY_SEQUENCES = gql`
  mutation InitializeCompanySequences($companyId: ID!) {
    initializeCompanySequences(companyId: $companyId) {
      id
      sequenceType
      currentNumber
      nextNumber
      lastUpdated
    }
  }
`;
export const CREATE_PAYMENT_METHOD = gql`
  mutation CreatePaymentMethod($input: CreatePaymentMethodInput!) {
    createPaymentMethod(input: $input) {
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

export const UPDATE_PAYMENT_METHOD = gql`
  mutation UpdatePaymentMethod($input: UpdatePaymentMethodInput!) {
    updatePaymentMethod(input: $input) {
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
export const SET_DEFAULT_PAYMENT_METHOD = gql`
  mutation SetDefaultPaymentMethod($id: ID!) {
    setDefaultPaymentMethod(id: $id) {
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

export const ACTIVATE_PAYMENT_METHOD = gql`
  mutation ActivatePaymentMethod($id: ID!) {
    activatePaymentMethod(id: $id) {
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
export const DEACTIVATE_PAYMENT_METHOD = gql`
  mutation DeactivatePaymentMethod($id: ID!) {
    deactivatePaymentMethod(id: $id) {
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

export const DELETE_CLIENT = gql`
  mutation DeleteClient($id: ID!) {
    deleteClient(id: $id)
  }
`;

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($id: ID!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) {
      id
      name
      nameEn
      eik
      vatNumber
      address
      phone
      email
      website
      isVatRegistered
      taxRegistrationDate
      logoUrl
      companyStampUrl
      signatureUrl
      invoiceFooter
      invoiceFooterEn
      defaultPaymentTerms
      compiledBy
    }
  }
`;
export const UPDATE_CLIENT = gql`
  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {
    updateClient(id: $id, input: $input) {
      id
      name
      nameEn
      eik
      vatNumber
      address
      email
      phone
      website
      clientType
      isEuVatPayer
      isIndividual
      isActive
      paymentTerms
      creditLimit
      discountPercent
      notes
      createdAt
      updatedAt
    }
  }
`;
export const CREATE_VAT_RATE = gql`
  mutation CreateVatRate($input: CreateVatRateInput!) {
    createVatRate(input: $input) {
      id
      rateValue
      rateName
      rateNameEn
      description
      isDefault
      isActive
      sortOrder
      formattedRate
    }
  }
`;

export const UPDATE_VAT_RATE = gql`
  mutation UpdateVatRate($input: UpdateVatRateInput!) {
    updateVatRate(input: $input) {
      id
      rateValue
      rateName
      rateNameEn
      description
      isDefault
      isActive
      sortOrder
      formattedRate
    }
  }
`;

export const CREATE_VAT_EXEMPTION_REASON = gql`
  mutation CreateVatExemptionReason($input: CreateVatExemptionReasonInput!) {
    createVatExemptionReason(input: $input) {
      id
      reasonCode
      reasonName
      reasonNameEn
      legalBasis
      legalBasisEn
      description
      isActive
      sortOrder
    }
  }
`;

export const UPDATE_VAT_EXEMPTION_REASON = gql`
  mutation UpdateVatExemptionReason($input: UpdateVatExemptionReasonInput!) {
    updateVatExemptionReason(input: $input) {
      id
      reasonCode
      reasonName
      reasonNameEn
      legalBasis
      legalBasisEn
      description
      isActive
      sortOrder
    }
  }
`;

export const SYNC_EXCHANGE_RATES = gql`
  mutation SyncExchangeRates {
    syncExchangeRates {
      success
      message
      ratesCount
    }
  }
`;

export const SYNC_HISTORICAL_RATES = gql`
  mutation SyncHistoricalRates($fromDate: String!, $toDate: String!) {
    syncHistoricalRates(fromDate: $fromDate, toDate: $toDate) {
      success
      message
      ratesCount
      fromDate
      toDate
    }
  }
`;

export const CLEAR_ALL_EXCHANGE_RATES = gql`
  mutation ClearAllExchangeRates {
    clearAllExchangeRates {
      eurozoneActive
      baseCurrency
      activeProvider
    }
  }
`;

export const SET_EUROZONE_MODE = gql`
  mutation SetEurozoneMode($forceEurozoneMode: Boolean!) {
    setEurozoneMode(forceEurozoneMode: $forceEurozoneMode) {
      success
      message
      eurozoneActive
      baseCurrency
    }
  }
`;

export const TOGGLE_CURRENCY_ACTIVE = gql`
  mutation ToggleCurrencyActive($code: String!) {
    toggleCurrencyActive(code: $code) {
      code
      name
      symbol
      isActive
    }
  }
`;

export const ACTIVATE_CURRENCY = gql`
  mutation ActivateCurrency($code: String!) {
    activateCurrency(code: $code) {
      code
      name
      symbol
      isActive
    }
  }
`;

export const DEACTIVATE_CURRENCY = gql`
  mutation DeactivateCurrency($code: String!) {
    deactivateCurrency(code: $code) {
      code
      name
      symbol
      isActive
    }
  }
`;

export const ACTIVATE_ITEM = gql`
  mutation ActivateItem($id: ID!) {
    activateItem(id: $id) {
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

export const DEACTIVATE_ITEM = gql`
  mutation DeactivateItem($id: ID!) {
    deactivateItem(id: $id) {
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

export const DELETE_ITEM = gql`
  mutation DeleteItem($id: ID!) {
    deleteItem(id: $id)
  }
`;

export const DELETE_VAT_RATE = gql`
  mutation DeleteVatRate($id: ID!) {
    deleteVatRate(id: $id)
  }
`;

export const DELETE_VAT_EXEMPTION_REASON = gql`
  mutation DeleteVatExemptionReason($id: ID!) {
    deleteVatExemptionReason(id: $id)
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
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

export const CHANGE_USER_PASSWORD = gql`
  mutation ChangeUserPassword($input: ChangeUserPasswordInput!) {
    changeUserPassword(input: $input)
  }
`;

export const ACTIVATE_USER = gql`
  mutation ActivateUser($userId: ID!) {
    activateUser(userId: $userId) {
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

export const DEACTIVATE_USER = gql`
  mutation DeactivateUser($userId: ID!) {
    deactivateUser(userId: $userId) {
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
export const INITIALIZE_SUPER_ADMIN = gql`
  mutation InitializeSuperAdmin {
    initializeSuperAdmin
  }
`;

export const RESET_SUPER_ADMIN_PASSWORD = gql`
  mutation ResetSuperAdminPassword {
    resetSuperAdminPassword
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const CREATE_COMPANY = gql`
  mutation CreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
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

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
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

// SMTP Settings mutations
export const CREATE_SMTP_SETTINGS = gql`
  mutation CreateSmtpSettings($input: CreateSmtpSettingsInput!) {
    createSmtpSettings(input: $input) {
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

export const UPDATE_SMTP_SETTINGS = gql`
  mutation UpdateSmtpSettings($id: ID!, $input: UpdateSmtpSettingsInput!) {
    updateSmtpSettings(id: $id, input: $input) {
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

export const DELETE_SMTP_SETTINGS = gql`
  mutation DeleteSmtpSettings($id: ID!) {
    deleteSmtpSettings(id: $id)
  }
`;

export const ACTIVATE_SMTP_SETTINGS = gql`
  mutation ActivateSmtpSettings($id: ID!) {
    activateSmtpSettings(id: $id) {
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

export const TEST_SMTP_CONNECTION = gql`
  mutation TestSmtpSettings($id: ID!) {
    testSmtpSettings(id: $id) {
      success
      message
    }
  }
`;

// Password Reset mutations
export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      success
      message
    }
  }
`;

export const VALIDATE_RESET_TOKEN = gql`
  query ValidateResetToken($token: String!) {
    validatePasswordResetToken(token: $token) {
      valid
      message
    }
  }
`;

export const CREATE_DOCUMENT = gql`
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      id
      documentNumber
      documentType
      issueDate
      vatDate
      dueDate
      status
      totalAmountWithVat
      currencyCode
      notes
      client {
        id
        name
      }
      paymentMethod {
        id
        name
      }
      bankAccount {
        id
        bankName
        iban
      }
      documentItems {
        id
        itemDescription
        quantity
        unitPrice
        vatRate
        vatExemptionReason {
          id
          reasonName
          legalBasis
        }
        lineTotal
        vatAmount
      }
    }
  }
`;

export const UPDATE_DOCUMENT_STATUS = gql`
  mutation UpdateDocumentStatus($documentId: ID!, $status: DocumentStatus!) {
    updateDocumentStatus(documentId: $documentId, status: $status) {
      id
      status
    }
  }
`;

export const MARK_DOCUMENT_AS_PAID = gql`
  mutation MarkDocumentAsPaid($documentId: ID!, $paidAt: String) {
    markDocumentAsPaid(documentId: $documentId, paidAt: $paidAt) {
      id
      isPaid
      paidAt
    }
  }
`;

export const CANCEL_DOCUMENT = gql`
  mutation CancelDocument($documentId: ID!, $reason: String) {
    cancelDocument(documentId: $documentId, reason: $reason) {
      id
      status
      cancelledAt
      cancellationReason
      isCancelled
    }
  }
`;

export const REVERT_TO_DRAFT = gql`
  mutation RevertToDraft($documentId: ID!) {
    revertToDraft(documentId: $documentId) {
      id
      status
      cancelledAt
      cancellationReason
      isCancelled
    }
  }
`;

export const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDocument(id: $id, input: $input) {
      id
      documentNumber
      documentType
      issueDate
      vatDate
      dueDate
      status
      totalAmountWithVat
      currencyCode
      notes
      client {
        id
        name
      }
      paymentMethod {
        id
        name
      }
      bankAccount {
        id
        bankName
        iban
      }
      documentItems {
        id
        itemDescription
        quantity
        unitPrice
        vatRate
        vatExemptionReason {
          id
          reasonName
          legalBasis
        }
        lineTotal
        vatAmount
      }
    }
  }
`;

// Backup Settings mutations
export const SAVE_BACKUP_SETTINGS = gql`
  mutation SaveBackupSettings($input: BackupSettingsInput!) {
    saveBackupSettings(input: $input) {
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
      hasValidConfiguration
    }
  }
`;

export const TEST_BACKUP_CONNECTION = gql`
  mutation TestBackupConnection {
    testBackupConnection
  }
`;

export const CREATE_MANUAL_BACKUP = gql`
  mutation CreateManualBackup {
    createManualBackup {
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
      initiatedBy
      formattedSize
    }
  }
`;

export const DELETE_BACKUP = gql`
  mutation DeleteBackup($id: ID!) {
    deleteBackup(id: $id)
  }
`;

export const GET_BACKUP_DOWNLOAD_URL = gql`
  mutation GetBackupDownloadUrl($id: ID!) {
    getBackupDownloadUrl(id: $id)
  }
`;

export const SEND_DOCUMENT_BY_EMAIL = gql`
  mutation SendDocumentByEmail($input: SendDocumentEmailInput!) {
    sendDocumentByEmail(input: $input) {
      success
      message
    }
  }
`;

export const COPY_DOCUMENT = gql`
  mutation CopyDocument($input: CopyDocumentInput!) {
    copyDocument(input: $input) {
      id
      documentNumber
      documentType
      issueDate
      vatDate
      dueDate
      status
      totalAmountWithVat
      subtotalAmount
      vatAmount
      currencyCode
      notes
      client {
        id
        name
      }
      paymentMethod {
        id
        name
      }
      bankAccount {
        id
        bankName
        iban
      }
      documentItems {
        id
        itemDescription
        quantity
        unitPrice
        vatRate
        vatExemptionReason {
          id
          reasonName
          legalBasis
        }
        lineTotal
        vatAmount
      }
    }
  }
`;