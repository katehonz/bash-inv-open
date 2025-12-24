package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.*;
import com.invoiceapp.backend.model.dto.CreateInvoiceInput;
import com.invoiceapp.backend.repository.ClientRepository;
import com.invoiceapp.backend.repository.CompanyRepository;
import com.invoiceapp.backend.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final CompanyRepository companyRepository;
    private final ClientRepository clientRepository;

    @Autowired
    public InvoiceController(InvoiceRepository invoiceRepository, CompanyRepository companyRepository, ClientRepository clientRepository) {
        this.invoiceRepository = invoiceRepository;
        this.companyRepository = companyRepository;
        this.clientRepository = clientRepository;
    }

    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Invoice> invoicesByCompany(@Argument Long companyId) {
        return invoiceRepository.findByCompanyId(companyId);
    }

    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #input.companyId)")
    public Invoice createInvoice(@Argument CreateInvoiceInput input) {
        Company company = companyRepository.findById(input.companyId())
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        Client client = clientRepository.findById(input.clientId())
                .orElseThrow(() -> new IllegalArgumentException("Client not found"));

        // Basic validation
        if (!client.getCompany().getId().equals(company.getId())) {
            throw new IllegalStateException("Client does not belong to the specified company.");
        }

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(input.invoiceNumber());
        invoice.setIssueDate(input.issueDate());
        invoice.setDueDate(input.dueDate());
        invoice.setTotalAmount(input.totalAmount());
        invoice.setStatus(InvoiceStatus.DRAFT); // New invoices are drafts by default
        invoice.setCompany(company);
        invoice.setClient(client);

        return invoiceRepository.save(invoice);
    }
}
