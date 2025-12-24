package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.VatExemptionReason;
import com.invoiceapp.backend.model.dto.CreateVatExemptionReasonInput;
import com.invoiceapp.backend.model.dto.UpdateVatExemptionReasonInput;
import com.invoiceapp.backend.repository.VatExemptionReasonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Controller
public class VatExemptionReasonController {

    @Autowired
    private VatExemptionReasonRepository vatExemptionReasonRepository;

    /**
     * Get all VAT exemption reasons
     */
    @QueryMapping
    public List<VatExemptionReason> allVatExemptionReasons() {
        return vatExemptionReasonRepository.findAll();
    }

    /**
     * Get all active VAT exemption reasons ordered by sort order
     */
    @QueryMapping
    public List<VatExemptionReason> activeVatExemptionReasons() {
        return vatExemptionReasonRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    /**
     * Get VAT exemption reason by ID
     */
    @QueryMapping
    public Optional<VatExemptionReason> vatExemptionReasonById(@Argument Long id) {
        return vatExemptionReasonRepository.findById(id);
    }

    /**
     * Get VAT exemption reason by code
     */
    @QueryMapping
    public Optional<VatExemptionReason> vatExemptionReasonByCode(@Argument String code) {
        return vatExemptionReasonRepository.findByReasonCodeAndIsActiveTrue(code);
    }

    /**
     * Create new VAT exemption reason
     */
    @MutationMapping
    public VatExemptionReason createVatExemptionReason(@Argument CreateVatExemptionReasonInput input) {
        VatExemptionReason reason = new VatExemptionReason();
        reason.setReasonCode(input.reasonCode());
        reason.setReasonName(input.reasonName());
        reason.setReasonNameEn(input.reasonNameEn());
        reason.setLegalBasis(input.legalBasis());
        reason.setLegalBasisEn(input.legalBasisEn());
        reason.setDescription(input.description());
        reason.setSortOrder(input.sortOrder() != null ? input.sortOrder() : 0);
        reason.setIsActive(true);
        
        return vatExemptionReasonRepository.save(reason);
    }

    /**
     * Update existing VAT exemption reason
     */
    @MutationMapping
    public VatExemptionReason updateVatExemptionReason(@Argument UpdateVatExemptionReasonInput input) {
        VatExemptionReason reason = vatExemptionReasonRepository.findById(Long.parseLong(input.id()))
                .orElseThrow(() -> new IllegalArgumentException("VAT exemption reason not found"));

        if (input.reasonCode() != null) {
            reason.setReasonCode(input.reasonCode());
        }
        if (input.reasonName() != null) {
            reason.setReasonName(input.reasonName());
        }
        if (input.reasonNameEn() != null) {
            reason.setReasonNameEn(input.reasonNameEn());
        }
        if (input.legalBasis() != null) {
            reason.setLegalBasis(input.legalBasis());
        }
        if (input.legalBasisEn() != null) {
            reason.setLegalBasisEn(input.legalBasisEn());
        }
        if (input.description() != null) {
            reason.setDescription(input.description());
        }
        if (input.sortOrder() != null) {
            reason.setSortOrder(input.sortOrder());
        }
        if (input.isActive() != null) {
            reason.setIsActive(input.isActive());
        }
        
        return vatExemptionReasonRepository.save(reason);
    }

    /**
     * Delete VAT exemption reason
     */
    @MutationMapping
    public Boolean deleteVatExemptionReason(@Argument Long id) {
        VatExemptionReason reason = vatExemptionReasonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("VAT exemption reason not found"));
        
        // Check if this exemption reason is being used (you may want to add business logic here)
        // For now, we'll allow deletion
        
        vatExemptionReasonRepository.delete(reason);
        return true;
    }
}