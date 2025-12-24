package com.invoiceapp.backend.config;

import com.invoiceapp.backend.model.*;
import com.invoiceapp.backend.repository.ClientRepository;
import com.invoiceapp.backend.repository.CompanyRepository;
import com.invoiceapp.backend.repository.InvoiceRepository;
import com.invoiceapp.backend.repository.UserRepository;
import com.invoiceapp.backend.repository.PaymentMethodRepository;
import com.invoiceapp.backend.repository.BankAccountRepository;
import com.invoiceapp.backend.repository.CurrencyRepository;
import com.invoiceapp.backend.repository.VatRateRepository;
import com.invoiceapp.backend.repository.VatExemptionReasonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final ClientRepository clientRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final BankAccountRepository bankAccountRepository;
    private final CurrencyRepository currencyRepository;
    private final VatRateRepository vatRateRepository;
    private final VatExemptionReasonRepository vatExemptionReasonRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(UserRepository userRepository, CompanyRepository companyRepository, ClientRepository clientRepository, InvoiceRepository invoiceRepository, PaymentMethodRepository paymentMethodRepository, BankAccountRepository bankAccountRepository, CurrencyRepository currencyRepository, VatRateRepository vatRateRepository, VatExemptionReasonRepository vatExemptionReasonRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.clientRepository = clientRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.currencyRepository = currencyRepository;
        this.vatRateRepository = vatRateRepository;
        this.vatExemptionReasonRepository = vatExemptionReasonRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Инициализираме основните данни, ако не съществуват
        initializeCurrencies();
        initializeVatRates();
        initializeVatExemptionReasons();

        // Проверяваме дали вече има данни, за да не ги добавяме всеки път
        if (userRepository.count() == 0) {
            System.out.println("No data found. Initializing test data...");

            // 1. Създаване на Super Admin
            User superAdmin = new User();
            superAdmin.setUsername("superadmin");
            superAdmin.setPassword(passwordEncoder.encode("superadmin"));
            superAdmin.setEmail("superadmin@invoiceapp.com");
            superAdmin.setRole(Role.SUPER_ADMIN);
            userRepository.save(superAdmin);

            // 2. Създаване на тестова фирма
            Company testCompany = new Company();
            testCompany.setName("Тест ООД");
            testCompany.setAddress("гр. София, бул. България 1");
            testCompany.setVatNumber("BG123456789");
            testCompany.setUserLimit(5);
            companyRepository.save(testCompany);

            // 3. Създаване на администратор за фирмата
            User companyAdmin = new User();
            companyAdmin.setUsername("admin_test");
            companyAdmin.setPassword(passwordEncoder.encode("password"));
            companyAdmin.setEmail("admin@example.com");
            companyAdmin.setRole(Role.ADMIN);
            companyAdmin.setCompany(testCompany);
            userRepository.save(companyAdmin);

            // 4. Създаване на обикновен потребител за фирмата
            User regularUser = new User();
            regularUser.setUsername("user_test");
            regularUser.setPassword(passwordEncoder.encode("password"));
            regularUser.setEmail("user@example.com");
            regularUser.setRole(Role.USER);
            regularUser.setCompany(testCompany);
            userRepository.save(regularUser);

            // 5. Създаване на клиент за фирмата
            Client client = new Client();
            client.setName("Клиент Алфа");
            client.setAddress("гр. Пловдив, ул. Марица 5");
            client.setVatNumber("BG987654321");
            client.setCompany(testCompany);
            clientRepository.save(client);

            // 6. Създаване на фактура
            Invoice invoice = new Invoice();
            invoice.setInvoiceNumber("20250001");
            invoice.setIssueDate(LocalDate.now());
            invoice.setDueDate(LocalDate.now().plusDays(30));
            invoice.setStatus(InvoiceStatus.SENT);
            invoice.setTotalAmount(new BigDecimal("123.45"));
            invoice.setCompany(testCompany);
            invoice.setClient(client);
            invoiceRepository.save(invoice);

            // 7. Създаване на методи на плащане за фирмата
            createDefaultPaymentMethods(testCompany);

            // 8. Създаване на банкови сметки за фирмата
            createDefaultBankAccounts(testCompany);

            System.out.println("Test data initialized successfully.");
        }
    }

    private void createDefaultPaymentMethods(Company company) {
        // В брой (задължителен)
        PaymentMethod cash = new PaymentMethod();
        cash.setName("В брой");
        cash.setNameEn("Cash");
        cash.setMethodCode("CASH");
        cash.setRequiresBankAccount(false);
        cash.setIsDefault(true);
        cash.setSortOrder(1);
        cash.setCompany(company);
        paymentMethodRepository.save(cash);

        // По банкова сметка (задължителен)
        PaymentMethod bankTransfer = new PaymentMethod();
        bankTransfer.setName("По банкова сметка");
        bankTransfer.setNameEn("Bank Transfer");
        bankTransfer.setMethodCode("BANK_TRANSFER");
        bankTransfer.setRequiresBankAccount(true);
        bankTransfer.setSortOrder(2);
        bankTransfer.setCompany(company);
        paymentMethodRepository.save(bankTransfer);

        // Карта (задължителен)
        PaymentMethod card = new PaymentMethod();
        card.setName("Карта");
        card.setNameEn("Card");
        card.setMethodCode("CARD");
        card.setRequiresBankAccount(false);
        card.setSortOrder(3);
        card.setCompany(company);
        paymentMethodRepository.save(card);

        // PayPal (опционален)
        PaymentMethod paypal = new PaymentMethod();
        paypal.setName("PayPal");
        paypal.setNameEn("PayPal");
        paypal.setMethodCode("PAYPAL");
        paypal.setRequiresBankAccount(false);
        paypal.setSortOrder(4);
        paypal.setCompany(company);
        paymentMethodRepository.save(paypal);

        // PayBG (опционален)
        PaymentMethod paybg = new PaymentMethod();
        paybg.setName("PayBG");
        paybg.setNameEn("PayBG");
        paybg.setMethodCode("PAYBG");
        paybg.setRequiresBankAccount(false);
        paybg.setSortOrder(5);
        paybg.setCompany(company);
        paymentMethodRepository.save(paybg);

        System.out.println("Default payment methods created for company: " + company.getName());
    }

    private void createDefaultBankAccounts(Company company) {
        // Основна BGN сметка
        BankAccount bgnAccount = new BankAccount();
        bgnAccount.setBankName("УниКредит Булбанк");
        bgnAccount.setIban("BG80UNCR70001523456789");
        bgnAccount.setBic("UNCRBGSF");
        bgnAccount.setCurrencyCode("BGN");
        bgnAccount.setAccountName("Основна сметка BGN");
        bgnAccount.setIsDefault(true);
        bgnAccount.setSortOrder(1);
        bgnAccount.setCompany(company);
        bankAccountRepository.save(bgnAccount);

        // EUR валутна сметка
        BankAccount eurAccount = new BankAccount();
        eurAccount.setBankName("УниКредит Булбанк");
        eurAccount.setIban("BG52UNCR70001523456790");
        eurAccount.setBic("UNCRBGSF");
        eurAccount.setCurrencyCode("EUR");
        eurAccount.setAccountName("Валутна сметка EUR");
        eurAccount.setSortOrder(2);
        eurAccount.setCompany(company);
        bankAccountRepository.save(eurAccount);

        // USD валутна сметка
        BankAccount usdAccount = new BankAccount();
        usdAccount.setBankName("ДСК Банк");
        usdAccount.setIban("BG18STSA93001523456791");
        usdAccount.setBic("STSABGSF");
        usdAccount.setCurrencyCode("USD");
        usdAccount.setAccountName("Валутна сметка USD");
        usdAccount.setSortOrder(3);
        usdAccount.setCompany(company);
        bankAccountRepository.save(usdAccount);

        System.out.println("Default bank accounts created for company: " + company.getName());
    }

    private void initializeCurrencies() {
        if (currencyRepository.count() == 0) {
            System.out.println("Initializing currencies...");

            // EUR - Евро (базова валута)
            Currency eur = new Currency("EUR", "EUR", null);
            currencyRepository.save(eur);

            // BGN - Български лев
            Currency bgn = new Currency("BGN", "BGN", null);
            currencyRepository.save(bgn);

            // USD - Щатски долар
            Currency usd = new Currency("USD", "USD", null);
            currencyRepository.save(usd);

            System.out.println("Currencies initialized successfully.");
        }
    }

    private void initializeVatRates() {
        if (vatRateRepository.count() == 0) {
            System.out.println("Initializing VAT rates...");

            // Основни ДДС ставки за България
            VatRate vat20 = new VatRate();
            vat20.setRateValue(new BigDecimal("20.00"));
            vat20.setRateName("Основна ставка");
            vat20.setRateNameEn("Standard Rate");
            vat20.setDescription("Основна ДДС ставка 20%");
            vat20.setIsDefault(true);
            vat20.setIsActive(true);
            vat20.setSortOrder(1);
            vatRateRepository.save(vat20);

            VatRate vat0 = new VatRate();
            vat0.setRateValue(BigDecimal.ZERO);
            vat0.setRateName("Нулева ставка");
            vat0.setRateNameEn("Zero Rate");
            vat0.setDescription("Нулева ДДС ставка 0%");
            vat0.setIsActive(true);
            vat0.setSortOrder(2);
            vatRateRepository.save(vat0);

            System.out.println("VAT rates initialized successfully.");
        }
    }

    private void initializeVatExemptionReasons() {
        if (vatExemptionReasonRepository.count() == 0) {
            System.out.println("Initializing VAT exemption reasons...");

            // Основни основания за неначисляване на ДДС
            VatExemptionReason export = new VatExemptionReason();
            export.setReasonCode("ART21");
            export.setReasonName("Износ");
            export.setReasonNameEn("Export");
            export.setLegalBasis("чл. 21, ал. 2 от ЗДДС");
            export.setLegalBasisEn("Art. 21, para. 2 of VAT Act");
            export.setDescription("Неначисляване на ДДС при износ на стоки");
            export.setIsActive(true);
            export.setSortOrder(1);
            vatExemptionReasonRepository.save(export);

            VatExemptionReason intraCommunity = new VatExemptionReason();
            intraCommunity.setReasonCode("ART22");
            intraCommunity.setReasonName("Вътреобщностна доставка");
            intraCommunity.setReasonNameEn("Intra-Community Supply");
            intraCommunity.setLegalBasis("чл. 22, ал. 1 от ЗДДС");
            intraCommunity.setLegalBasisEn("Art. 22, para. 1 of VAT Act");
            intraCommunity.setDescription("Неначисляване на ДДС при вътреобщностна доставка");
            intraCommunity.setIsActive(true);
            intraCommunity.setSortOrder(2);
            vatExemptionReasonRepository.save(intraCommunity);

            System.out.println("VAT exemption reasons initialized successfully.");
        }
    }
}
