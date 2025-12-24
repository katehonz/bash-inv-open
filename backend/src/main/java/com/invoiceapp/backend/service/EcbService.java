package com.invoiceapp.backend.service;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.invoiceapp.backend.service.ecb.EcbDtos;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.invoiceapp.backend.model.ExchangeRate;
import com.invoiceapp.backend.repository.CurrencyRepository;
import com.invoiceapp.backend.repository.ExchangeRateRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class EcbService {

    private static final Logger logger = LoggerFactory.getLogger(EcbService.class);
    private static final String ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

    private final WebClient webClient;
    private final ExchangeRateRepository exchangeRateRepository;
    private final CurrencyRepository currencyRepository;

    public EcbService(WebClient.Builder webClientBuilder, ExchangeRateRepository exchangeRateRepository, CurrencyRepository currencyRepository) {
        this.webClient = webClientBuilder.baseUrl(ECB_URL).build();
        this.exchangeRateRepository = exchangeRateRepository;
        this.currencyRepository = currencyRepository;
    }

    @Scheduled(cron = "0 0 16 * * ?") // Run daily at 4 PM CET approx
    @Transactional
    public void fetchAndSaveRates() {
        logger.info("Fetching exchange rates from ECB...");
        try {
            String xmlResponse = webClient.get()
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(); // Block for simplicity in this example

            XmlMapper xmlMapper = new XmlMapper();
            EcbDtos.Envelope envelope = xmlMapper.readValue(xmlResponse, EcbDtos.Envelope.class);

            LocalDate date = LocalDate.parse(envelope.Cube.Cube.time, DateTimeFormatter.ISO_LOCAL_DATE);
            logger.info("Processing rates for date: {}", date);

            // Add the base currency rate (EUR to EUR)
            saveRateIfNotExists("EUR", "1.0", date);

            for (EcbDtos.Cube_Rate rateInfo : envelope.Cube.Cube.rates) {
                saveRateIfNotExists(rateInfo.currency, rateInfo.rate, date);
            }

        } catch (Exception e) {
            logger.error("Failed to fetch or parse ECB exchange rates", e);
        }
    }

    private void saveRateIfNotExists(String currencyCode, String rateValue, LocalDate date) {
        exchangeRateRepository.findByCurrencyCodeAndRateDate(currencyCode, date).ifPresentOrElse(
            existingRate -> logger.debug("Exchange rate for {} on {} already exists.", currencyCode, date),
            () -> {
                currencyRepository.findByCode(currencyCode).ifPresentOrElse(
                    currency -> {
                        ExchangeRate newRate = new ExchangeRate();
                        newRate.setCurrency(currency);
                        newRate.setRateDate(date);
                        newRate.setRate(new BigDecimal(rateValue));
                        newRate.setBaseCurrency("EUR"); // ECB rates are based on EUR
                        exchangeRateRepository.save(newRate);
                        logger.info("Saved new exchange rate for {} on {}: {}", currencyCode, date, rateValue);
                    },
                    () -> logger.warn("Currency with code '{}' not found in the database. Skipping rate save.", currencyCode)
                );
            }
        );
    }
}
