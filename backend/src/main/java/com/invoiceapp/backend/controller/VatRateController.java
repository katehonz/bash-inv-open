package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.VatRate;
import com.invoiceapp.backend.model.dto.CreateVatRateInput;
import com.invoiceapp.backend.model.dto.UpdateVatRateInput;
import com.invoiceapp.backend.repository.VatRateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Controller
public class VatRateController {

    @Autowired
    private VatRateRepository vatRateRepository;

    /**
     * Get all VAT rates
     */
    @QueryMapping
    public List<VatRate> allVatRates() {
        return vatRateRepository.findAll();
    }

    /**
     * Get all active VAT rates ordered by sort order
     */
    @QueryMapping
    public List<VatRate> activeVatRates() {
        return vatRateRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    /**
     * Get default VAT rate
     */
    @QueryMapping
    public Optional<VatRate> defaultVatRate() {
        return vatRateRepository.findByIsDefaultTrueAndIsActiveTrue();
    }

    /**
     * Get zero VAT rates
     */
    @QueryMapping
    public List<VatRate> zeroVatRates() {
        return vatRateRepository.findZeroVatRates();
    }

    /**
     * Get VAT rate by ID
     */
    @QueryMapping
    public Optional<VatRate> vatRateById(@Argument Long id) {
        return vatRateRepository.findById(id);
    }

    /**
     * Get VAT rate by rate value
     */
    @QueryMapping
    public Optional<VatRate> vatRateByValue(@Argument BigDecimal rateValue) {
        return vatRateRepository.findByRateValueAndIsActiveTrue(rateValue);
    }

    /**
     * Create new VAT rate
     */
    @MutationMapping
    public VatRate createVatRate(@Argument CreateVatRateInput input) {
        // If this is set as default, unset all other defaults first
        if (input.isDefault() != null && input.isDefault()) {
            vatRateRepository.unsetAllDefaults();
        }
        
        VatRate vatRate = new VatRate();
        vatRate.setRateValue(input.rateValue());
        vatRate.setRateName(input.rateName());
        vatRate.setRateNameEn(input.rateNameEn());
        vatRate.setDescription(input.description());
        vatRate.setIsDefault(input.isDefault() != null ? input.isDefault() : false);
        vatRate.setIsActive(true);
        vatRate.setSortOrder(input.sortOrder() != null ? input.sortOrder() : 0);
        
        return vatRateRepository.save(vatRate);
    }

    /**
     * Update existing VAT rate
     */
    @MutationMapping
    public VatRate updateVatRate(@Argument UpdateVatRateInput input) {
        VatRate vatRate = vatRateRepository.findById(Long.parseLong(input.id()))
                .orElseThrow(() -> new IllegalArgumentException("VAT rate not found"));

        if (input.rateValue() != null) {
            vatRate.setRateValue(input.rateValue());
        }
        if (input.rateName() != null) {
            vatRate.setRateName(input.rateName());
        }
        if (input.rateNameEn() != null) {
            vatRate.setRateNameEn(input.rateNameEn());
        }
        if (input.description() != null) {
            vatRate.setDescription(input.description());
        }
        if (input.sortOrder() != null) {
            vatRate.setSortOrder(input.sortOrder());
        }
        if (input.isActive() != null) {
            vatRate.setIsActive(input.isActive());
        }
        
        // If this is set as default, unset all other defaults first
        if (input.isDefault() != null && input.isDefault()) {
            vatRateRepository.unsetAllDefaults();
            vatRate.setIsDefault(true);
        } else if (input.isDefault() != null && !input.isDefault()) {
            vatRate.setIsDefault(false);
        }
        
        return vatRateRepository.save(vatRate);
    }

    /**
     * Set default VAT rate
     */
    @MutationMapping
    public VatRate setDefaultVatRate(@Argument Long id) {
        VatRate vatRate = vatRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("VAT rate not found"));
        
        // Unset all other defaults first
        vatRateRepository.unsetAllDefaults();
        
        // Set this one as default
        vatRate.setIsDefault(true);
        
        return vatRateRepository.save(vatRate);
    }

    /**
     * Delete VAT rate
     */
    @MutationMapping
    public Boolean deleteVatRate(@Argument Long id) {
        VatRate vatRate = vatRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("VAT rate not found"));
        
        // Check if this VAT rate is being used (you may want to add business logic here)
        // For now, we'll allow deletion
        
        vatRateRepository.delete(vatRate);
        return true;
    }
}