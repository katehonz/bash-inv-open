package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.Document;
import com.invoiceapp.backend.model.dto.PublicDocumentInfo;
import com.invoiceapp.backend.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.Optional;

@Controller
public class DocumentVerificationController {

    private final DocumentRepository documentRepository;

    @Autowired
    public DocumentVerificationController(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @QueryMapping
    public PublicDocumentInfo verifyDocument(@Argument String uuid) {
        Optional<Document> documentOpt = documentRepository.findByDocumentUuid(uuid);

        if (documentOpt.isEmpty()) {
            return null;
        }

        Document doc = documentOpt.get();

        // Handle null values with defaults
        Double totalAmount = doc.getTotalAmountWithVat() != null
            ? doc.getTotalAmountWithVat().doubleValue()
            : 0.0;
        String companyEik = doc.getCompany().getEik() != null
            ? doc.getCompany().getEik()
            : "N/A";
        String currencyCode = doc.getCurrencyCode() != null
            ? doc.getCurrencyCode()
            : "BGN";

        return new PublicDocumentInfo(
            doc.getDocumentUuid(),
            doc.getDocumentNumber(),
            doc.getDocumentType().name(),
            doc.getIssueDate().toString(),
            totalAmount,
            currencyCode,
            doc.getCompany().getName(),
            companyEik,
            doc.getClient().getName(),
            true
        );
    }
}
