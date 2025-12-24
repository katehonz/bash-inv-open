package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.dataloader.DataLoaderConfig;
import com.invoiceapp.backend.model.*;
import com.invoiceapp.backend.model.dto.CreateDocumentInput;
import com.invoiceapp.backend.model.dto.CopyDocumentInput;
import com.invoiceapp.backend.model.dto.ClientDocumentsCount;
import com.invoiceapp.backend.model.dto.DashboardStats;
import com.invoiceapp.backend.model.dto.SendDocumentEmailInput;
import com.invoiceapp.backend.model.dto.EmailResult;
import com.invoiceapp.backend.repository.DocumentNumberSequenceRepository;
import com.invoiceapp.backend.service.DocumentNumberService;
import com.invoiceapp.backend.service.DocumentService;
import com.invoiceapp.backend.service.EmailService;
import com.invoiceapp.backend.service.export.UblExportService;
import com.invoiceapp.backend.model.dto.UblExportResult;
import graphql.schema.DataFetchingEnvironment;
import org.dataloader.DataLoader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * GraphQL контролер за управление на документи
 * Предоставя queries и mutations за работа с документи и номерации
 */
@Controller
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private DocumentNumberService numberService;

    @Autowired
    private DocumentNumberSequenceRepository sequenceRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UblExportService ublExportService;

    // ========== QUERIES ==========

    /**
     * Експортира документ като UBL 2.1 XML
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessDocument(authentication, #documentId)")
    public UblExportResult exportDocumentAsUbl(@Argument Long documentId) {
        return documentService.findDocumentById(documentId)
            .map(doc -> {
                try {
                    String xml = ublExportService.exportToUbl(doc);
                    String base64Xml = java.util.Base64.getEncoder().encodeToString(xml.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    return new UblExportResult(true, base64Xml, "ubl-" + doc.getDocumentNumber() + ".xml", "Success");
                } catch (Exception e) {
                    return new UblExportResult(false, null, null, "Error: " + e.getMessage());
                }
            })
            .orElse(new UblExportResult(false, null, null, "Document not found"));
    }

    /**
     * Намира всички документи на фирма
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Document> documentsByCompany(@Argument Long companyId) {
        return documentService.findDocumentsByCompany(companyId);
    }

    /**
     * Намира документи по тип
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Document> documentsByType(@Argument Long companyId, @Argument DocumentType documentType) {
        return documentService.findDocumentsByCompanyAndType(companyId, documentType);
    }

    /**
     * Намира документи по статус
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Document> documentsByStatus(@Argument Long companyId, @Argument DocumentStatus status) {
        return documentService.findDocumentsByStatus(companyId, status);
    }

    /**
     * Намира документ по ID
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessDocument(authentication, #id)")
    public Optional<Document> documentById(@Argument Long id) {
        return documentService.findDocumentById(id);
    }

    /**
     * Намира документ по номер
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public Optional<Document> documentByNumber(@Argument Long companyId, @Argument String documentNumber) {
        return documentService.findDocumentByNumber(companyId, documentNumber);
    }

    /**
     * Намира всички данъчни документи
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Document> taxDocuments(@Argument Long companyId) {
        return documentService.findTaxDocuments(companyId);
    }

    /**
     * Trova всички неданъчни документи
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Document> nonTaxDocuments(@Argument Long companyId) {
        return documentService.findNonTaxDocuments(companyId);
    }

    /**
     * Намира просрочени документи
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Document> overdueDocuments(@Argument Long companyId) {
        return documentService.findOverdueDocuments(companyId);
    }

    /**
     * Получава следващия номер на документ
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public String nextDocumentNumber(@Argument Long companyId, @Argument DocumentType documentType) {
        return documentService.getNextDocumentNumber(companyId, documentType);
    }

    /**
     * Получава статистики за документи на дадена фирма
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public DocumentStatistics documentStatistics(@Argument Long companyId) {
        return documentService.getDocumentStatistics(companyId);
    }

    /**
     * Получава всички номерации за дадена фирма
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<DocumentNumberSequence> documentSequences(@Argument Long companyId) {
        return sequenceRepository.findByCompanyIdOrderBySequenceType(companyId);
    }

    /**
     * Брои документите на клиент
     */
    @QueryMapping
    public ClientDocumentsCount clientDocumentsCount(@Argument Long clientId) {
        long totalDocuments = documentService.countDocumentsByClient(clientId);
        return new ClientDocumentsCount(totalDocuments, totalDocuments > 0);
    }

    /**
     * Получава статистики за dashboard на дадена фирма
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public DashboardStats dashboardStats(@Argument Long companyId) {
        return documentService.getDashboardStatistics(companyId);
    }

    // ========== MUTATIONS ==========

    /**
     * Създава нов документ
     */
    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #input.getCompanyId())")
    public Document createDocument(@Argument CreateDocumentInput input) {
        input.validate();
        
        return documentService.createDocument(input);
    }

    /**
     * Обновява статуса на документ
     */
    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessDocument(authentication, #documentId)")
    public Document updateDocumentStatus(@Argument Long documentId, @Argument DocumentStatus status) {
        return documentService.updateDocumentStatus(documentId, status);
    }

    /**
     * Приключва документ (променя статуса на FINAL)
     */
    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessDocument(authentication, #documentId)")
    public Document finalizeDocument(@Argument Long documentId) {
        return documentService.finalizeDocument(documentId);
    }

    /**
     * Връща документ в чернова (променя статуса на DRAFT)
     */
    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessDocument(authentication, #documentId)")
    public Document returnToDraft(@Argument Long documentId) {
        return documentService.returnToDraft(documentId);
    }

    /**
     * Маркира документ като платен с дата на плащане
     */
    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessDocument(authentication, #documentId)")
    public Document markDocumentAsPaid(@Argument Long documentId, @Argument String paidAt) {
        LocalDateTime paidDateTime = null;
        if (paidAt != null && !paidAt.isEmpty()) {
            paidDateTime = LocalDate.parse(paidAt).atStartOfDay();
        } else {
            paidDateTime = LocalDateTime.now();
        }
        return documentService.markDocumentAsPaid(documentId, paidDateTime);
    }

    /**
     * Анулира документ (променя статуса на CANCELLED)
     */
    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessDocument(authentication, #documentId)")
    public Document cancelDocument(@Argument Long documentId, @Argument String reason) {
        return documentService.cancelDocument(documentId, reason);
    }

    /**
     * Връща анулиран документ в чернова (променя статуса на DRAFT)
     */
    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessDocument(authentication, #documentId)")
    public Document revertToDraft(@Argument Long documentId) {
        return documentService.revertCancelledToDraft(documentId);
    }

    /**
     * Копира документ в нов документ от друг (или същия) тип.
     * Поддържа:
     * - Проформа → Фактура
     * - Фактура → Кредитно известие (с обръщане на знака)
     * - Фактура → Дебитно известие
     * - Всеки документ → същия тип (дублиране)
     */
    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessDocument(authentication, #input.getSourceDocumentId())")
    public Document copyDocument(@Argument CopyDocumentInput input) {
        return documentService.copyDocument(input);
    }

    /**
     * Инициализира номерации за фирма
     */
    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN') and @customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<DocumentNumberSequence> initializeCompanySequences(@Argument Long companyId) {
        numberService.initializeSequencesForCompany(companyId);
        return sequenceRepository.findByCompanyIdOrderBySequenceType(companyId);
    }

    /**
     * Рестартира последователност
     */
    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN') and @customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public DocumentNumberSequence resetSequence(@Argument Long companyId, @Argument SequenceType sequenceType, @Argument Long newStartNumber) {
        numberService.resetSequence(companyId, sequenceType, newStartNumber);
        return sequenceRepository.findByCompanyIdAndSequenceType(companyId, sequenceType)
            .orElseThrow(() -> new RuntimeException("Sequence not found after reset"));
    }

    /**
     * Изпраща документ по имейл с прикачен PDF (и опционално UBL XML за ERP интеграция)
     */
    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessDocument(authentication, #input.getDocumentId())")
    public EmailResult sendDocumentByEmail(@Argument SendDocumentEmailInput input) {
        try {
            // Намираме документа
            Document document = documentService.findDocumentById(input.getDocumentId())
                .orElseThrow(() -> new RuntimeException("Документът не е намерен"));

            // Проверяваме дали документът е финализиран
            if (document.getStatus() == DocumentStatus.DRAFT) {
                return new EmailResult(false, "Не може да се изпрати документ в чернова");
            }

            // Декодираме PDF от base64
            byte[] pdfData = java.util.Base64.getDecoder().decode(input.getPdfBase64());

            // Генерираме име на PDF файла
            String pdfFilename = String.format("%s-%s.pdf",
                document.getDocumentType().name().toLowerCase(),
                document.getDocumentNumber());

            // Генерираме тема на имейла
            String subject = String.format("Документ %s-%s от %s",
                getDocumentTypeLabel(document.getDocumentType()),
                document.getDocumentNumber(),
                document.getCompany().getName());

            // Генерираме HTML съдържание
            boolean includeUbl = Boolean.TRUE.equals(input.getIncludeUblXml());
            String htmlContent = buildDocumentEmailContent(document, includeUbl);

            boolean success;

            // Ако е заявен UBL XML, прикачваме и него
            if (includeUbl) {
                // Генерираме UBL XML
                String ublXml = ublExportService.exportToUbl(document);
                String ublFilename = String.format("ubl-%s-%s.xml",
                    document.getDocumentType().name().toLowerCase(),
                    document.getDocumentNumber());

                success = emailService.sendDocumentEmailWithUbl(
                    input.getRecipientEmail(),
                    subject,
                    htmlContent,
                    pdfData,
                    pdfFilename,
                    ublXml,
                    ublFilename
                );
            } else {
                success = emailService.sendDocumentEmail(
                    input.getRecipientEmail(),
                    subject,
                    htmlContent,
                    pdfData,
                    pdfFilename
                );
            }

            if (success) {
                String message = includeUbl
                    ? "Документът е изпратен успешно с PDF и UBL XML на " + input.getRecipientEmail()
                    : "Документът е изпратен успешно на " + input.getRecipientEmail();
                return new EmailResult(true, message);
            } else {
                return new EmailResult(false, "Грешка при изпращане на имейла. Проверете SMTP настройките.");
            }

        } catch (IllegalArgumentException e) {
            return new EmailResult(false, "Невалиден PDF формат");
        } catch (Exception e) {
            return new EmailResult(false, "Грешка: " + e.getMessage());
        }
    }

    private String getDocumentTypeLabel(DocumentType type) {
        switch (type) {
            case INVOICE: return "Фактура";
            case CREDIT_NOTE: return "Кредитно известие";
            case DEBIT_NOTE: return "Дебитно известие";
            case PROFORMA: return "Проформа";
            default: return type.name();
        }
    }

    private String buildDocumentEmailContent(Document document, boolean includeUbl) {
        String typeLabel = getDocumentTypeLabel(document.getDocumentType());
        String attachmentInfo = includeUbl
            ? "Прикачени са PDF и UBL XML файлове. UBL XML файлът може да бъде импортиран директно във вашата ERP система."
            : "Моля, вижте прикачения PDF файл за пълна информация.";

        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>%s</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { padding: 20px; font-size: 12px; color: #666; text-align: center; }
                    .details { background-color: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
                    .amount { font-size: 24px; color: #2196F3; font-weight: bold; }
                    .ubl-info { background-color: #e3f2fd; padding: 10px; border-left: 4px solid #2196F3; margin: 15px 0; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>%s %s</h1>
                    </div>
                    <div class="content">
                        <p>Уважаеми клиенти,</p>
                        <p>Прикачено ще намерите %s с номер <strong>%s</strong>.</p>
                        <div class="details">
                            <p><strong>Издател:</strong> %s</p>
                            <p><strong>Дата на издаване:</strong> %s</p>
                            <p><strong>Срок за плащане:</strong> %s</p>
                            <p class="amount">Сума: %s %s</p>
                        </div>
                        <p>%s</p>
                    </div>
                    <div class="footer">
                        <p>С уважение,<br>%s</p>
                        <p>Този имейл е изпратен автоматично.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            typeLabel + " " + document.getDocumentNumber(),
            typeLabel,
            document.getDocumentNumber(),
            typeLabel.toLowerCase(),
            document.getDocumentNumber(),
            document.getCompany().getName(),
            document.getIssueDate().toString(),
            document.getDueDate().toString(),
            document.getTotalAmountWithVat().toString(),
            document.getCurrencyCode(),
            attachmentInfo,
            document.getCompany().getName()
        );
    }

    // ========== СТАТИСТИКИ ==========

    /**
     * Получава броя документи по тип
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public long documentCount(@Argument Long companyId, @Argument DocumentType documentType) {
        return documentService.countDocumentsByType(companyId, documentType);
    }

    /**
     * Получава текущия номер на последователност
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public String currentSequenceNumber(@Argument Long companyId, @Argument SequenceType sequenceType) {
        return numberService.getCurrentNumber(companyId, sequenceType);
    }

    /**
     * Проверява дали съществува последователност
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public boolean sequenceExists(@Argument Long companyId, @Argument SequenceType sequenceType) {
        return numberService.sequenceExists(companyId, sequenceType);
    }

    // ========== SCHEMA MAPPINGS ==========

    /**
     * GraphQL schema mapping за totalAmount - връща totalAmountWithVat
     */
    @SchemaMapping(typeName = "Document", field = "totalAmount")
    public BigDecimal totalAmount(Document document) {
        return document.getTotalAmountWithVat();
    }

    /**
     * GraphQL schema mapping за fullDocumentNumber - комбинира типа и номера
     */
    @SchemaMapping(typeName = "Document", field = "fullDocumentNumber")
    public String fullDocumentNumber(Document document) {
        if (document.getDocumentType() == null || document.getDocumentNumber() == null) {
            return "";
        }
        return document.getDocumentType().name() + "-" + document.getDocumentNumber();
    }

    /**
     * GraphQL schema mapping за isTaxDocument - проверява дали е данъчен документ
     */
    @SchemaMapping(typeName = "Document", field = "isTaxDocument")
    public boolean isTaxDocument(Document document) {
        if (document.getDocumentType() == null) {
            return false;
        }
        return document.getDocumentType() == DocumentType.INVOICE ||
               document.getDocumentType() == DocumentType.CREDIT_NOTE ||
               document.getDocumentType() == DocumentType.DEBIT_NOTE;
    }

    /**
     * GraphQL schema mapping за hasValidVatDate - проверява дали има валидна VAT дата
     */
    @SchemaMapping(typeName = "Document", field = "hasValidVatDate")
    public boolean hasValidVatDate(Document document) {
        return document.getVatDate() != null;
    }

    /**
     * GraphQL schema mapping за effectiveVatDate - връща VAT дата или дата на издаване
     */
    @SchemaMapping(typeName = "Document", field = "effectiveVatDate")
    public String effectiveVatDate(Document document) {
        if (document.getVatDate() != null) {
            return document.getVatDate().toString();
        }
        if (document.getIssueDate() != null) {
            return document.getIssueDate().toString();
        }
        return null;
    }

    /**
     * GraphQL schema mapping за isNonTaxDocument - проверява дали е неданъчен документ
     */
    @SchemaMapping(typeName = "Document", field = "isNonTaxDocument")
    public boolean isNonTaxDocument(Document document) {
        if (document.getDocumentType() == null) {
            return false;
        }
        return document.getDocumentType() == DocumentType.PROFORMA;
    }

    /**
     * GraphQL schema mapping за isPaid - проверява дали документът е платен
     * CASH и CARD са автоматично платени, иначе проверява paidAt
     */
    @SchemaMapping(typeName = "Document", field = "isPaid")
    public boolean isPaid(Document document) {
        return document.isPaid();
    }

    /**
     * GraphQL schema mapping за paidAt - връща дата на плащане
     */
    @SchemaMapping(typeName = "Document", field = "paidAt")
    public String paidAt(Document document) {
        if (document.getPaidAt() != null) {
            return document.getPaidAt().toLocalDate().toString();
        }
        return null;
    }

    /**
     * GraphQL schema mapping за isCancelled - проверява дали документът е анулиран
     */
    @SchemaMapping(typeName = "Document", field = "isCancelled")
    public boolean isCancelled(Document document) {
        return document.isCancelled();
    }

    /**
     * GraphQL schema mapping за cancelledAt - връща дата на анулиране
     */
    @SchemaMapping(typeName = "Document", field = "cancelledAt")
    public String cancelledAt(Document document) {
        if (document.getCancelledAt() != null) {
            return document.getCancelledAt().toString();
        }
        return null;
    }

    /**
     * GraphQL schema mapping за cancellationReason - връща причина за анулиране
     */
    @SchemaMapping(typeName = "Document", field = "cancellationReason")
    public String cancellationReason(Document document) {
        return document.getCancellationReason();
    }

    // ========== DATALOADER-BASED SCHEMA MAPPINGS ==========

    /**
     * DataLoader-based resolver for Document.client
     * Batches multiple client lookups into a single database query
     */
    @SchemaMapping(typeName = "Document", field = "client")
    public CompletableFuture<Client> client(Document document, DataFetchingEnvironment env) {
        // If client is already loaded (not a proxy), return it directly
        if (document.getClient() != null && org.hibernate.Hibernate.isInitialized(document.getClient())) {
            return CompletableFuture.completedFuture(document.getClient());
        }

        DataLoader<Long, Client> dataLoader = env.getDataLoader(DataLoaderConfig.CLIENT_BY_ID);
        Long clientId = document.getClientId();
        if (clientId == null) {
            return CompletableFuture.completedFuture(null);
        }
        return dataLoader.load(clientId);
    }

    /**
     * DataLoader-based resolver for Document.company
     * Batches multiple company lookups into a single database query
     */
    @SchemaMapping(typeName = "Document", field = "company")
    public CompletableFuture<Company> company(Document document, DataFetchingEnvironment env) {
        // If company is already loaded, return it directly
        if (document.getCompany() != null && org.hibernate.Hibernate.isInitialized(document.getCompany())) {
            return CompletableFuture.completedFuture(document.getCompany());
        }

        DataLoader<Long, Company> dataLoader = env.getDataLoader(DataLoaderConfig.COMPANY_BY_ID);
        Company company = document.getCompany();
        if (company == null) {
            return CompletableFuture.completedFuture(null);
        }
        return dataLoader.load(company.getId());
    }

    /**
     * DataLoader-based resolver for Document.documentItems
     * Batches multiple document items lookups into a single database query
     */
    @SchemaMapping(typeName = "Document", field = "documentItems")
    public CompletableFuture<List<DocumentItem>> documentItems(Document document, DataFetchingEnvironment env) {
        // If items are already loaded, return them directly
        if (document.getDocumentItems() != null && org.hibernate.Hibernate.isInitialized(document.getDocumentItems())) {
            return CompletableFuture.completedFuture(document.getDocumentItems());
        }

        DataLoader<Long, List<DocumentItem>> dataLoader = env.getDataLoader(DataLoaderConfig.DOCUMENT_ITEMS_BY_DOCUMENT_ID);
        return dataLoader.load(document.getId());
    }

    /**
     * DataLoader-based resolver for Document.paymentMethod
     * Batches multiple payment method lookups into a single database query
     */
    @SchemaMapping(typeName = "Document", field = "paymentMethod")
    public CompletableFuture<PaymentMethod> paymentMethod(Document document, DataFetchingEnvironment env) {
        // If payment method is already loaded, return it directly
        if (document.getPaymentMethod() != null && org.hibernate.Hibernate.isInitialized(document.getPaymentMethod())) {
            return CompletableFuture.completedFuture(document.getPaymentMethod());
        }

        PaymentMethod pm = document.getPaymentMethod();
        if (pm == null) {
            return CompletableFuture.completedFuture(null);
        }

        DataLoader<Long, PaymentMethod> dataLoader = env.getDataLoader(DataLoaderConfig.PAYMENT_METHOD_BY_ID);
        return dataLoader.load(pm.getId());
    }

    /**
     * DataLoader-based resolver for Document.bankAccount
     * Batches multiple bank account lookups into a single database query
     */
    @SchemaMapping(typeName = "Document", field = "bankAccount")
    public CompletableFuture<BankAccount> bankAccount(Document document, DataFetchingEnvironment env) {
        // If bank account is already loaded, return it directly
        if (document.getBankAccount() != null && org.hibernate.Hibernate.isInitialized(document.getBankAccount())) {
            return CompletableFuture.completedFuture(document.getBankAccount());
        }

        BankAccount ba = document.getBankAccount();
        if (ba == null) {
            return CompletableFuture.completedFuture(null);
        }

        DataLoader<Long, BankAccount> dataLoader = env.getDataLoader(DataLoaderConfig.BANK_ACCOUNT_BY_ID);
        return dataLoader.load(ba.getId());
    }
}