package com.invoiceapp.backend.service;

import com.invoiceapp.backend.model.Client;
import com.invoiceapp.backend.model.Company;
import com.invoiceapp.backend.repository.ClientRepository;
import com.invoiceapp.backend.service.ViesService.ViesCompanyData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Сервис за управление на клиенти с VIES интеграция
 * Автоматично попълва данни от VIES за EU клиенти
 * Позволява ръчно въвеждане за клиенти без ДДС номер
 * 
 * 🚀 KILLER FEATURE - Автоматично откриване и попълване на клиентски данни!
 */
@Service
@Transactional
public class ClientManagementService {

    private static final Logger logger = LoggerFactory.getLogger(ClientManagementService.class);
    
    private final ClientRepository clientRepository;
    private final ViesService viesService;
    private final ValidationService validationService;

    public ClientManagementService(ClientRepository clientRepository, 
                                 ViesService viesService,
                                 ValidationService validationService) {
        this.clientRepository = clientRepository;
        this.viesService = viesService;
        this.validationService = validationService;
    }

    /**
     * Създава нов клиент с автоматично попълване от VIES
     * @param company фирмата към която се добавя клиентът
     * @param vatNumber ДДС номер (за EU клиенти) или null (за ръчно въвеждане)
     * @return ClientCreationResult с резултата
     */
    public ClientCreationResult createClient(Company company, String vatNumber) {
        if (vatNumber != null && !vatNumber.trim().isEmpty()) {
            return createClientFromVies(company, vatNumber);
        } else {
            return createManualClient(company);
        }
    }

    /**
     * Създава клиент от VIES данни
     */
    private ClientCreationResult createClientFromVies(Company company, String vatNumber) {
        logger.info("Creating client from VIES for VAT: {}", vatNumber);
        
        // Валидация на ДДС номера
        if (!validationService.validateBulgarianVatNumber(vatNumber) && 
            !viesService.isEuVatNumber(vatNumber)) {
            return ClientCreationResult.validationError("Invalid VAT number format");
        }

        // Проверка за съществуващ клиент
        Optional<Client> existingClient = clientRepository.findByVatNumberAndCompany(vatNumber, company);
        if (existingClient.isPresent()) {
            return ClientCreationResult.alreadyExists(existingClient.get());
        }

        // Извличане на данни от VIES
        ViesCompanyData viesData = viesService.getCompanyData(vatNumber);
        
        if (viesData.hasError()) {
            return ClientCreationResult.viesError(viesData.getErrorMessage());
        }

        if (!viesData.isValid()) {
            return ClientCreationResult.viesInvalid("VAT number not found in VIES");
        }

        // Създаване на клиент от VIES данни
        Client client = new Client();
        client.setCompany(company);
        client.setVatNumber(vatNumber);
        client.setName(viesData.getCompanyName());
        client.setAddress(viesData.getAddress());
        client.setClientType("B2B"); // EU клиентите са винаги B2B
        client.setIsEuVatPayer(true);
        client.setIsIndividual(false);
        client.setIsActive(true);
        client.setPaymentTerms(30);
        client.setCreditLimit(java.math.BigDecimal.ZERO);
        client.setDiscountPercent(java.math.BigDecimal.ZERO);
        client.setCreatedAt(LocalDateTime.now());
        client.setUpdatedAt(LocalDateTime.now());

        // Определяне на страната и допълнителни настройки
        String countryCode = viesService.getCountryCode(vatNumber);
        if ("BG".equals(countryCode)) {
            client.setEik(viesService.getVatNumberWithoutCountryCode(vatNumber));
        }

        Client savedClient = clientRepository.save(client);
        logger.info("Created client from VIES: {} for company: {}", savedClient.getName(), company.getName());
        
        return ClientCreationResult.success(savedClient, true);
    }

    /**
     * Създава празен клиент за ръчно попълване
     */
    private ClientCreationResult createManualClient(Company company) {
        logger.info("Creating manual client for company: {}", company.getName());
        
        Client client = new Client();
        client.setCompany(company);
        client.setClientType("B2C"); // По подразбиране за ръчни клиенти
        client.setIsEuVatPayer(false);
        client.setIsIndividual(false);
        client.setIsActive(true);
        client.setPaymentTerms(30);
        client.setCreditLimit(java.math.BigDecimal.ZERO);
        client.setDiscountPercent(java.math.BigDecimal.ZERO);
        client.setCreatedAt(LocalDateTime.now());
        client.setUpdatedAt(LocalDateTime.now());

        return ClientCreationResult.manualEntry(client);
    }

    /**
     * Обновява съществуващ клиент с нови VIES данни
     */
    public ClientUpdateResult updateClientFromVies(Long clientId, String newVatNumber) {
        Optional<Client> clientOpt = clientRepository.findById(clientId);
        if (clientOpt.isEmpty()) {
            return ClientUpdateResult.notFound();
        }

        Client client = clientOpt.get();
        
        if (newVatNumber == null || newVatNumber.trim().isEmpty()) {
            return ClientUpdateResult.validationError("VAT number cannot be empty");
        }

        // Валидация на новия ДДС номер
        if (!validationService.validateBulgarianVatNumber(newVatNumber) && 
            !viesService.isEuVatNumber(newVatNumber)) {
            return ClientUpdateResult.validationError("Invalid VAT number format");
        }

        // Извличане на нови данни от VIES
        ViesCompanyData viesData = viesService.getCompanyData(newVatNumber);
        
        if (viesData.hasError()) {
            return ClientUpdateResult.viesError(viesData.getErrorMessage());
        }

        if (!viesData.isValid()) {
            return ClientUpdateResult.viesInvalid("VAT number not found in VIES");
        }

        // Обновяване на клиента
        client.setVatNumber(newVatNumber);
        client.setName(viesData.getCompanyName());
        client.setAddress(viesData.getAddress());
        client.setClientType("B2B");
        client.setIsEuVatPayer(true);
        client.setUpdatedAt(LocalDateTime.now());

        // Определяне на страната и ЕИК
        String countryCode = viesService.getCountryCode(newVatNumber);
        if ("BG".equals(countryCode)) {
            client.setEik(viesService.getVatNumberWithoutCountryCode(newVatNumber));
        }

        Client updatedClient = clientRepository.save(client);
        logger.info("Updated client from VIES: {} (ID: {})", updatedClient.getName(), clientId);
        
        return ClientUpdateResult.success(updatedClient);
    }

    /**
     * Търси клиент по ДДС номер с VIES валидация
     */
    public ClientSearchResult searchClientByVatNumber(Company company, String vatNumber) {
        // Първо търси в локалната база данни
        Optional<Client> existingClient = clientRepository.findByVatNumberAndCompany(vatNumber, company);
        if (existingClient.isPresent()) {
            return ClientSearchResult.found(existingClient.get(), false);
        }

        // Ако не е намерен локално, търси в VIES
        if (viesService.isEuVatNumber(vatNumber)) {
            ViesCompanyData viesData = viesService.getCompanyData(vatNumber);
            
            if (viesData.isValid()) {
                return ClientSearchResult.viesResult(viesData);
            }
        }

        return ClientSearchResult.notFound();
    }

    // --- Result Classes ---

    public static class ClientCreationResult {
        private final boolean success;
        private final Client client;
        private final boolean fromVies;
        private final boolean requiresManualEntry;
        private final String errorMessage;
        private final String errorType;

        private ClientCreationResult(boolean success, Client client, boolean fromVies, 
                                   boolean requiresManualEntry, String errorMessage, String errorType) {
            this.success = success;
            this.client = client;
            this.fromVies = fromVies;
            this.requiresManualEntry = requiresManualEntry;
            this.errorMessage = errorMessage;
            this.errorType = errorType;
        }

        public static ClientCreationResult success(Client client, boolean fromVies) {
            return new ClientCreationResult(true, client, fromVies, false, null, null);
        }

        public static ClientCreationResult manualEntry(Client client) {
            return new ClientCreationResult(true, client, false, true, null, null);
        }

        public static ClientCreationResult validationError(String message) {
            return new ClientCreationResult(false, null, false, false, message, "VALIDATION_ERROR");
        }

        public static ClientCreationResult viesError(String message) {
            return new ClientCreationResult(false, null, false, false, message, "VIES_ERROR");
        }

        public static ClientCreationResult viesInvalid(String message) {
            return new ClientCreationResult(false, null, false, false, message, "VIES_INVALID");
        }

        public static ClientCreationResult alreadyExists(Client client) {
            return new ClientCreationResult(false, client, false, false, "Client already exists", "ALREADY_EXISTS");
        }

        // Getters
        public boolean isSuccess() { return success; }
        public Client getClient() { return client; }
        public boolean isFromVies() { return fromVies; }
        public boolean requiresManualEntry() { return requiresManualEntry; }
        public String getErrorMessage() { return errorMessage; }
        public String getErrorType() { return errorType; }
    }

    public static class ClientUpdateResult {
        private final boolean success;
        private final Client client;
        private final String errorMessage;
        private final String errorType;

        private ClientUpdateResult(boolean success, Client client, String errorMessage, String errorType) {
            this.success = success;
            this.client = client;
            this.errorMessage = errorMessage;
            this.errorType = errorType;
        }

        public static ClientUpdateResult success(Client client) {
            return new ClientUpdateResult(true, client, null, null);
        }

        public static ClientUpdateResult notFound() {
            return new ClientUpdateResult(false, null, "Client not found", "NOT_FOUND");
        }

        public static ClientUpdateResult validationError(String message) {
            return new ClientUpdateResult(false, null, message, "VALIDATION_ERROR");
        }

        public static ClientUpdateResult viesError(String message) {
            return new ClientUpdateResult(false, null, message, "VIES_ERROR");
        }

        public static ClientUpdateResult viesInvalid(String message) {
            return new ClientUpdateResult(false, null, message, "VIES_INVALID");
        }

        // Getters
        public boolean isSuccess() { return success; }
        public Client getClient() { return client; }
        public String getErrorMessage() { return errorMessage; }
        public String getErrorType() { return errorType; }
    }

    public static class ClientSearchResult {
        private final boolean found;
        private final Client client;
        private final boolean fromDatabase;
        private final ViesCompanyData viesData;

        private ClientSearchResult(boolean found, Client client, boolean fromDatabase, ViesCompanyData viesData) {
            this.found = found;
            this.client = client;
            this.fromDatabase = fromDatabase;
            this.viesData = viesData;
        }

        public static ClientSearchResult found(Client client, boolean fromDatabase) {
            return new ClientSearchResult(true, client, fromDatabase, null);
        }

        public static ClientSearchResult viesResult(ViesCompanyData viesData) {
            return new ClientSearchResult(true, null, false, viesData);
        }

        public static ClientSearchResult notFound() {
            return new ClientSearchResult(false, null, false, null);
        }

        // Getters
        public boolean isFound() { return found; }
        public Client getClient() { return client; }
        public boolean isFromDatabase() { return fromDatabase; }
        public ViesCompanyData getViesData() { return viesData; }
    }
}