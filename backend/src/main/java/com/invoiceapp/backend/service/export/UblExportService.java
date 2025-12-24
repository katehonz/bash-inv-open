package com.invoiceapp.backend.service.export;

import com.invoiceapp.backend.model.*;
import org.springframework.stereotype.Service;

import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamWriter;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service за експорт на документи в UBL 2.1 XML формат
 * Съответства на EN 16931 European Standard за електронно фактуриране
 */
@Service
public class UblExportService {

    private static final String UBL_VERSION = "2.1";
    private static final String CUSTOMIZATION_ID = "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0";
    private static final String PROFILE_ID = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
    private static final String SOFTWARE_ID = "Bash Inv";
    private static final String SOFTWARE_VERSION = "1.0";

    // UBL 2.1 Namespaces
    private static final String NS_CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";
    private static final String NS_CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";
    private static final String NS_INVOICE = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
    private static final String NS_CREDIT_NOTE = "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2";

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

    /**
     * Експортира документ като UBL 2.1 XML
     * @param document Документът за експорт
     * @return XML string в UBL 2.1 формат
     */
    public String exportToUbl(Document document) {
        if (document == null) {
            throw new IllegalArgumentException("Document cannot be null");
        }

        try {
            StringWriter stringWriter = new StringWriter();
            XMLOutputFactory factory = XMLOutputFactory.newInstance();
            XMLStreamWriter writer = factory.createXMLStreamWriter(stringWriter);

            writer.writeStartDocument("UTF-8", "1.0");

            if (document.getDocumentType() == DocumentType.CREDIT_NOTE) {
                writeCreditNote(writer, document);
            } else {
                writeInvoice(writer, document);
            }

            writer.writeEndDocument();
            writer.flush();
            writer.close();

            return formatXml(stringWriter.toString());

        } catch (Exception e) {
            throw new RuntimeException("Error generating UBL XML: " + e.getMessage(), e);
        }
    }

    /**
     * Writes UBL Invoice XML
     */
    private void writeInvoice(XMLStreamWriter writer, Document document) throws Exception {
        writer.writeStartElement("Invoice");
        writer.writeDefaultNamespace(NS_INVOICE);
        writer.writeNamespace("cac", NS_CAC);
        writer.writeNamespace("cbc", NS_CBC);

        // Basic fields
        writeBasicElement(writer, "cbc", "UBLVersionID", UBL_VERSION);
        writeBasicElement(writer, "cbc", "CustomizationID", CUSTOMIZATION_ID);
        writeBasicElement(writer, "cbc", "ProfileID", PROFILE_ID);
        writeBasicElement(writer, "cbc", "ID", document.getDocumentNumber());
        writeBasicElement(writer, "cbc", "IssueDate", formatDate(document.getIssueDate()));
        writeBasicElement(writer, "cbc", "DueDate", formatDate(document.getDueDate()));

        // Invoice type code (380 = Commercial Invoice, 325 = Proforma)
        String typeCode = document.getDocumentType() == DocumentType.PROFORMA ? "325" : "380";
        writeBasicElement(writer, "cbc", "InvoiceTypeCode", typeCode);

        // Notes
        if (document.getNotes() != null && !document.getNotes().trim().isEmpty()) {
            writeBasicElement(writer, "cbc", "Note", document.getNotes());
        }

        // Document currency
        writeBasicElement(writer, "cbc", "DocumentCurrencyCode", document.getCurrency().getCode());

        // Tax currency for non-BGN invoices
        if (!"BGN".equals(document.getCurrency().getCode()) && !"EUR".equals(document.getCurrency().getCode())) {
            writeBasicElement(writer, "cbc", "TaxCurrencyCode", "BGN");
        }

        // VAT Date (TaxPointDate) - Bulgarian requirement
        if (document.getVatDate() != null) {
            writeBasicElement(writer, "cbc", "TaxPointDate", formatDate(document.getVatDate()));
        }

        // Software identification (AdditionalDocumentReference)
        writeSoftwareReference(writer);

        // Supplier Party
        writeSupplierParty(writer, document.getCompany());

        // Customer Party
        writeCustomerParty(writer, document.getClient());

        // Payment Means
        if (document.getPaymentMethod() != null) {
            writePaymentMeans(writer, document);
        }

        // Payment Terms
        writePaymentTerms(writer, document);

        // Tax Total
        writeTaxTotal(writer, document);

        // Legal Monetary Total
        writeMonetaryTotal(writer, document);

        // Invoice Lines
        List<DocumentItem> items = document.getDocumentItems();
        if (items != null) {
            for (int i = 0; i < items.size(); i++) {
                writeInvoiceLine(writer, items.get(i), i + 1, document.getCurrency().getCode());
            }
        }

        writer.writeEndElement(); // Invoice
    }

    /**
     * Writes UBL Credit Note XML
     */
    private void writeCreditNote(XMLStreamWriter writer, Document document) throws Exception {
        writer.writeStartElement("CreditNote");
        writer.writeDefaultNamespace(NS_CREDIT_NOTE);
        writer.writeNamespace("cac", NS_CAC);
        writer.writeNamespace("cbc", NS_CBC);

        // Basic fields
        writeBasicElement(writer, "cbc", "UBLVersionID", UBL_VERSION);
        writeBasicElement(writer, "cbc", "CustomizationID", CUSTOMIZATION_ID);
        writeBasicElement(writer, "cbc", "ProfileID", PROFILE_ID);
        writeBasicElement(writer, "cbc", "ID", document.getDocumentNumber());
        writeBasicElement(writer, "cbc", "IssueDate", formatDate(document.getIssueDate()));

        // Credit note type code (381 = Credit Note)
        writeBasicElement(writer, "cbc", "CreditNoteTypeCode", "381");

        // Notes
        if (document.getNotes() != null && !document.getNotes().trim().isEmpty()) {
            writeBasicElement(writer, "cbc", "Note", document.getNotes());
        }

        // Document currency
        writeBasicElement(writer, "cbc", "DocumentCurrencyCode", document.getCurrency().getCode());

        // VAT Date (TaxPointDate) - Bulgarian requirement
        if (document.getVatDate() != null) {
            writeBasicElement(writer, "cbc", "TaxPointDate", formatDate(document.getVatDate()));
        }

        // Software identification (AdditionalDocumentReference)
        writeSoftwareReference(writer);

        // Supplier Party
        writeSupplierParty(writer, document.getCompany());

        // Customer Party
        writeCustomerParty(writer, document.getClient());

        // Payment Means
        if (document.getPaymentMethod() != null) {
            writePaymentMeans(writer, document);
        }

        // Tax Total
        writeTaxTotal(writer, document);

        // Legal Monetary Total
        writeMonetaryTotal(writer, document);

        // Credit Note Lines
        List<DocumentItem> items = document.getDocumentItems();
        if (items != null) {
            for (int i = 0; i < items.size(); i++) {
                writeCreditNoteLine(writer, items.get(i), i + 1, document.getCurrency().getCode());
            }
        }

        writer.writeEndElement(); // CreditNote
    }

    /**
     * Writes Supplier (Seller) Party
     */
    private void writeSupplierParty(XMLStreamWriter writer, Company company) throws Exception {
        writer.writeStartElement(NS_CAC, "AccountingSupplierParty");
        writer.writeStartElement(NS_CAC, "Party");

        // Endpoint ID (for Peppol)
        if (company.getVatNumber() != null && !company.getVatNumber().isEmpty()) {
            writer.writeStartElement(NS_CBC, "EndpointID");
            writer.writeAttribute("schemeID", "9947"); // Bulgarian VAT scheme
            writer.writeCharacters(company.getVatNumber());
            writer.writeEndElement();
        }

        // Party Identification
        if (company.getVatNumber() != null && !company.getVatNumber().isEmpty()) {
            writer.writeStartElement(NS_CAC, "PartyIdentification");
            writer.writeStartElement(NS_CBC, "ID");
            writer.writeAttribute("schemeID", "VA");
            writer.writeCharacters(company.getVatNumber());
            writer.writeEndElement();
            writer.writeEndElement();
        }

        // Party Name
        writer.writeStartElement(NS_CAC, "PartyName");
        writeBasicElement(writer, "cbc", "Name", company.getName());
        writer.writeEndElement();

        // Postal Address
        writer.writeStartElement(NS_CAC, "PostalAddress");
        if (company.getAddress() != null) {
            writeBasicElement(writer, "cbc", "StreetName", company.getAddress());
        }
        writer.writeStartElement(NS_CAC, "Country");
        writeBasicElement(writer, "cbc", "IdentificationCode", "BG");
        writer.writeEndElement();
        writer.writeEndElement();

        // Party Tax Scheme
        if (company.getIsVatRegistered() != null && company.getIsVatRegistered()) {
            writer.writeStartElement(NS_CAC, "PartyTaxScheme");
            writeBasicElement(writer, "cbc", "CompanyID", company.getVatNumber());
            writer.writeStartElement(NS_CAC, "TaxScheme");
            writeBasicElement(writer, "cbc", "ID", "VAT");
            writer.writeEndElement();
            writer.writeEndElement();
        }

        // Party Legal Entity
        writer.writeStartElement(NS_CAC, "PartyLegalEntity");
        writeBasicElement(writer, "cbc", "RegistrationName", company.getName());
        if (company.getEik() != null && !company.getEik().isEmpty()) {
            writer.writeStartElement(NS_CBC, "CompanyID");
            writer.writeAttribute("schemeID", "0195"); // BG Trade Register
            writer.writeCharacters(company.getEik());
            writer.writeEndElement();
        }
        writer.writeEndElement();

        // Contact
        if (company.getEmail() != null || company.getPhone() != null) {
            writer.writeStartElement(NS_CAC, "Contact");
            if (company.getPhone() != null) {
                writeBasicElement(writer, "cbc", "Telephone", company.getPhone());
            }
            if (company.getEmail() != null) {
                writeBasicElement(writer, "cbc", "ElectronicMail", company.getEmail());
            }
            writer.writeEndElement();
        }

        writer.writeEndElement(); // Party
        writer.writeEndElement(); // AccountingSupplierParty
    }

    /**
     * Writes Customer (Buyer) Party
     */
    private void writeCustomerParty(XMLStreamWriter writer, Client client) throws Exception {
        writer.writeStartElement(NS_CAC, "AccountingCustomerParty");
        writer.writeStartElement(NS_CAC, "Party");

        // Endpoint ID
        if (client.getVatNumber() != null && !client.getVatNumber().isEmpty()) {
            writer.writeStartElement(NS_CBC, "EndpointID");
            writer.writeAttribute("schemeID", determineEndpointScheme(client.getVatNumber()));
            writer.writeCharacters(client.getVatNumber());
            writer.writeEndElement();

            // Party Identification
            writer.writeStartElement(NS_CAC, "PartyIdentification");
            writer.writeStartElement(NS_CBC, "ID");
            writer.writeAttribute("schemeID", "VA");
            writer.writeCharacters(client.getVatNumber());
            writer.writeEndElement();
            writer.writeEndElement();
        } else if (client.getEik() != null && !client.getEik().isEmpty()) {
            writer.writeStartElement(NS_CAC, "PartyIdentification");
            writer.writeStartElement(NS_CBC, "ID");
            writer.writeAttribute("schemeID", "0195");
            writer.writeCharacters(client.getEik());
            writer.writeEndElement();
            writer.writeEndElement();
        }

        // Party Name
        writer.writeStartElement(NS_CAC, "PartyName");
        writeBasicElement(writer, "cbc", "Name", client.getName());
        writer.writeEndElement();

        // Postal Address
        writer.writeStartElement(NS_CAC, "PostalAddress");
        if (client.getAddress() != null) {
            writeBasicElement(writer, "cbc", "StreetName", client.getAddress());
        }
        writer.writeStartElement(NS_CAC, "Country");
        writeBasicElement(writer, "cbc", "IdentificationCode", determineCountryCode(client.getVatNumber()));
        writer.writeEndElement();
        writer.writeEndElement();

        // Party Tax Scheme
        if (client.getVatNumber() != null && !client.getVatNumber().isEmpty()) {
            writer.writeStartElement(NS_CAC, "PartyTaxScheme");
            writeBasicElement(writer, "cbc", "CompanyID", client.getVatNumber());
            writer.writeStartElement(NS_CAC, "TaxScheme");
            writeBasicElement(writer, "cbc", "ID", "VAT");
            writer.writeEndElement();
            writer.writeEndElement();
        }

        // Party Legal Entity
        writer.writeStartElement(NS_CAC, "PartyLegalEntity");
        writeBasicElement(writer, "cbc", "RegistrationName", client.getName());
        if (client.getEik() != null && !client.getEik().isEmpty()) {
            writer.writeStartElement(NS_CBC, "CompanyID");
            writer.writeAttribute("schemeID", "0195");
            writer.writeCharacters(client.getEik());
            writer.writeEndElement();
        }
        writer.writeEndElement();

        // Contact
        if (client.getEmail() != null || client.getPhone() != null) {
            writer.writeStartElement(NS_CAC, "Contact");
            if (client.getPhone() != null) {
                writeBasicElement(writer, "cbc", "Telephone", client.getPhone());
            }
            if (client.getEmail() != null) {
                writeBasicElement(writer, "cbc", "ElectronicMail", client.getEmail());
            }
            writer.writeEndElement();
        }

        writer.writeEndElement(); // Party
        writer.writeEndElement(); // AccountingCustomerParty
    }

    /**
     * Writes Payment Means
     */
    private void writePaymentMeans(XMLStreamWriter writer, Document document) throws Exception {
        writer.writeStartElement(NS_CAC, "PaymentMeans");

        String methodCode = document.getPaymentMethod().getMethodCode();
        String paymentMeansCode;
        switch (methodCode) {
            case "CASH":
                paymentMeansCode = "10";
                break;
            case "CARD":
                paymentMeansCode = "48";
                break;
            case "BANK_TRANSFER":
            default:
                paymentMeansCode = "30";
                break;
        }
        writeBasicElement(writer, "cbc", "PaymentMeansCode", paymentMeansCode);

        // Bank account for bank transfer
        if ("BANK_TRANSFER".equals(methodCode) && document.getBankAccount() != null) {
            BankAccount bankAccount = document.getBankAccount();
            writer.writeStartElement(NS_CAC, "PayeeFinancialAccount");
            if (bankAccount.getIban() != null) {
                writeBasicElement(writer, "cbc", "ID", bankAccount.getIban());
            }
            if (bankAccount.getBankName() != null || bankAccount.getBic() != null) {
                writer.writeStartElement(NS_CAC, "FinancialInstitutionBranch");
                writeBasicElement(writer, "cbc", "ID",
                    bankAccount.getBic() != null ? bankAccount.getBic() : bankAccount.getBankName());
                writer.writeEndElement();
            }
            writer.writeEndElement();
        }

        writer.writeEndElement();
    }

    /**
     * Writes Payment Terms
     */
    private void writePaymentTerms(XMLStreamWriter writer, Document document) throws Exception {
        writer.writeStartElement(NS_CAC, "PaymentTerms");
        long daysDue = java.time.temporal.ChronoUnit.DAYS.between(document.getIssueDate(), document.getDueDate());
        writeBasicElement(writer, "cbc", "Note", "Net " + daysDue + " days");
        writer.writeEndElement();
    }

    /**
     * Writes Software Reference (AdditionalDocumentReference)
     * Identifies the software that generated this invoice
     */
    private void writeSoftwareReference(XMLStreamWriter writer) throws Exception {
        writer.writeStartElement(NS_CAC, "AdditionalDocumentReference");
        writeBasicElement(writer, "cbc", "ID", "Software");
        writeBasicElement(writer, "cbc", "DocumentDescription", SOFTWARE_ID + " v" + SOFTWARE_VERSION);
        writer.writeEndElement();
    }

    /**
     * Writes Tax Total with subtotals per VAT rate
     */
    private void writeTaxTotal(XMLStreamWriter writer, Document document) throws Exception {
        String currencyCode = document.getCurrency().getCode();

        writer.writeStartElement(NS_CAC, "TaxTotal");

        // Total tax amount
        writer.writeStartElement(NS_CBC, "TaxAmount");
        writer.writeAttribute("currencyID", currencyCode);
        writer.writeCharacters(formatAmount(document.getVatAmount()));
        writer.writeEndElement();

        // Group items by VAT rate
        Map<BigDecimal, List<DocumentItem>> itemsByVatRate = document.getDocumentItems().stream()
                .collect(Collectors.groupingBy(DocumentItem::getVatRate));

        for (Map.Entry<BigDecimal, List<DocumentItem>> entry : itemsByVatRate.entrySet()) {
            BigDecimal vatRate = entry.getKey();
            List<DocumentItem> items = entry.getValue();

            writer.writeStartElement(NS_CAC, "TaxSubtotal");

            // Taxable amount
            BigDecimal taxableAmount = items.stream()
                    .map(DocumentItem::getLineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            writer.writeStartElement(NS_CBC, "TaxableAmount");
            writer.writeAttribute("currencyID", currencyCode);
            writer.writeCharacters(formatAmount(taxableAmount));
            writer.writeEndElement();

            // Tax amount
            BigDecimal taxAmount = items.stream()
                    .map(DocumentItem::getVatAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            writer.writeStartElement(NS_CBC, "TaxAmount");
            writer.writeAttribute("currencyID", currencyCode);
            writer.writeCharacters(formatAmount(taxAmount));
            writer.writeEndElement();

            // Tax Category - Use UBL category code from exemption reason if available
            writer.writeStartElement(NS_CAC, "TaxCategory");
            String categoryId;
            VatExemptionReason exemption = null;

            // Get exemption reason from first item for this VAT rate
            if (!items.isEmpty()) {
                exemption = items.get(0).getVatExemptionReason();
            }

            // Determine category ID: use UBL code if available, otherwise fallback
            if (exemption != null && exemption.getUblCategoryCode() != null) {
                categoryId = exemption.getUblCategoryCode();
            } else if (vatRate.compareTo(BigDecimal.ZERO) == 0) {
                categoryId = "Z"; // Zero-rated (default for 0% VAT)
            } else {
                categoryId = "S"; // Standard rate
            }

            writeBasicElement(writer, "cbc", "ID", categoryId);
            writeBasicElement(writer, "cbc", "Percent", formatAmount(vatRate));

            // Exemption reason for non-standard VAT (0% or exempt categories)
            if (exemption != null && vatRate.compareTo(BigDecimal.ZERO) == 0) {
                // Use UBL exemption code if available, otherwise fall back to reasonCode
                String exemptionCode = exemption.getUblExemptionCode() != null
                        ? exemption.getUblExemptionCode()
                        : exemption.getReasonCode();
                writeBasicElement(writer, "cbc", "TaxExemptionReasonCode", exemptionCode);

                // Use English legal basis if available
                String reason = exemption.getLegalBasisEn() != null
                        ? exemption.getLegalBasisEn()
                        : exemption.getLegalBasis();
                writeBasicElement(writer, "cbc", "TaxExemptionReason", reason);
            }

            writer.writeStartElement(NS_CAC, "TaxScheme");
            writeBasicElement(writer, "cbc", "ID", "VAT");
            writer.writeEndElement();
            writer.writeEndElement(); // TaxCategory

            writer.writeEndElement(); // TaxSubtotal
        }

        writer.writeEndElement(); // TaxTotal
    }

    /**
     * Writes Legal Monetary Total
     */
    private void writeMonetaryTotal(XMLStreamWriter writer, Document document) throws Exception {
        String currencyCode = document.getCurrency().getCode();

        writer.writeStartElement(NS_CAC, "LegalMonetaryTotal");

        writer.writeStartElement(NS_CBC, "LineExtensionAmount");
        writer.writeAttribute("currencyID", currencyCode);
        writer.writeCharacters(formatAmount(document.getSubtotalAmount()));
        writer.writeEndElement();

        writer.writeStartElement(NS_CBC, "TaxExclusiveAmount");
        writer.writeAttribute("currencyID", currencyCode);
        writer.writeCharacters(formatAmount(document.getSubtotalAmount()));
        writer.writeEndElement();

        writer.writeStartElement(NS_CBC, "TaxInclusiveAmount");
        writer.writeAttribute("currencyID", currencyCode);
        writer.writeCharacters(formatAmount(document.getTotalAmountWithVat()));
        writer.writeEndElement();

        writer.writeStartElement(NS_CBC, "PayableAmount");
        writer.writeAttribute("currencyID", currencyCode);
        writer.writeCharacters(formatAmount(document.getTotalAmountWithVat()));
        writer.writeEndElement();

        writer.writeEndElement();
    }

    /**
     * Writes Invoice Line
     */
    private void writeInvoiceLine(XMLStreamWriter writer, DocumentItem item, int lineNumber, String currencyCode) throws Exception {
        writer.writeStartElement(NS_CAC, "InvoiceLine");

        writeBasicElement(writer, "cbc", "ID", String.valueOf(lineNumber));

        // Invoiced Quantity
        writer.writeStartElement(NS_CBC, "InvoicedQuantity");
        writer.writeAttribute("unitCode", mapUnitOfMeasure(item.getItem().getUnitOfMeasure()));
        writer.writeCharacters(formatQuantity(item.getQuantity()));
        writer.writeEndElement();

        // Line Extension Amount
        writer.writeStartElement(NS_CBC, "LineExtensionAmount");
        writer.writeAttribute("currencyID", currencyCode);
        writer.writeCharacters(formatAmount(item.getLineTotal()));
        writer.writeEndElement();

        // Item
        writeItem(writer, item);

        // Price
        writer.writeStartElement(NS_CAC, "Price");
        writer.writeStartElement(NS_CBC, "PriceAmount");
        writer.writeAttribute("currencyID", currencyCode);
        writer.writeCharacters(formatAmount(item.getUnitPrice()));
        writer.writeEndElement();
        writer.writeEndElement();

        writer.writeEndElement(); // InvoiceLine
    }

    /**
     * Writes Credit Note Line
     */
    private void writeCreditNoteLine(XMLStreamWriter writer, DocumentItem item, int lineNumber, String currencyCode) throws Exception {
        writer.writeStartElement(NS_CAC, "CreditNoteLine");

        writeBasicElement(writer, "cbc", "ID", String.valueOf(lineNumber));

        // Credited Quantity
        writer.writeStartElement(NS_CBC, "CreditedQuantity");
        writer.writeAttribute("unitCode", mapUnitOfMeasure(item.getItem().getUnitOfMeasure()));
        writer.writeCharacters(formatQuantity(item.getQuantity()));
        writer.writeEndElement();

        // Line Extension Amount
        writer.writeStartElement(NS_CBC, "LineExtensionAmount");
        writer.writeAttribute("currencyID", currencyCode);
        writer.writeCharacters(formatAmount(item.getLineTotal()));
        writer.writeEndElement();

        // Item
        writeItem(writer, item);

        // Price
        writer.writeStartElement(NS_CAC, "Price");
        writer.writeStartElement(NS_CBC, "PriceAmount");
        writer.writeAttribute("currencyID", currencyCode);
        writer.writeCharacters(formatAmount(item.getUnitPrice()));
        writer.writeEndElement();
        writer.writeEndElement();

        writer.writeEndElement(); // CreditNoteLine
    }

    /**
     * Writes Item element
     */
    private void writeItem(XMLStreamWriter writer, DocumentItem item) throws Exception {
        writer.writeStartElement(NS_CAC, "Item");

        writeBasicElement(writer, "cbc", "Name", item.getEffectiveItemName());

        // Seller's Item Identification
        if (item.getItem().getItemNumber() != null) {
            writer.writeStartElement(NS_CAC, "SellersItemIdentification");
            writeBasicElement(writer, "cbc", "ID", item.getItem().getItemNumber());
            writer.writeEndElement();
        }

        // Classified Tax Category - Use UBL category code from exemption reason if available
        writer.writeStartElement(NS_CAC, "ClassifiedTaxCategory");
        String categoryId;
        VatExemptionReason itemExemption = item.getVatExemptionReason();

        if (itemExemption != null && itemExemption.getUblCategoryCode() != null) {
            categoryId = itemExemption.getUblCategoryCode();
        } else if (item.getVatRate().compareTo(BigDecimal.ZERO) == 0) {
            categoryId = "Z"; // Zero-rated
        } else {
            categoryId = "S"; // Standard rate
        }

        writeBasicElement(writer, "cbc", "ID", categoryId);
        writeBasicElement(writer, "cbc", "Percent", formatAmount(item.getVatRate()));
        writer.writeStartElement(NS_CAC, "TaxScheme");
        writeBasicElement(writer, "cbc", "ID", "VAT");
        writer.writeEndElement();
        writer.writeEndElement();

        writer.writeEndElement(); // Item
    }

    // --- Utility methods ---

    private void writeBasicElement(XMLStreamWriter writer, String prefix, String localName, String value) throws Exception {
        if (value == null) return;
        String ns = "cbc".equals(prefix) ? NS_CBC : NS_CAC;
        writer.writeStartElement(ns, localName);
        writer.writeCharacters(value);
        writer.writeEndElement();
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMAT) : "";
    }

    private String formatAmount(BigDecimal amount) {
        return amount != null ? amount.setScale(2, RoundingMode.HALF_UP).toPlainString() : "0.00";
    }

    private String formatQuantity(BigDecimal quantity) {
        return quantity != null ? quantity.setScale(3, RoundingMode.HALF_UP).toPlainString() : "0.000";
    }

    /**
     * Maps Bulgarian unit of measure to UN/ECE Rec 20 codes
     */
    private String mapUnitOfMeasure(String unitOfMeasure) {
        if (unitOfMeasure == null) {
            return "C62"; // One (unit)
        }
        String unit = unitOfMeasure.toLowerCase().trim();
        return switch (unit) {
            case "бр.", "бр", "брой" -> "C62";
            case "кг", "кг." -> "KGM";
            case "г", "г." -> "GRM";
            case "л", "л." -> "LTR";
            case "м", "м." -> "MTR";
            case "м2", "кв.м", "кв.м." -> "MTK";
            case "м3", "куб.м", "куб.м." -> "MTQ";
            case "ч", "ч.", "час" -> "HUR";
            case "ден", "дни" -> "DAY";
            case "мес", "мес.", "месец" -> "MON";
            case "комплект", "компл." -> "SET";
            case "опак.", "опаковка" -> "PK";
            default -> "C62";
        };
    }

    /**
     * Determines Peppol endpoint scheme ID from VAT number
     */
    private String determineEndpointScheme(String vatNumber) {
        if (vatNumber == null || vatNumber.length() < 2) {
            return "9947";
        }
        String countryPrefix = vatNumber.substring(0, 2).toUpperCase();
        return switch (countryPrefix) {
            case "BG" -> "9947";
            case "DE" -> "9930";
            case "AT" -> "9914";
            case "BE" -> "9925";
            case "CZ" -> "9929";
            case "DK" -> "9902";
            case "EE" -> "9931";
            case "GR", "EL" -> "9933";
            case "ES" -> "9920";
            case "FI" -> "9937";
            case "FR" -> "9957";
            case "HR" -> "9934";
            case "HU" -> "9910";
            case "IE" -> "9946";
            case "IT" -> "9906";
            case "LT" -> "9939";
            case "LU" -> "9938";
            case "LV" -> "9940";
            case "NL" -> "9944";
            case "PL" -> "9945";
            case "PT" -> "9949";
            case "RO" -> "9948";
            case "SE" -> "9955";
            case "SI" -> "9951";
            case "SK" -> "9950";
            default -> "9947";
        };
    }

    /**
     * Determines country code from VAT number
     */
    private String determineCountryCode(String vatNumber) {
        if (vatNumber == null || vatNumber.length() < 2) {
            return "BG";
        }
        String prefix = vatNumber.substring(0, 2).toUpperCase();
        if ("EL".equals(prefix)) {
            return "GR";
        }
        Set<String> euCountries = Set.of(
                "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
                "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT",
                "NL", "PL", "PT", "RO", "SE", "SI", "SK"
        );
        return euCountries.contains(prefix) ? prefix : "BG";
    }

    /**
     * Formats XML with proper indentation
     */
    private String formatXml(String xml) {
        try {
            javax.xml.transform.TransformerFactory transformerFactory = javax.xml.transform.TransformerFactory.newInstance();
            javax.xml.transform.Transformer transformer = transformerFactory.newTransformer();
            transformer.setOutputProperty(javax.xml.transform.OutputKeys.INDENT, "yes");
            transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");

            javax.xml.transform.stream.StreamSource source = new javax.xml.transform.stream.StreamSource(new java.io.StringReader(xml));
            StringWriter output = new StringWriter();
            javax.xml.transform.stream.StreamResult result = new javax.xml.transform.stream.StreamResult(output);

            transformer.transform(source, result);
            return output.toString();
        } catch (Exception e) {
            return xml; // Return unformatted if formatting fails
        }
    }
}
