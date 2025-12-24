package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.Company;
import com.invoiceapp.backend.model.Item;
import com.invoiceapp.backend.model.dto.CreateItemInput;
import com.invoiceapp.backend.model.dto.UpdateItemInput;
import com.invoiceapp.backend.repository.CompanyRepository;
import com.invoiceapp.backend.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Optional;

@Controller
public class ItemController {

    private final ItemRepository itemRepository;
    private final CompanyRepository companyRepository;

    @Autowired
    public ItemController(ItemRepository itemRepository, CompanyRepository companyRepository) {
        this.itemRepository = itemRepository;
        this.companyRepository = companyRepository;
    }

    // Query methods
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Item> itemsByCompany(@Argument Long companyId) {
        return itemRepository.findByCompanyIdOrderByItemNumber(companyId);
    }

    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Item> activeItemsByCompany(@Argument Long companyId) {
        return itemRepository.findByCompanyIdAndIsActiveTrueOrderByItemNumber(companyId);
    }

    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, @itemRepository.findById(#id).orElse(null)?.getCompany()?.getId())")
    public Optional<Item> itemById(@Argument Long id) {
        return itemRepository.findById(id);
    }

    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public Optional<Item> itemByNumber(@Argument Long companyId, @Argument String itemNumber) {
        return itemRepository.findByCompanyIdAndItemNumber(companyId, itemNumber);
    }

    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Item> searchItems(@Argument Long companyId, @Argument String searchTerm) {
        return itemRepository.findItemsByCompanyAndSearchTerm(companyId, searchTerm);
    }

    // Mutation methods
    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #input.getCompanyId())")
    public Item createItem(@Argument CreateItemInput input) {
        Optional<Company> companyOpt = companyRepository.findById(input.getCompanyId());
        if (companyOpt.isEmpty()) {
            throw new RuntimeException("Company not found with id: " + input.getCompanyId());
        }

        // Check if item number already exists for this company
        if (itemRepository.existsByCompanyIdAndItemNumber(input.getCompanyId(), input.getItemNumber())) {
            throw new RuntimeException("Item number '" + input.getItemNumber() + "' already exists for this company");
        }

        Item item = new Item();
        item.setItemNumber(input.getItemNumber());
        item.setName(input.getName());
        item.setNameEn(input.getNameEn());
        item.setDefaultVatRate(input.getDefaultVatRate());
        item.setAccountingAccountNumber(input.getAccountingAccountNumber());
        item.setCompany(companyOpt.get());
        item.setDescription(input.getDescription());
        item.setUnitOfMeasure(input.getUnitOfMeasure());
        item.setUnitPrice(input.getUnitPrice());
        item.setIsActive(true);

        return itemRepository.save(item);
    }

    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, @itemRepository.findById(#input.getId()).orElse(null)?.getCompany()?.getId())")
    public Item updateItem(@Argument UpdateItemInput input) {
        Optional<Item> itemOpt = itemRepository.findById(input.getId());
        if (itemOpt.isEmpty()) {
            throw new RuntimeException("Item not found with id: " + input.getId());
        }

        Item item = itemOpt.get();

        // Check if new item number conflicts with existing ones (excluding current item)
        if (input.getItemNumber() != null && !input.getItemNumber().equals(item.getItemNumber())) {
            if (itemRepository.existsByCompanyIdAndItemNumber(item.getCompany().getId(), input.getItemNumber())) {
                throw new RuntimeException("Item number '" + input.getItemNumber() + "' already exists for this company");
            }
            item.setItemNumber(input.getItemNumber());
        }

        if (input.getName() != null) {
            item.setName(input.getName());
        }
        if (input.getNameEn() != null) {
            item.setNameEn(input.getNameEn());
        }
        if (input.getDefaultVatRate() != null) {
            item.setDefaultVatRate(input.getDefaultVatRate());
        }
        if (input.getAccountingAccountNumber() != null) {
            item.setAccountingAccountNumber(input.getAccountingAccountNumber());
        }
        if (input.getDescription() != null) {
            item.setDescription(input.getDescription());
        }
        if (input.getUnitOfMeasure() != null) {
            item.setUnitOfMeasure(input.getUnitOfMeasure());
        }
        if (input.getUnitPrice() != null) {
            item.setUnitPrice(input.getUnitPrice());
        }

        return itemRepository.save(item);
    }

    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, @itemRepository.findById(#id).orElse(null)?.getCompany()?.getId())")
    public Item activateItem(@Argument Long id) {
        Optional<Item> itemOpt = itemRepository.findById(id);
        if (itemOpt.isEmpty()) {
            throw new RuntimeException("Item not found with id: " + id);
        }

        Item item = itemOpt.get();
        item.setIsActive(true);
        return itemRepository.save(item);
    }

    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, @itemRepository.findById(#id).orElse(null)?.getCompany()?.getId())")
    public Item deactivateItem(@Argument Long id) {
        Optional<Item> itemOpt = itemRepository.findById(id);
        if (itemOpt.isEmpty()) {
            throw new RuntimeException("Item not found with id: " + id);
        }

        Item item = itemOpt.get();
        item.setIsActive(false);
        return itemRepository.save(item);
    }

    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, @itemRepository.findById(#id).orElse(null)?.getCompany()?.getId())")
    public Boolean deleteItem(@Argument Long id) {
        Optional<Item> itemOpt = itemRepository.findById(id);
        if (itemOpt.isEmpty()) {
            throw new RuntimeException("Item not found with id: " + id);
        }

        // Check if item is used in any documents
        if (itemRepository.isItemUsedInDocuments(id)) {
            throw new RuntimeException("Cannot delete item: it is used in one or more documents. Please deactivate the item instead.");
        }

        itemRepository.deleteById(id);
        return true;
    }
}