package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.Company;
import com.invoiceapp.backend.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import com.invoiceapp.backend.model.dto.CreateCompanyInput;
import com.invoiceapp.backend.model.dto.UpdateCompanyInput;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Optional;

@Controller
public class CompanyController {

    private final CompanyRepository companyRepository;

    @Autowired
    public CompanyController(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @QueryMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<Company> allCompanies() {
        return companyRepository.findAll();
    }

    @QueryMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @customPermissionEvaluator.isUserInCompany(authentication, #id)")
    public Optional<Company> companyById(@Argument Long id) {
        return companyRepository.findById(id);
    }

    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Company createCompany(@Argument CreateCompanyInput input) {
        Company company = new Company();
        company.setName(input.name());
        company.setNameEn(input.nameEn());
        company.setEik(input.eik());
        company.setVatNumber(input.vatNumber());
        company.setAddress(input.address());
        company.setPhone(input.phone());
        company.setEmail(input.email());
        company.setWebsite(input.website());
        if (input.userLimit() != null) {
            company.setUserLimit(input.userLimit());
        }
        return companyRepository.save(company);
    }

    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @customPermissionEvaluator.isUserInCompany(authentication, #id)")
    public Company updateCompany(@Argument Long id, @Argument UpdateCompanyInput input) {
        Optional<Company> optionalCompany = companyRepository.findById(id);
        if (optionalCompany.isEmpty()) {
            throw new RuntimeException("Company not found with id: " + id);
        }
        
        Company company = optionalCompany.get();
        
        if (input.name() != null) {
            company.setName(input.name());
        }
        if (input.nameEn() != null) {
            company.setNameEn(input.nameEn());
        }
        if (input.eik() != null) {
            company.setEik(input.eik());
        }
        if (input.address() != null) {
            company.setAddress(input.address());
        }
        if (input.vatNumber() != null) {
            company.setVatNumber(input.vatNumber());
        }
        if (input.phone() != null) {
            company.setPhone(input.phone());
        }
        if (input.email() != null) {
            company.setEmail(input.email());
        }
        if (input.website() != null) {
            company.setWebsite(input.website());
        }
        if (input.isVatRegistered() != null) {
            company.setIsVatRegistered(input.isVatRegistered());
        }
        if (input.taxRegistrationDate() != null) {
            company.setTaxRegistrationDate(java.time.LocalDate.parse(input.taxRegistrationDate()));
        }
        if (input.logoUrl() != null) {
            company.setLogoUrl(input.logoUrl());
        }
        if (input.companyStampUrl() != null) {
            company.setCompanyStampUrl(input.companyStampUrl());
        }
        if (input.signatureUrl() != null) {
            company.setSignatureUrl(input.signatureUrl());
        }
        if (input.invoiceFooter() != null) {
            company.setInvoiceFooter(input.invoiceFooter());
        }
        if (input.invoiceFooterEn() != null) {
            company.setInvoiceFooterEn(input.invoiceFooterEn());
        }
        if (input.defaultPaymentTerms() != null) {
            company.setDefaultPaymentTerms(input.defaultPaymentTerms());
        }
        if (input.compiledBy() != null) {
            company.setCompiledBy(input.compiledBy());
        }
        
        return companyRepository.save(company);
    }
}
