package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.PaymentMethod;
import com.invoiceapp.backend.model.BankAccount;
import com.invoiceapp.backend.model.Company;
import com.invoiceapp.backend.model.dto.CreatePaymentMethodInput;
import com.invoiceapp.backend.model.dto.CreateBankAccountInput;
import com.invoiceapp.backend.repository.PaymentMethodRepository;
import com.invoiceapp.backend.repository.BankAccountRepository;
import com.invoiceapp.backend.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Optional;

@Controller
public class PaymentController {

    private final PaymentMethodRepository paymentMethodRepository;
    private final BankAccountRepository bankAccountRepository;
    private final CompanyRepository companyRepository;

    @Autowired
    public PaymentController(PaymentMethodRepository paymentMethodRepository, 
                           BankAccountRepository bankAccountRepository,
                           CompanyRepository companyRepository) {
        this.paymentMethodRepository = paymentMethodRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.companyRepository = companyRepository;
    }

    // Payment Method Queries
    @QueryMapping
    public List<PaymentMethod> paymentMethodsByCompany(@Argument Long companyId) {
        return paymentMethodRepository.findByCompanyIdOrderBySortOrderAscNameAsc(companyId);
    }

    @QueryMapping
    public List<PaymentMethod> activePaymentMethodsByCompany(@Argument Long companyId) {
        return paymentMethodRepository.findByCompanyIdAndIsActiveTrueOrderBySortOrderAscNameAsc(companyId);
    }

    @QueryMapping
    public Optional<PaymentMethod> paymentMethodById(@Argument Long id) {
        return paymentMethodRepository.findById(id);
    }

    @QueryMapping
    public Optional<PaymentMethod> paymentMethodByCode(@Argument Long companyId, @Argument String methodCode) {
        return paymentMethodRepository.findByCompanyIdAndMethodCode(companyId, methodCode);
    }

    @QueryMapping
    public Optional<PaymentMethod> defaultPaymentMethod(@Argument Long companyId) {
        return paymentMethodRepository.findByCompanyIdAndIsDefaultTrue(companyId);
    }

    @QueryMapping
    public List<PaymentMethod> bankTransferPaymentMethods(@Argument Long companyId) {
        return paymentMethodRepository.findByCompanyIdAndRequiresBankAccountTrue(companyId);
    }

    // Bank Account Queries
    @QueryMapping
    public List<BankAccount> bankAccountsByCompany(@Argument Long companyId) {
        return bankAccountRepository.findByCompanyIdOrderBySortOrderAscBankNameAsc(companyId);
    }

    @QueryMapping
    public List<BankAccount> activeBankAccountsByCompany(@Argument Long companyId) {
        return bankAccountRepository.findByCompanyIdAndIsActiveTrueOrderBySortOrderAscBankNameAsc(companyId);
    }

    @QueryMapping
    public Optional<BankAccount> bankAccountById(@Argument Long id) {
        return bankAccountRepository.findById(id);
    }

    @QueryMapping
    public Optional<BankAccount> bankAccountByIban(@Argument Long companyId, @Argument String iban) {
        return bankAccountRepository.findByCompanyIdAndIban(companyId, iban);
    }

    @QueryMapping
    public Optional<BankAccount> defaultBankAccount(@Argument Long companyId) {
        return bankAccountRepository.findByCompanyIdAndIsDefaultTrue(companyId);
    }

    @QueryMapping
    public List<BankAccount> bankAccountsByCurrency(@Argument Long companyId, @Argument String currencyCode) {
        return bankAccountRepository.findByCompanyIdAndIsActiveTrueAndCurrencyCode(companyId, currencyCode);
    }

    @QueryMapping
    public List<BankAccount> bgnBankAccounts(@Argument Long companyId) {
        return bankAccountRepository.findActiveBgnAccountsByCompany(companyId);
    }

    @QueryMapping
    public List<BankAccount> foreignCurrencyBankAccounts(@Argument Long companyId) {
        return bankAccountRepository.findActiveForeignCurrencyAccountsByCompany(companyId);
    }

    // Payment Method Mutations
    @MutationMapping
    public PaymentMethod createPaymentMethod(@Argument CreatePaymentMethodInput input) {
        Company company = companyRepository.findById(input.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Company not found"));

        PaymentMethod paymentMethod = new PaymentMethod();
        paymentMethod.setName(input.getName());
        paymentMethod.setNameEn(input.getNameEn());
        paymentMethod.setMethodCode(input.getMethodCode());
        paymentMethod.setRequiresBankAccount(input.getRequiresBankAccount() != null ? input.getRequiresBankAccount() : false);
        paymentMethod.setSortOrder(input.getSortOrder() != null ? input.getSortOrder() : 0);
        paymentMethod.setDescription(input.getDescription());
        paymentMethod.setIsDefault(input.getIsDefault() != null ? input.getIsDefault() : false);
        paymentMethod.setCompany(company);

        return paymentMethodRepository.save(paymentMethod);
    }

    @MutationMapping
    public PaymentMethod setDefaultPaymentMethod(@Argument Long id) {
        PaymentMethod paymentMethod = paymentMethodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment method not found"));

        // Remove default flag from other payment methods in the same company
        List<PaymentMethod> companyMethods = paymentMethodRepository.findByCompanyIdOrderBySortOrderAscNameAsc(paymentMethod.getCompany().getId());
        companyMethods.forEach(pm -> pm.setIsDefault(false));
        paymentMethodRepository.saveAll(companyMethods);

        // Set this one as default
        paymentMethod.setIsDefault(true);
        return paymentMethodRepository.save(paymentMethod);
    }

    @MutationMapping
    public PaymentMethod activatePaymentMethod(@Argument Long id) {
        PaymentMethod paymentMethod = paymentMethodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment method not found"));
        
        paymentMethod.setIsActive(true);
        return paymentMethodRepository.save(paymentMethod);
    }

    @MutationMapping
    public PaymentMethod deactivatePaymentMethod(@Argument Long id) {
        PaymentMethod paymentMethod = paymentMethodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment method not found"));
        
        paymentMethod.setIsActive(false);
        paymentMethod.setIsDefault(false); // Remove default flag if deactivating
        return paymentMethodRepository.save(paymentMethod);
    }

    // Bank Account Mutations
    @MutationMapping
    public BankAccount createBankAccount(@Argument CreateBankAccountInput input) {
        Company company = companyRepository.findById(input.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Company not found"));

        BankAccount bankAccount = new BankAccount();
        bankAccount.setBankName(input.getBankName());
        bankAccount.setIban(input.getIban());
        bankAccount.setBic(input.getBic());
        bankAccount.setCurrencyCode(input.getCurrencyCode());
        bankAccount.setAccountName(input.getAccountName());
        bankAccount.setSortOrder(input.getSortOrder() != null ? input.getSortOrder() : 0);
        bankAccount.setDescription(input.getDescription());
        bankAccount.setIsDefault(input.getIsDefault() != null ? input.getIsDefault() : false);
        bankAccount.setCompany(company);

        return bankAccountRepository.save(bankAccount);
    }

    @MutationMapping
    public BankAccount setDefaultBankAccount(@Argument Long id) {
        BankAccount bankAccount = bankAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bank account not found"));

        // Remove default flag from other bank accounts in the same company
        List<BankAccount> companyAccounts = bankAccountRepository.findByCompanyIdOrderBySortOrderAscBankNameAsc(bankAccount.getCompany().getId());
        companyAccounts.forEach(ba -> ba.setIsDefault(false));
        bankAccountRepository.saveAll(companyAccounts);

        // Set this one as default
        bankAccount.setIsDefault(true);
        return bankAccountRepository.save(bankAccount);
    }

    @MutationMapping
    public BankAccount activateBankAccount(@Argument Long id) {
        BankAccount bankAccount = bankAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bank account not found"));
        
        bankAccount.setIsActive(true);
        return bankAccountRepository.save(bankAccount);
    }

    @MutationMapping
    public BankAccount deactivateBankAccount(@Argument Long id) {
        BankAccount bankAccount = bankAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bank account not found"));
        
        bankAccount.setIsActive(false);
        bankAccount.setIsDefault(false); // Remove default flag if deactivating
        return bankAccountRepository.save(bankAccount);
    }
}