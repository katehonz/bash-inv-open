package com.invoiceapp.backend.service;

import com.invoiceapp.backend.config.CurrencyConfiguration;
import com.invoiceapp.backend.model.*;
import com.invoiceapp.backend.model.dto.CreateDocumentInput;
import com.invoiceapp.backend.model.dto.CopyDocumentInput;
import com.invoiceapp.backend.model.dto.DocumentItemInput;
import com.invoiceapp.backend.model.dto.DashboardStats;
import com.invoiceapp.backend.model.dto.RecentInvoice;
import com.invoiceapp.backend.model.dto.MonthlyRevenue;
import com.invoiceapp.backend.repository.ClientRepository;
import com.invoiceapp.backend.repository.CompanyRepository;
import com.invoiceapp.backend.repository.CurrencyRepository;
import com.invoiceapp.backend.repository.DocumentRepository;
import com.invoiceapp.backend.repository.ItemRepository;
import com.invoiceapp.backend.repository.PaymentMethodRepository;
import com.invoiceapp.backend.repository.BankAccountRepository;
import com.invoiceapp.backend.repository.VatExemptionReasonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service за управление на документи
 * Съдържа бизнес логика за създаване, обновяване и управление на документи
 */
@Service
@Transactional
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private DocumentNumberService numberService;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private CurrencyRepository currencyRepository;

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private VatExemptionReasonRepository vatExemptionReasonRepository;

    @Autowired
    private ExchangeRateService exchangeRateService;
    
    @Autowired
    private CurrencyConfiguration currencyConfig;

    /**
     * Създава нов документ заедно с неговите артикули.
     * @param input DTO съдържащо данните за документа и артикулите
     * @return създадения документ
     */
    public Document createDocument(CreateDocumentInput input) {
        // Валидацията вече е направена в DTO-то

        Company company = companyRepository.findById(input.getCompanyId())
                .orElseThrow(() -> new IllegalArgumentException("Company not found with id: " + input.getCompanyId()));

        Client client = clientRepository.findById(input.getClientId())
                .orElseThrow(() -> new IllegalArgumentException("Client not found with id: " + input.getClientId()));

        String currencyCode = (input.getCurrencyCode() == null || input.getCurrencyCode().isBlank())
                                ? currencyConfig.getDefaultCurrency()
                                : input.getCurrencyCode().toUpperCase();

        Currency currency = currencyRepository.findByCode(currencyCode)
                .orElseThrow(() -> new IllegalArgumentException("Currency not found for code: " + currencyCode));

        if (!client.getCompany().getId().equals(company.getId())) {
            throw new IllegalStateException("Client does not belong to the specified company");
        }

        String documentNumber = numberService.generateNextNumber(company.getId(), input.getDocumentType());

        Document document = new Document();
        document.setCompany(company);
        document.setClient(client);
        document.setCurrency(currency);
        document.setDocumentType(input.getDocumentType());
        document.setDocumentNumber(documentNumber);
        document.setIssueDate(input.getIssueDate());
        document.setDueDate(input.getDueDate());
        if (document.isTaxDocument()) {
            document.setVatDate(input.getVatDate());
        }

        // Set optional fields
        if (input.getNotes() != null) {
            document.setNotes(input.getNotes());
        }

        if (input.getPaymentMethodId() != null) {
            PaymentMethod paymentMethod = paymentMethodRepository.findById(input.getPaymentMethodId())
                    .orElseThrow(() -> new IllegalArgumentException("Payment method not found with id: " + input.getPaymentMethodId()));
            document.setPaymentMethod(paymentMethod);
        }

        if (input.getBankAccountId() != null) {
            BankAccount bankAccount = bankAccountRepository.findById(input.getBankAccountId())
                    .orElseThrow(() -> new IllegalArgumentException("Bank account not found with id: " + input.getBankAccountId()));
            document.setBankAccount(bankAccount);
        }

        List<DocumentItem> documentItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        for (DocumentItemInput itemInput : input.getItems()) {
            Item item = itemRepository.findById(itemInput.getItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Item not found with id: " + itemInput.getItemId()));

            DocumentItem docItem = new DocumentItem();
            docItem.setDocument(document); // Set back-reference
            docItem.setItem(item);
            docItem.setItemDescription(itemInput.getItemDescription() != null ? itemInput.getItemDescription() : item.getName());
            docItem.setQuantity(itemInput.getQuantity());
            docItem.setUnitPrice(itemInput.getUnitPrice());
            docItem.setVatRate(itemInput.getVatRate());

            if (itemInput.getVatExemptionReasonId() != null) {
                VatExemptionReason reason = vatExemptionReasonRepository.findById(itemInput.getVatExemptionReasonId())
                        .orElseThrow(() -> new IllegalArgumentException("VatExemptionReason not found with id: " + itemInput.getVatExemptionReasonId()));
                docItem.setVatExemptionReason(reason);
            }
            
            // Calculate amounts for the line item
            docItem.calculateAmounts();

            subtotal = subtotal.add(docItem.getLineTotal());
            totalVat = totalVat.add(docItem.getVatAmount());

            documentItems.add(docItem);
        }

        BigDecimal totalWithVat = subtotal.add(totalVat);

        // Set amounts in document currency
        document.setSubtotalAmount(subtotal);
        document.setVatAmount(totalVat);
        document.setTotalAmountWithVat(totalWithVat);

        // --- NEW CURRENCY CONVERSION LOGIC ---
        handleCurrencyConversion(document, currencyCode, document.getIssueDate());

        document.setDocumentItems(documentItems);

        return documentRepository.save(document);
    }

    /**
     * Обновява статуса на документ
     * @param documentId ID на документа
     * @param newStatus новия статус
     * @return обновения документ
     */
    public Document updateDocumentStatus(Long documentId, DocumentStatus newStatus) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + documentId));
        
        validateStatusChange(document.getStatus(), newStatus);
        
        document.setStatus(newStatus);
        return documentRepository.save(document);
    }

    /**
     * Намира всички документи на фирма
     * @param companyId ID на фирмата
     * @return списък с документи
     */
    @Transactional(readOnly = true)
    public List<Document> findDocumentsByCompany(Long companyId) {
        return documentRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
    }

    /**
     * Намира документи по фирма и тип
     * @param companyId ID на фирмата
     * @param documentType тип на документа
     * @return списък с документи
     */
    @Transactional(readOnly = true)
    public List<Document> findDocumentsByCompanyAndType(Long companyId, DocumentType documentType) {
        return documentRepository.findByCompanyIdAndDocumentTypeOrderByCreatedAtDesc(companyId, documentType);
    }

    /**
     * Намира документи по статус
     * @param companyId ID на фирмата
     * @param status статус на документа
     * @return списък с документи
     */
    @Transactional(readOnly = true)
    public List<Document> findDocumentsByStatus(Long companyId, DocumentStatus status) {
        return documentRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, status);
    }

    /**
     * Намира документ по ID
     * @param documentId ID на документа
     * @return документа или Optional.empty()
     */
    @Transactional(readOnly = true)
    public Optional<Document> findDocumentById(Long documentId) {
        return documentRepository.findById(documentId);
    }

    /**
     * Намира документ по номер в рамките на фирма
     * @param companyId ID на фирмата
     * @param documentNumber номер на документа
     * @return документа или Optional.empty()
     */
    @Transactional(readOnly = true)
    public Optional<Document> findDocumentByNumber(Long companyId, String documentNumber) {
        return documentRepository.findByCompanyIdAndDocumentNumber(companyId, documentNumber);
    }

    /**
     * Намира всички данъчни документи на фирма
     * @param companyId ID на фирмата
     * @return списък с данъчни документи
     */
    @Transactional(readOnly = true)
    public List<Document> findTaxDocuments(Long companyId) {
        return documentRepository.findTaxDocumentsByCompanyId(companyId);
    }

    /**
     * Намира всички неданъчни документи на фирма
     * @param companyId ID на фирмата
     * @return списък с неданъчни документи
     */
    @Transactional(readOnly = true)
    public List<Document> findNonTaxDocuments(Long companyId) {
        return documentRepository.findNonTaxDocumentsByCompanyId(companyId);
    }

    /**
     * Брои документи по тип
     * @param companyId ID на фирмата
     * @param documentType тип на документа
     * @return броя документи
     */
    @Transactional(readOnly = true)
    public long countDocumentsByType(Long companyId, DocumentType documentType) {
        return documentRepository.countByCompanyIdAndDocumentType(companyId, documentType);
    }

    /**
     * Намира просрочени документи
     * @param companyId ID на фирмата
     * @return списък с просрочени документи
     */
    @Transactional(readOnly = true)
    public List<Document> findOverdueDocuments(Long companyId) {
        return documentRepository.findOverdueDocumentsByCompanyId(companyId);
    }

    /**
     * Получава следващия номер на документ
     * @param companyId ID на фирмата
     * @param documentType тип на документа
     * @return следващия номер
     */
    @Transactional(readOnly = true)
    public String getNextDocumentNumber(Long companyId, DocumentType documentType) {
        return numberService.getNextNumber(companyId, documentType);
    }

    /**
     * Приключва документ (променя статуса на FINAL)
     * @param documentId ID на документа
     * @return приключения документ
     */
    public Document finalizeDocument(Long documentId) {
        return updateDocumentStatus(documentId, DocumentStatus.FINAL);
    }

    /**
     * Връща документ в чернова (променя статуса на DRAFT)
     * @param documentId ID на документа
     * @return документа
     */
    public Document returnToDraft(Long documentId) {
        return updateDocumentStatus(documentId, DocumentStatus.DRAFT);
    }

    /**
     * Маркира документ като платен с дата на плащане
     * @param documentId ID на документа
     * @param paidAt дата на плащане
     * @return документа
     */
    public Document markDocumentAsPaid(Long documentId, LocalDateTime paidAt) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + documentId));

        document.setPaidAt(paidAt);
        return documentRepository.save(document);
    }

    /**
     * Анулира документ (променя статуса на CANCELLED)
     * Може да се анулират само FINAL документи
     * @param documentId ID на документа
     * @param reason причина за анулиране (опционално)
     * @return анулирания документ
     */
    public Document cancelDocument(Long documentId, String reason) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + documentId));

        if (document.getStatus() == DocumentStatus.CANCELLED) {
            throw new IllegalStateException("Document is already cancelled");
        }

        if (document.getStatus() == DocumentStatus.DRAFT) {
            throw new IllegalStateException("Cannot cancel a draft document. Please delete it instead.");
        }

        document.setStatus(DocumentStatus.CANCELLED);
        document.setCancelledAt(LocalDateTime.now());
        document.setCancellationReason(reason);
        return documentRepository.save(document);
    }

    /**
     * Връща анулиран документ в чернова (променя статуса на DRAFT)
     * Може да се върнат в чернова само CANCELLED документи
     * @param documentId ID на документа
     * @return документа
     */
    public Document revertCancelledToDraft(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + documentId));

        if (document.getStatus() != DocumentStatus.CANCELLED) {
            throw new IllegalStateException("Only cancelled documents can be reverted to draft");
        }

        document.setStatus(DocumentStatus.DRAFT);
        document.setCancelledAt(null);
        document.setCancellationReason(null);
        return documentRepository.save(document);
    }

    /**
     * Валидира промяната на статус
     * Винаги позволява промяна между DRAFT и FINAL в двете посоки
     */
    private void validateStatusChange(DocumentStatus currentStatus, DocumentStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("New status cannot be null");
        }
        // Винаги позволяваме промяна между DRAFT и FINAL
        // Няма ограничения - бизнес потребителите могат винаги да правят корекции
    }

    /**
     * Получава статистики за документи на дадена фирма
     * @param companyId ID на фирмата
     * @return статистики за документи
     */
    @Transactional(readOnly = true)
    public DocumentStatistics getDocumentStatistics(Long companyId) {
        long totalDocuments = documentRepository.countByCompanyId(companyId);
        long draftDocuments = documentRepository.countByCompanyIdAndStatus(companyId, DocumentStatus.DRAFT);
        long finalDocuments = documentRepository.countByCompanyIdAndStatus(companyId, DocumentStatus.FINAL);
        long overdueDocuments = documentRepository.countOverdueDocumentsByCompanyId(companyId);
        long taxDocuments = documentRepository.countTaxDocumentsByCompanyId(companyId);
        long nonTaxDocuments = documentRepository.countNonTaxDocumentsByCompanyId(companyId);

        return new DocumentStatistics(
            (int) totalDocuments,
            (int) draftDocuments,
            (int) finalDocuments,
            0, // not used
            0, // not used
            (int) overdueDocuments,
            (int) taxDocuments,
            (int) nonTaxDocuments
        );
    }
    
    private void handleCurrencyConversion(Document document, String currencyCode, java.time.LocalDate date) {
        String baseCurrency = currencyConfig.getBaseCurrency(); // Should be EUR
    
        if (currencyCode.equalsIgnoreCase(baseCurrency)) {
            document.setExchangeRate(BigDecimal.ONE);
            document.setExchangeRateDate(date);
            document.setSubtotalAmountBaseCurrency(document.getSubtotalAmount());
            document.setVatAmountBaseCurrency(document.getVatAmount());
            document.setTotalAmountWithVatBaseCurrency(document.getTotalAmountWithVat());
        } else {
            ExchangeRate exchangeRate = exchangeRateService.getRate(currencyCode, date);
            if (exchangeRate == null) {
                throw new IllegalStateException("Exchange rate not found for currency " + currencyCode + " on date " + date);
            }
            
            document.setExchangeRate(exchangeRate.getRate());
            document.setExchangeRateDate(exchangeRate.getRateDate());
    
            // The rate from ECB is 1 EUR = X CUR, so we need to divide to get EUR amount
            document.setSubtotalAmountBaseCurrency(document.getSubtotalAmount().divide(exchangeRate.getRate(), 2, RoundingMode.HALF_UP));
            document.setVatAmountBaseCurrency(document.getVatAmount().divide(exchangeRate.getRate(), 2, RoundingMode.HALF_UP));
            document.setTotalAmountWithVatBaseCurrency(document.getTotalAmountWithVat().divide(exchangeRate.getRate(), 2, RoundingMode.HALF_UP));
        }
    }

    /**
     * Брои документите на клиент
     */
    public long countDocumentsByClient(Long clientId) {
        return documentRepository.countByClientId(clientId);
    }

    /**
     * Получава статистики за dashboard на дадена фирма
     * @param companyId ID на фирмата
     * @return статистики за dashboard
     */
    @Transactional(readOnly = true)
    public DashboardStats getDashboardStatistics(Long companyId) {
        // Получаване на основни статистики
        List<Client> allClients = clientRepository.findByCompanyId(companyId);
        long totalClients = allClients.size();
        
        long totalInvoices = documentRepository.countByCompanyId(companyId);
        long finalInvoices = documentRepository.countByCompanyIdAndStatus(companyId, DocumentStatus.FINAL);
        long overduedInvoices = documentRepository.countOverdueDocumentsByCompanyId(companyId);

        // Изчисляване на общ приход (само приключени документи)
        List<Document> paidDocuments = documentRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, DocumentStatus.FINAL);
        double totalRevenue = paidDocuments.stream()
            .mapToDouble(doc -> doc.getTotalAmountWithVat() != null ? doc.getTotalAmountWithVat().doubleValue() : 0.0)
            .sum();
        
        // Получаване на последни фактури (първите 5)
        List<Document> allDocuments = documentRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        List<Document> recentDocuments = allDocuments.stream().limit(5).toList();
        List<RecentInvoice> recentInvoices = recentDocuments.stream()
            .map(doc -> new RecentInvoice(
                doc.getId(),
                doc.getDocumentNumber(),
                doc.getClient().getName(),
                doc.getTotalAmountWithVat() != null ? doc.getTotalAmountWithVat().doubleValue() : 0.0,
                doc.getCurrency() != null ? doc.getCurrency().getCode() : "BGN",
                doc.getIssueDate().toString(),
                doc.getDueDate().toString(),
                doc.getStatus()
            ))
            .toList();
        
        // Месечни приходи (заместител с примерни данни)
        List<MonthlyRevenue> monthlyRevenue = List.of(
            new MonthlyRevenue("2025-01", totalRevenue * 0.15),
            new MonthlyRevenue("2025-02", totalRevenue * 0.18),
            new MonthlyRevenue("2025-03", totalRevenue * 0.22),
            new MonthlyRevenue("2025-04", totalRevenue * 0.25),
            new MonthlyRevenue("2025-05", totalRevenue * 0.20)
        );
        
        return new DashboardStats(
            (int) totalClients,
            (int) totalInvoices,
            totalRevenue,
            (int) finalInvoices,
            (int) overduedInvoices,
            recentInvoices,
            monthlyRevenue
        );
    }

    /**
     * Копира документ в нов документ от друг (или същия) тип.
     * Поддържа:
     * - Проформа → Фактура
     * - Фактура → Кредитно известие (с обръщане на знака на количествата)
     * - Фактура → Дебитно известие
     * - Всеки документ → същия тип (дублиране)
     *
     * @param input DTO съдържащо ID на документа-източник и целевия тип
     * @return новият създаден документ
     */
    public Document copyDocument(CopyDocumentInput input) {
        input.validate();

        Document sourceDocument = documentRepository.findById(input.getSourceDocumentId())
                .orElseThrow(() -> new IllegalArgumentException("Source document not found with id: " + input.getSourceDocumentId()));

        DocumentType targetType = input.getTargetDocumentType();
        boolean isCreditNote = targetType == DocumentType.CREDIT_NOTE;

        // Определяне на дати - ако не са зададени, използваме днешна дата
        LocalDate issueDate = input.getIssueDate() != null ? input.getIssueDate() : LocalDate.now();
        LocalDate dueDate = input.getDueDate() != null ? input.getDueDate() : sourceDocument.getDueDate();

        // За данъчни документи задаваме VAT дата
        LocalDate vatDate = null;
        if (targetType.isTaxDocument()) {
            vatDate = input.getVatDate() != null ? input.getVatDate() : issueDate;
        }

        // Генериране на нов номер за целевия тип документ
        String documentNumber = numberService.generateNextNumber(
                sourceDocument.getCompany().getId(), targetType);

        // Създаване на новия документ
        Document newDocument = new Document();
        newDocument.setCompany(sourceDocument.getCompany());
        newDocument.setClient(sourceDocument.getClient());
        newDocument.setCurrency(sourceDocument.getCurrency());
        newDocument.setDocumentType(targetType);
        newDocument.setDocumentNumber(documentNumber);
        newDocument.setIssueDate(issueDate);
        newDocument.setDueDate(dueDate);

        if (targetType.isTaxDocument()) {
            newDocument.setVatDate(vatDate);
        }

        // Копиране на опционални полета
        newDocument.setNotes(sourceDocument.getNotes());
        newDocument.setPaymentMethod(sourceDocument.getPaymentMethod());
        newDocument.setBankAccount(sourceDocument.getBankAccount());

        // Копиране на артикулите
        List<DocumentItem> newItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        int lineNumber = 1;
        for (DocumentItem sourceItem : sourceDocument.getDocumentItems()) {
            DocumentItem newItem = new DocumentItem();
            newItem.setDocument(newDocument);
            newItem.setItem(sourceItem.getItem());
            newItem.setItemDescription(sourceItem.getItemDescription());
            newItem.setItemDescriptionEn(sourceItem.getItemDescriptionEn());
            newItem.setLineNumber(lineNumber++);
            newItem.setUnitPrice(sourceItem.getUnitPrice());
            newItem.setVatRate(sourceItem.getVatRate());
            newItem.setVatExemptionReason(sourceItem.getVatExemptionReason());

            // За кредитно известие обръщаме знака на количеството
            BigDecimal quantity = sourceItem.getQuantity();
            if (isCreditNote) {
                quantity = quantity.negate();
            }
            newItem.setQuantity(quantity);

            // Изчисляване на сумите
            newItem.calculateAmounts();

            subtotal = subtotal.add(newItem.getLineTotal());
            totalVat = totalVat.add(newItem.getVatAmount());

            newItems.add(newItem);
        }

        BigDecimal totalWithVat = subtotal.add(totalVat);

        // Задаване на сумите във валута на документа
        newDocument.setSubtotalAmount(subtotal);
        newDocument.setVatAmount(totalVat);
        newDocument.setTotalAmountWithVat(totalWithVat);

        // Конвертиране на валута
        String currencyCode = sourceDocument.getCurrency().getCode();
        handleCurrencyConversion(newDocument, currencyCode, issueDate);

        newDocument.setDocumentItems(newItems);

        return documentRepository.save(newDocument);
    }
}