package com.invoiceapp.backend.dataloader;

import com.invoiceapp.backend.model.*;
import com.invoiceapp.backend.repository.*;
import org.dataloader.DataLoader;
import org.dataloader.DataLoaderRegistry;
import org.springframework.graphql.execution.GraphQlSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.dataloader.BatchLoaderEnvironment;
import org.dataloader.MappedBatchLoader;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Configuration for GraphQL DataLoaders to solve N+1 query problems.
 * DataLoaders batch and cache database lookups within a single GraphQL request.
 */
@Configuration
public class DataLoaderConfig {

    public static final String CLIENT_BY_ID = "clientById";
    public static final String COMPANY_BY_ID = "companyById";
    public static final String DOCUMENT_ITEMS_BY_DOCUMENT_ID = "documentItemsByDocumentId";
    public static final String PAYMENT_METHOD_BY_ID = "paymentMethodById";
    public static final String BANK_ACCOUNT_BY_ID = "bankAccountById";
    public static final String ITEM_BY_ID = "itemById";

    private final ClientRepository clientRepository;
    private final CompanyRepository companyRepository;
    private final DocumentItemRepository documentItemRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final BankAccountRepository bankAccountRepository;
    private final ItemRepository itemRepository;

    public DataLoaderConfig(
            ClientRepository clientRepository,
            CompanyRepository companyRepository,
            DocumentItemRepository documentItemRepository,
            PaymentMethodRepository paymentMethodRepository,
            BankAccountRepository bankAccountRepository,
            ItemRepository itemRepository) {
        this.clientRepository = clientRepository;
        this.companyRepository = companyRepository;
        this.documentItemRepository = documentItemRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.itemRepository = itemRepository;
    }

    /**
     * Creates a DataLoaderRegistry that will be used for each GraphQL request.
     * Each request gets its own registry to ensure proper batching within the request scope.
     */
    public DataLoaderRegistry createDataLoaderRegistry() {
        DataLoaderRegistry registry = new DataLoaderRegistry();

        // Client DataLoader - loads clients by their IDs
        registry.register(CLIENT_BY_ID, DataLoader.newMappedDataLoader(
                (Set<Long> clientIds) -> CompletableFuture.supplyAsync(() -> {
                    List<Client> clients = clientRepository.findAllById(clientIds);
                    return clients.stream().collect(Collectors.toMap(Client::getId, Function.identity()));
                })
        ));

        // Company DataLoader - loads companies by their IDs
        registry.register(COMPANY_BY_ID, DataLoader.newMappedDataLoader(
                (Set<Long> companyIds) -> CompletableFuture.supplyAsync(() -> {
                    List<Company> companies = companyRepository.findAllById(companyIds);
                    return companies.stream().collect(Collectors.toMap(Company::getId, Function.identity()));
                })
        ));

        // DocumentItems DataLoader - loads document items grouped by document ID
        registry.register(DOCUMENT_ITEMS_BY_DOCUMENT_ID, DataLoader.newMappedDataLoader(
                (Set<Long> documentIds) -> CompletableFuture.supplyAsync(() -> {
                    List<DocumentItem> items = documentItemRepository.findByDocumentIdIn(documentIds);
                    return items.stream().collect(Collectors.groupingBy(
                            item -> item.getDocument().getId()
                    ));
                })
        ));

        // PaymentMethod DataLoader - loads payment methods by their IDs
        registry.register(PAYMENT_METHOD_BY_ID, DataLoader.newMappedDataLoader(
                (Set<Long> paymentMethodIds) -> CompletableFuture.supplyAsync(() -> {
                    List<PaymentMethod> methods = paymentMethodRepository.findAllById(paymentMethodIds);
                    return methods.stream().collect(Collectors.toMap(PaymentMethod::getId, Function.identity()));
                })
        ));

        // BankAccount DataLoader - loads bank accounts by their IDs
        registry.register(BANK_ACCOUNT_BY_ID, DataLoader.newMappedDataLoader(
                (Set<Long> bankAccountIds) -> CompletableFuture.supplyAsync(() -> {
                    List<BankAccount> accounts = bankAccountRepository.findAllById(bankAccountIds);
                    return accounts.stream().collect(Collectors.toMap(BankAccount::getId, Function.identity()));
                })
        ));

        // Item DataLoader - loads items by their IDs
        registry.register(ITEM_BY_ID, DataLoader.newMappedDataLoader(
                (Set<Long> itemIds) -> CompletableFuture.supplyAsync(() -> {
                    List<Item> items = itemRepository.findAllById(itemIds);
                    return items.stream().collect(Collectors.toMap(Item::getId, Function.identity()));
                })
        ));

        return registry;
    }
}
