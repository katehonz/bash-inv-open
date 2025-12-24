package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.Client;
import com.invoiceapp.backend.model.Company;
import com.invoiceapp.backend.model.dto.CreateClientInput;
import com.invoiceapp.backend.model.dto.CreateClientWithViesInput;
import com.invoiceapp.backend.model.dto.UpdateClientInput;
import com.invoiceapp.backend.model.dto.ClientCreationResult;
import com.invoiceapp.backend.model.dto.DeleteClientResult;
import com.invoiceapp.backend.repository.ClientRepository;
import com.invoiceapp.backend.repository.CompanyRepository;
import com.invoiceapp.backend.service.ClientManagementService;
import com.invoiceapp.backend.service.DocumentService;
import com.invoiceapp.backend.service.ViesService;
import com.invoiceapp.backend.service.ViesService.ViesCompanyData;
import com.invoiceapp.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.invoiceapp.backend.service.ViesService.ViesValidationResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * GraphQL контролер за управление на клиенти с VIES интеграция
 *
 * 🚀 KILLER FEATURE - Автоматично попълване на клиентски данни от VIES!
 * Никой друг в България не предлага това!
 */
@Controller
public class ClientController {

    private static final Logger logger = LoggerFactory.getLogger(ClientController.class);
    
    private final ClientRepository clientRepository;
    private final CompanyRepository companyRepository;
    private final ClientManagementService clientManagementService;
    private final DocumentService documentService;
    private final ViesService viesService;

    private final UserRepository userRepository;

    @Autowired
    public ClientController(ClientRepository clientRepository,
                           CompanyRepository companyRepository,
                           ClientManagementService clientManagementService,
                           DocumentService documentService,
                           ViesService viesService,
                           UserRepository userRepository) {
        this.clientRepository = clientRepository;
        this.companyRepository = companyRepository;
        this.clientManagementService = clientManagementService;
        this.documentService = documentService;
        this.viesService = viesService;
        this.userRepository = userRepository;
    }

    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Client> clientsByCompany(@Argument Long companyId) {
        logger.info("Fetching clients for company ID: {}", companyId);
        List<Client> clients = clientRepository.findByCompanyId(companyId);
        logger.info("Found {} clients for company ID: {}", clients.size(), companyId);
        return clients;
    }

    /**
     * Намира клиент по ID
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessClient(authentication, #id)")
    public Client client(@Argument Long id) {
        logger.info("Fetching client with ID: {}", id);
        Optional<Client> optionalClient = clientRepository.findById(id);
        if (optionalClient.isPresent()) {
            logger.info("Found client: {}", optionalClient.get().getName());
            return optionalClient.get();
        } else {
            logger.warn("Client with ID {} not found", id);
            throw new IllegalArgumentException("Client not found with ID: " + id);
        }
    }

    /**
     * Активни клиенти за фирма
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Client> activeClientsByCompany(@Argument Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        return clientRepository.findByCompanyAndIsActiveTrue(company);
    }

    /**
     * Търси клиенти по име, ЕИК и ДДС номер
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<Client> searchClients(@Argument Long companyId, @Argument String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return clientRepository.findByCompanyId(companyId);
        }

        // Search by name, EIK, or VAT number
        return clientRepository.searchByNameEikOrVatNumber(companyId, searchTerm.trim());
    }

    /**
     * Намира клиент по ДДС номер
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public Optional<Client> clientByVatNumber(@Argument Long companyId, @Argument String vatNumber) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        return clientRepository.findByVatNumberAndCompany(vatNumber, company);
    }

    /**
     * Валидира ДДС номер чрез VIES
     */
    @QueryMapping
    public ViesValidationResult validateVatNumber(@Argument String vatNumber) {
        return viesService.validateVatNumber(vatNumber);
    }

    /**
     * Извлича данни за компания от VIES
     */
    @QueryMapping
    public ViesCompanyData getViesCompanyData(@Argument String vatNumber) {
        return viesService.getCompanyData(vatNumber);
    }

    /**
     * Стандартно създаване на клиент (legacy)
     */
    @MutationMapping
    @Transactional
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #input.companyId)")
    public Client createClient(@Argument CreateClientInput input) {
        logger.info("Creating client with input: {}", input);
        
        Company company = companyRepository.findById(input.companyId())
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        logger.info("Found company: {}", company.getName());

        Client client = new Client();
        client.setName(input.name());
        client.setNameEn(input.nameEn());
        client.setAddress(input.address());
        client.setVatNumber(input.vatNumber());
        client.setEik(input.eik());
        client.setCompany(company);
        
        // Set default values for fields that the frontend expects
        client.setClientType("B2B");
        client.setIsEuVatPayer(input.vatNumber() != null && viesService.isEuVatNumber(input.vatNumber()));
        client.setIsIndividual(false);
        client.setIsActive(true);
        client.setPaymentTerms(30);
        client.setCreditLimit(java.math.BigDecimal.ZERO);
        client.setDiscountPercent(java.math.BigDecimal.ZERO);
        
        client.setCreatedAt(LocalDateTime.now());
        client.setUpdatedAt(LocalDateTime.now());

        logger.info("Saving client: {}", client.getName());
        Client savedClient = clientRepository.save(client);
        logger.info("Client saved with ID: {}", savedClient.getId());
        
        return savedClient;
    }

    /**
     * Създаване на клиент с VIES интеграция
     * 🚀 KILLER FEATURE - Автоматично попълване от VIES!
     */
    @MutationMapping
    @Transactional
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #input.companyId)")
    public ClientCreationResult createClientWithVies(@Argument CreateClientWithViesInput input) {
        logger.info("Creating client with VIES integration: {}", input);
        
        Company company = companyRepository.findById(Long.parseLong(input.companyId()))
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        logger.info("Found company: {}", company.getName());

        // Ако има ДДС номер и не е принудително ръчно въвеждане
        if (input.vatNumber() != null && !input.vatNumber().trim().isEmpty() &&
            (input.forceManualEntry() == null || !input.forceManualEntry())) {
            
            logger.info("Using VIES integration for VAT number: {}", input.vatNumber());
            
            // Автоматично попълване от VIES
            var result = clientManagementService.createClient(company, input.vatNumber());
            
            // Конвертиране на резултата към GraphQL DTO
            if (result.isSuccess()) {
                if (result.isFromVies()) {
                    return ClientCreationResult.success(result.getClient(), true);
                } else if (result.requiresManualEntry()) {
                    return ClientCreationResult.manualEntry(result.getClient());
                }
            } else {
                logger.error("VIES client creation failed: {} - {}", result.getErrorType(), result.getErrorMessage());
                switch (result.getErrorType()) {
                    case "VALIDATION_ERROR":
                        return ClientCreationResult.validationError(result.getErrorMessage());
                    case "VIES_ERROR":
                        return ClientCreationResult.viesError(result.getErrorMessage());
                    case "VIES_INVALID":
                        return ClientCreationResult.viesInvalid(result.getErrorMessage());
                    case "ALREADY_EXISTS":
                        return ClientCreationResult.alreadyExists(result.getClient());
                    default:
                        return ClientCreationResult.viesError("Unknown error: " + result.getErrorMessage());
                }
            }
        }

        logger.info("Using manual client creation");
        // Ръчно създаване на клиент
        return createManualClient(company, input);
    }

    /**
     * Обновява клиент с нови VIES данни
     */
    @MutationMapping
    @PreAuthorize("@customPermissionEvaluator.canAccessClient(authentication, #clientId)")
    public ClientCreationResult updateClientWithVies(@Argument Long clientId, @Argument String newVatNumber) {
        var result = clientManagementService.updateClientFromVies(clientId, newVatNumber);
        
        if (result.isSuccess()) {
            return ClientCreationResult.success(result.getClient(), true);
        } else {
            switch (result.getErrorType()) {
                case "NOT_FOUND":
                    return ClientCreationResult.validationError("Client not found");
                case "VALIDATION_ERROR":
                    return ClientCreationResult.validationError(result.getErrorMessage());
                case "VIES_ERROR":
                    return ClientCreationResult.viesError(result.getErrorMessage());
                case "VIES_INVALID":
                    return ClientCreationResult.viesInvalid(result.getErrorMessage());
                default:
                    return ClientCreationResult.viesError("Unknown error: " + result.getErrorMessage());
            }
        }
    }

    /**
     * Търси клиент по ДДС номер с VIES интеграция
     */
    @QueryMapping
    @PreAuthorize("@customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public ClientCreationResult searchClientByVatNumber(@Argument Long companyId, @Argument String vatNumber) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        
        var result = clientManagementService.searchClientByVatNumber(company, vatNumber);
        
        if (result.isFound()) {
            if (result.getClient() != null) {
                return ClientCreationResult.success(result.getClient(), result.isFromDatabase());
            } else if (result.getViesData() != null) {
                return ClientCreationResult.viesPreview(result.getViesData());
            }
        }
        
        return ClientCreationResult.validationError("Client not found");
    }

    // --- Helper Methods ---

    private ClientCreationResult createManualClient(Company company, CreateClientWithViesInput input) {
        logger.info("Creating manual client with input: {}", input);
        
        Client client = new Client();
        client.setCompany(company);
        client.setName(input.name());
        client.setNameEn(input.nameEn());
        client.setAddress(input.address());
        client.setVatNumber(input.vatNumber());
        client.setEik(input.eik());
        client.setPhone(input.phone());
        client.setEmail(input.email());
        client.setWebsite(input.website());
        client.setClientType(input.clientType() != null ? input.clientType() : "B2C");
        client.setIsIndividual(input.isIndividual() != null ? input.isIndividual() : false);
        client.setIsEuVatPayer(input.vatNumber() != null && viesService.isEuVatNumber(input.vatNumber()));
        
        // Set default values for fields that the frontend expects
        client.setIsActive(true);
        client.setPaymentTerms(input.paymentTerms() != null ? input.paymentTerms() : 30);
        client.setCreditLimit(input.creditLimit() != null ?
            java.math.BigDecimal.valueOf(input.creditLimit()) : java.math.BigDecimal.ZERO);
        client.setDiscountPercent(input.discountPercent() != null ?
            java.math.BigDecimal.valueOf(input.discountPercent()) : java.math.BigDecimal.ZERO);
        
        client.setCreatedAt(LocalDateTime.now());
        client.setUpdatedAt(LocalDateTime.now());

        logger.info("Saving manual client: {}", client.getName());
        Client savedClient = clientRepository.save(client);
        logger.info("Manual client saved with ID: {}", savedClient.getId());
        
        return ClientCreationResult.success(savedClient, false);
    }

    /**
     * Обновява клиент
     */
    @MutationMapping
    @Transactional
    @PreAuthorize("@customPermissionEvaluator.canAccessClient(authentication, #id)")
    public Client updateClient(@Argument Long id, @Argument UpdateClientInput input) {
        logger.info("Updating client with ID: {} and input: {}", id, input);
        
        Optional<Client> optionalClient = clientRepository.findById(id);
        if (optionalClient.isEmpty()) {
            throw new IllegalArgumentException("Client not found with ID: " + id);
        }
        
        Client client = optionalClient.get();
        
        // Update fields if provided
        if (input.name() != null && !input.name().trim().isEmpty()) {
            client.setName(input.name().trim());
        }
        if (input.nameEn() != null) {
            client.setNameEn(input.nameEn().trim().isEmpty() ? null : input.nameEn().trim());
        }
        if (input.address() != null) {
            client.setAddress(input.address().trim().isEmpty() ? null : input.address().trim());
        }
        if (input.vatNumber() != null) {
            client.setVatNumber(input.vatNumber().trim().isEmpty() ? null : input.vatNumber().trim());
        }
        if (input.eik() != null) {
            client.setEik(input.eik().trim().isEmpty() ? null : input.eik().trim());
        }
        if (input.phone() != null) {
            client.setPhone(input.phone().trim().isEmpty() ? null : input.phone().trim());
        }
        if (input.email() != null) {
            client.setEmail(input.email().trim().isEmpty() ? null : input.email().trim());
        }
        if (input.website() != null) {
            client.setWebsite(input.website().trim().isEmpty() ? null : input.website().trim());
        }
        if (input.clientType() != null) {
            client.setClientType(input.clientType());
        }
        if (input.isEuVatPayer() != null) {
            client.setIsEuVatPayer(input.isEuVatPayer());
        }
        if (input.isIndividual() != null) {
            client.setIsIndividual(input.isIndividual());
        }
        if (input.isActive() != null) {
            client.setIsActive(input.isActive());
        }
        if (input.paymentTerms() != null && !input.paymentTerms().trim().isEmpty()) {
            try {
                client.setPaymentTerms(Integer.parseInt(input.paymentTerms().trim()));
            } catch (NumberFormatException e) {
                // If paymentTerms is not a number, treat it as a string description
                // For now, we'll ignore it since the model expects Integer
                logger.warn("Invalid payment terms format: {}", input.paymentTerms());
            }
        }
        if (input.creditLimit() != null) {
            client.setCreditLimit(java.math.BigDecimal.valueOf(input.creditLimit()));
        }
        if (input.discountPercent() != null) {
            client.setDiscountPercent(java.math.BigDecimal.valueOf(input.discountPercent()));
        }
        if (input.notes() != null) {
            client.setNotes(input.notes().trim().isEmpty() ? null : input.notes().trim());
        }
        
        client.setUpdatedAt(LocalDateTime.now());
        
        Client savedClient = clientRepository.save(client);
        logger.info("Client updated successfully with ID: {}", savedClient.getId());
        
        return savedClient;
    }

    /**
     * Изтрива клиент (само ако няма документи)
     */
    @MutationMapping
    @Transactional
    @PreAuthorize("@customPermissionEvaluator.canAccessClient(authentication, #id)")
    public DeleteClientResult deleteClient(@Argument Long id) {
        logger.info("Attempting to delete client with ID: {}", id);
        
        Optional<Client> optionalClient = clientRepository.findById(id);
        if (optionalClient.isEmpty()) {
            return DeleteClientResult.error("Клиентът не е намерен");
        }
        
        Client client = optionalClient.get();
        
        // Check if client has any documents
        long documentCount = documentService.countDocumentsByClient(id);
        if (documentCount > 0) {
            return DeleteClientResult.error(
                String.format("Клиентът не може да бъде изтрит, защото има %d издадени документи", documentCount)
            );
        }
        
        try {
            clientRepository.delete(client);
            logger.info("Client deleted successfully with ID: {}", id);
            return DeleteClientResult.success();
        } catch (Exception e) {
            logger.error("Error deleting client with ID: {}", id, e);
            return DeleteClientResult.error("Грешка при изтриване на клиента: " + e.getMessage());
        }
    }
}
