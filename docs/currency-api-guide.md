# Currency API Guide - Ръководство за разработчици

## Преглед

Това ръководство описва как да работите с новата многовалутна архитектура в приложението за фактуриране.

## Основни API класове

### 1. CurrencyConfiguration

Централна конфигурация за валутната система.

```java
@Autowired
private CurrencyConfiguration currencyConfig;

// Проверка дали сме в Еврозоната
boolean isEurozone = currencyConfig.isEurozoneActive();

// Получаване на базовата валута
String baseCurrency = currencyConfig.getBaseCurrency(); // "BGN" или "EUR"

// Получаване на валутата по подразбиране
String defaultCurrency = currencyConfig.getDefaultCurrency();

// Получаване на фиксирания курс BGN/EUR
BigDecimal bgnEurRate = currencyConfig.getBgnToEurRate(); // 1.95583
```

### 2. ExchangeRateService

Главен сервис за получаване на валутни курсове.

```java
@Autowired
private ExchangeRateService exchangeRateService;

// Получаване на курс за конкретна дата
ExchangeRate rate = exchangeRateService.getRate("USD", LocalDate.now());

// Получаване на най-актуален курс
ExchangeRate latestRate = exchangeRateService.getLatestRate("EUR");

// Проверка дали съществува курс
boolean hasRate = exchangeRateService.hasRate("GBP", LocalDate.of(2025, 1, 1));

// Получаване на всички курсове за дата
List<ExchangeRate> allRates = exchangeRateService.getAllRatesForDate(LocalDate.now());
```

### 3. ExchangeRateProviderService

Управление на валутните източници.

```java
@Autowired
private ExchangeRateProviderService providerService;

// Получаване на активния източник
String activeProvider = providerService.getActiveProvider(); // "BNB" или "ECB"

// Ръчно изтегляне на курсове
providerService.fetchRatesManually();

// Проверка дали даден източник е активен
boolean isBnbActive = providerService.isProviderActive("BNB");

// Получаване на статус на системата
SystemStatus status = providerService.getSystemStatus();
System.out.println("Eurozone: " + status.isEurozoneActive());
System.out.println("Provider: " + status.getActiveProvider());
System.out.println("Base Currency: " + status.getBaseCurrency());
```

### 4. DocumentService

Обновен за работа с новата валутна система.

```java
@Autowired
private DocumentService documentService;

// Създаване на документ с валута
CreateDocumentInput input = new CreateDocumentInput();
input.setCurrencyCode("USD"); // Ще се използва USD
// Ако не се зададе, ще се използва валутата по подразбиране

Document document = documentService.createDocument(input);

// Документът автоматично ще има:
// - subtotalAmount, vatAmount, totalAmountWithVat в USD
// - subtotalAmountBgn, vatAmountBgn, totalAmountWithVatBgn в BGN
// - exchangeRate - курсът използван за конверсия
```

## Работа с курсове

### Получаване на курс

```java
// Основен начин
ExchangeRate rate = exchangeRateService.getRate("USD", LocalDate.now());
BigDecimal usdRate = rate.getRate();
String baseCurrency = rate.getBaseCurrency(); // "BGN" или "EUR"

// За базовата валута (винаги връща 1.0)
ExchangeRate baseRate = exchangeRateService.getRate("BGN", LocalDate.now());
// baseRate.getRate() = 1.0

// За EUR (фиксиран курс)
ExchangeRate eurRate = exchangeRateService.getRate("EUR", LocalDate.now());
// eurRate.getRate() = 1.95583
```

### Конверсия към BGN

```java
public BigDecimal convertToBgn(BigDecimal amount, String fromCurrency, LocalDate date) {
    if ("BGN".equals(fromCurrency)) {
        return amount;
    }
    
    if (currencyConfig.isEurozoneActive()) {
        // След 2026: EUR е базова валута
        if ("EUR".equals(fromCurrency)) {
            return amount.multiply(currencyConfig.getBgnToEurRate());
        }
        // За други валути: валута -> EUR -> BGN
        ExchangeRate eurRate = exchangeRateService.getRate(fromCurrency, date);
        return amount.divide(eurRate.getRate(), 2, RoundingMode.HALF_UP)
                    .multiply(currencyConfig.getBgnToEurRate());
    } else {
        // Преди 2026: BGN е базова валута
        if ("EUR".equals(fromCurrency)) {
            return amount.multiply(currencyConfig.getBgnToEurRate());
        }
        // За други валути: директно от БНБ
        ExchangeRate bgnRate = exchangeRateService.getRate(fromCurrency, date);
        return amount.multiply(bgnRate.getRate());
    }
}
```

## Обработка на грешки

### Често срещани exceptions

```java
try {
    ExchangeRate rate = exchangeRateService.getRate("USD", LocalDate.now());
} catch (IllegalStateException e) {
    // Няма курс за дадената валута/дата
    log.error("No exchange rate found: {}", e.getMessage());
    
    // Можете да използвате fallback логика
    // или да поискате от потребителя да въведе курс ръчно
}

try {
    Currency currency = currencyRepository.findByCode("XYZ")
                                        .orElseThrow(() -> new IllegalArgumentException("Invalid currency"));
} catch (IllegalArgumentException e) {
    // Невалидна валута
    log.error("Invalid currency: {}", e.getMessage());
}
```

### Fallback стратегии

```java
public ExchangeRate getRateWithFallback(String currencyCode, LocalDate date) {
    try {
        return exchangeRateService.getRate(currencyCode, date);
    } catch (IllegalStateException e) {
        // Опитайте се със снощната дата
        try {
            return exchangeRateService.getRate(currencyCode, date.minusDays(1));
        } catch (IllegalStateException e2) {
            // Използвайте default курс
            return createDefaultRate(currencyCode, date);
        }
    }
}

private ExchangeRate createDefaultRate(String currencyCode, LocalDate date) {
    // Предварително дефинирани курсове за критични валути
    Map<String, BigDecimal> defaultRates = Map.of(
        "EUR", new BigDecimal("1.95583"),
        "USD", new BigDecimal("1.80"),
        "GBP", new BigDecimal("2.30")
    );
    
    BigDecimal rate = defaultRates.getOrDefault(currencyCode, BigDecimal.ONE);
    
    ExchangeRate defaultRate = new ExchangeRate();
    defaultRate.setCurrency(currencyRepository.findByCode(currencyCode).orElse(null));
    defaultRate.setRate(rate);
    defaultRate.setRateDate(date);
    defaultRate.setBaseCurrency(currencyConfig.getBaseCurrency());
    
    return defaultRate;
}
```

## Тестване

### Unit тестове

```java
@ExtendWith(MockitoExtension.class)
class ExchangeRateServiceTest {
    
    @Mock
    private ExchangeRateRepository exchangeRateRepository;
    
    @Mock
    private CurrencyConfiguration currencyConfig;
    
    @InjectMocks
    private ExchangeRateService exchangeRateService;
    
    @Test
    void testGetRate_BGN_ReturnOne() {
        // Given
        when(currencyConfig.getBaseCurrency()).thenReturn("BGN");
        
        // When
        ExchangeRate rate = exchangeRateService.getRate("BGN", LocalDate.now());
        
        // Then
        assertThat(rate.getRate()).isEqualTo(BigDecimal.ONE);
    }
    
    @Test
    void testGetRate_EUR_PreEurozone_ReturnFixedRate() {
        // Given
        when(currencyConfig.getBaseCurrency()).thenReturn("BGN");
        when(currencyConfig.getBgnToEurRate()).thenReturn(new BigDecimal("1.95583"));
        
        // When
        ExchangeRate rate = exchangeRateService.getRate("EUR", LocalDate.now());
        
        // Then
        assertThat(rate.getRate()).isEqualTo(new BigDecimal("1.95583"));
    }
}
```

### Integration тестове

```java
@SpringBootTest
@TestPropertySource(properties = {
    "currency.force-eurozone-mode=false",
    "currency.enable-bnb-rates=true"
})
class CurrencyIntegrationTest {
    
    @Autowired
    private DocumentService documentService;
    
    @Autowired
    private ExchangeRateService exchangeRateService;
    
    @Test
    void testCreateDocument_WithUSD_CalculatesBGNAmounts() {
        // Given
        CreateDocumentInput input = new CreateDocumentInput();
        input.setCurrencyCode("USD");
        // ... други данни
        
        // When
        Document document = documentService.createDocument(input);
        
        // Then
        assertThat(document.getCurrency().getCode()).isEqualTo("USD");
        assertThat(document.getSubtotalAmountBgn()).isNotNull();
        assertThat(document.getExchangeRate()).isNotNull();
    }
}
```

### Тестване на прехода към Еврозоната

```java
@Test
void testEurozoneTransition() {
    // Given - форсираме Еврозона режим
    currencyConfig.setForceEurozoneMode(true);
    
    // When
    String baseCurrency = currencyConfig.getBaseCurrency();
    String defaultCurrency = currencyConfig.getDefaultCurrency();
    
    // Then
    assertThat(baseCurrency).isEqualTo("EUR");
    assertThat(defaultCurrency).isEqualTo("EUR");
}
```

## Конфигурация за различни среди

### Development
```properties
# application-dev.properties
currency.force-eurozone-mode=false
currency.enable-bnb-rates=true
currency.enable-ecb-rates=true
logging.level.com.invoiceapp.backend.service=DEBUG
```

### Production (преди 2026)
```properties
# application-prod.properties
currency.force-eurozone-mode=false
currency.enable-bnb-rates=true
currency.enable-ecb-rates=false
logging.level.com.invoiceapp.backend.service=INFO
```

### Production (след 2026)
```properties
# application-prod.properties
currency.force-eurozone-mode=false
currency.enable-bnb-rates=false
currency.enable-ecb-rates=true
logging.level.com.invoiceapp.backend.service=INFO
```

## Мониторинг и логиране

### Важни метрики

```java
@Component
public class CurrencyMetrics {
    
    private final MeterRegistry meterRegistry;
    
    public void recordExchangeRateFailure(String provider) {
        Counter.builder("exchange_rate_failures")
              .tag("provider", provider)
              .register(meterRegistry)
              .increment();
    }
    
    public void recordCurrencyConversion(String fromCurrency, String toCurrency) {
        Counter.builder("currency_conversions")
              .tag("from", fromCurrency)
              .tag("to", toCurrency)
              .register(meterRegistry)
              .increment();
    }
}
```

### Structured logging

```java
@Slf4j
@Service
public class ExchangeRateService {
    
    public ExchangeRate getRate(String currencyCode, LocalDate date) {
        log.info("Getting exchange rate for {} on {}", currencyCode, date);
        
        try {
            ExchangeRate rate = findRate(currencyCode, date);
            log.info("Found exchange rate: {} {} = {} {}", 
                    1, currencyCode, rate.getRate(), rate.getBaseCurrency());
            return rate;
        } catch (Exception e) {
            log.error("Failed to get exchange rate for {} on {}: {}", 
                     currencyCode, date, e.getMessage());
            throw e;
        }
    }
}
```

## Миграция от стара архитектура

### Проверка на съществуващи данни

```java
@Component
public class CurrencyMigrationService {
    
    public void validateExistingRates() {
        List<ExchangeRate> inconsistentRates = exchangeRateRepository.findAll()
            .stream()
            .filter(rate -> {
                // Проверка за смесени базови валути
                String expectedBase = rate.getRateDate().isBefore(LocalDate.of(2026, 1, 1)) 
                                    ? "BGN" : "EUR";
                return !expectedBase.equals(rate.getBaseCurrency());
            })
            .collect(Collectors.toList());
            
        if (!inconsistentRates.isEmpty()) {
            log.warn("Found {} inconsistent exchange rates", inconsistentRates.size());
            // Поправете или маркирайте за преглед
        }
    }
}
```

### Обновяване на базовите валути

```sql
-- Обновяване на всички стари записи да имат правилната базова валута
UPDATE exchange_rates 
SET base_currency = 'BGN' 
WHERE rate_date < '2026-01-01' AND base_currency != 'BGN';

UPDATE exchange_rates 
SET base_currency = 'EUR' 
WHERE rate_date >= '2026-01-01' AND base_currency != 'EUR';
```

## Най-добри практики

### 1. Винаги използвайте централизираните сервиси

```java
// ✅ Правилно
@Autowired
private ExchangeRateService exchangeRateService;

ExchangeRate rate = exchangeRateService.getRate("USD", LocalDate.now());

// ❌ Грешно
@Autowired
private ExchangeRateRepository exchangeRateRepository;

Optional<ExchangeRate> rate = exchangeRateRepository.findByCurrencyCodeAndDate("USD", LocalDate.now());
```

### 2. Обработвайте грешки подходящо

```java
// ✅ Правилно
try {
    ExchangeRate rate = exchangeRateService.getRate("USD", date);
    return calculateAmount(rate);
} catch (IllegalStateException e) {
    log.warn("No exchange rate found for USD on {}, using fallback", date);
    return calculateAmountWithFallback();
}

// ❌ Грешно
ExchangeRate rate = exchangeRateService.getRate("USD", date); // Може да хвърли exception
```

### 3. Използвайте правилните типове данни

```java
// ✅ Правилно
BigDecimal amount = new BigDecimal("100.50");
BigDecimal rate = new BigDecimal("1.95583");
BigDecimal result = amount.multiply(rate);

// ❌ Грешно
double amount = 100.50;
double rate = 1.95583;
double result = amount * rate; // Проблеми с точността
```

### 4. Кеширайте често използвани курсове

```java
@Cacheable(value = "exchangeRates", key = "#currencyCode + '_' + #date")
public ExchangeRate getRate(String currencyCode, LocalDate date) {
    return exchangeRateRepository.findByCurrencyCodeAndDate(currencyCode, date)
                                .orElseThrow(() -> new IllegalStateException("Rate not found"));
}
```

Този API guide осигурява пълно ръководство за работа с новата многовалутна архитектура!