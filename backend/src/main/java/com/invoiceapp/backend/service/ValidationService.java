package com.invoiceapp.backend.service;

import org.springframework.stereotype.Service;
import java.util.regex.Pattern;
import java.math.BigInteger;

/**
 * Сервис за валидации на български бизнес данни
 * Валидира ДДС номера, ЕИК, IBAN и други специфични за България формати
 */
@Service
public class ValidationService {

    // Регулярни израzi за валидация
    private static final Pattern BULGARIAN_VAT_PATTERN = Pattern.compile("^BG\\d{9,10}$");
    private static final Pattern BULGARIAN_EIK_PATTERN = Pattern.compile("^\\d{9}$|^\\d{13}$");
    private static final Pattern IBAN_PATTERN = Pattern.compile("^[A-Z]{2}\\d{2}[A-Z0-9]{4}\\d{7}([A-Z0-9]?){0,16}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?359\\d{8,9}$|^0\\d{8,9}$");

    /**
     * Валидира български ДДС номер
     * @param vatNumber ДДС номер (с или без "BG" префикс)
     * @return true ако е валиден
     */
    public boolean validateBulgarianVatNumber(String vatNumber) {
        if (vatNumber == null || vatNumber.trim().isEmpty()) {
            return false;
        }

        // Нормализиране на входа
        String normalizedVat = vatNumber.trim().toUpperCase();
        if (!normalizedVat.startsWith("BG")) {
            normalizedVat = "BG" + normalizedVat;
        }

        // Проверка на формата
        if (!BULGARIAN_VAT_PATTERN.matcher(normalizedVat).matches()) {
            return false;
        }

        // Извличане на цифрите
        String digits = normalizedVat.substring(2);
        
        // Проверка на контролната сума
        if (digits.length() == 9) {
            return validateEikChecksum(digits);
        } else if (digits.length() == 10) {
            return validatePersonalNumberChecksum(digits);
        }

        return false;
    }

    /**
     * Валидира български ЕИК
     * @param eik ЕИК (9 или 13 цифри)
     * @return true ако е валиден
     */
    public boolean validateBulgarianEik(String eik) {
        if (eik == null || eik.trim().isEmpty()) {
            return false;
        }

        String normalizedEik = eik.trim();
        
        // Проверка на формата
        if (!BULGARIAN_EIK_PATTERN.matcher(normalizedEik).matches()) {
            return false;
        }

        // Проверка на контролната сума
        if (normalizedEik.length() == 9) {
            return validateEikChecksum(normalizedEik);
        } else if (normalizedEik.length() == 13) {
            // За 13-цифрен ЕИК се проверяват и двете контролни суми
            return validateEikChecksum(normalizedEik.substring(0, 9)) && 
                   validateExtendedEikChecksum(normalizedEik);
        }

        return false;
    }

    /**
     * Валидира IBAN
     * @param iban IBAN номер
     * @return true ако е валиден
     */
    public boolean validateIban(String iban) {
        if (iban == null || iban.trim().isEmpty()) {
            return false;
        }

        String normalizedIban = iban.trim().toUpperCase().replaceAll("\\s", "");
        
        // Проверка на формата
        if (!IBAN_PATTERN.matcher(normalizedIban).matches()) {
            return false;
        }

        // Проверка на контролната сума (mod 97)
        return validateIbanChecksum(normalizedIban);
    }

    /**
     * Валидира имейл адрес
     * @param email имейл адрес
     * @return true ако е валиден
     */
    public boolean validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    /**
     * Валидира български телефонен номер
     * @param phone телефонен номер
     * @return true ако е валиден
     */
    public boolean validateBulgarianPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }

        String normalizedPhone = phone.trim().replaceAll("[\\s\\-\\(\\)]", "");
        return PHONE_PATTERN.matcher(normalizedPhone).matches();
    }

    /**
     * Валидира последователност на фактурни номера
     * @param previousNumber предишен номер
     * @param currentNumber текущ номер
     * @return true ако е валидна последователност
     */
    public boolean validateInvoiceSequence(String previousNumber, String currentNumber) {
        if (previousNumber == null || currentNumber == null) {
            return true; // Първа фактура
        }

        try {
            int prevNum = Integer.parseInt(previousNumber);
            int currNum = Integer.parseInt(currentNumber);
            return currNum == prevNum + 1;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    // --- Помощни методи ---

    /**
     * Валидира контролна сума за ЕИК (9 цифри)
     */
    private boolean validateEikChecksum(String eik) {
        if (eik.length() != 9) {
            return false;
        }

        int[] weights = {1, 2, 3, 4, 5, 6, 7, 8};
        int sum = 0;

        for (int i = 0; i < 8; i++) {
            sum += Character.getNumericValue(eik.charAt(i)) * weights[i];
        }

        int remainder = sum % 11;
        int checkDigit = Character.getNumericValue(eik.charAt(8));

        if (remainder < 10) {
            return checkDigit == remainder;
        } else {
            // Алтернативно изчисление с други тежести
            int[] altWeights = {3, 4, 5, 6, 7, 8, 9, 10};
            sum = 0;
            for (int i = 0; i < 8; i++) {
                sum += Character.getNumericValue(eik.charAt(i)) * altWeights[i];
            }
            remainder = sum % 11;
            return checkDigit == (remainder < 10 ? remainder : 0);
        }
    }

    /**
     * Валидира контролна сума за разширен ЕИК (13 цифри)
     */
    private boolean validateExtendedEikChecksum(String eik) {
        if (eik.length() != 13) {
            return false;
        }

        int[] weights = {2, 7, 3, 5};
        int sum = 0;

        for (int i = 8; i < 12; i++) {
            sum += Character.getNumericValue(eik.charAt(i)) * weights[i - 8];
        }

        int remainder = sum % 11;
        int checkDigit = Character.getNumericValue(eik.charAt(12));

        return checkDigit == (remainder < 10 ? remainder : 0);
    }

    /**
     * Валидира контролна сума за личен номер (10 цифри)
     */
    private boolean validatePersonalNumberChecksum(String personalNumber) {
        if (personalNumber.length() != 10) {
            return false;
        }

        int[] weights = {2, 4, 8, 5, 10, 9, 7, 3, 6};
        int sum = 0;

        for (int i = 0; i < 9; i++) {
            sum += Character.getNumericValue(personalNumber.charAt(i)) * weights[i];
        }

        int remainder = sum % 11;
        int checkDigit = Character.getNumericValue(personalNumber.charAt(9));

        return checkDigit == (remainder < 10 ? remainder : 0);
    }

    /**
     * Валидира IBAN контролна сума
     */
    private boolean validateIbanChecksum(String iban) {
        // Премества първите 4 символа накрая
        String rearranged = iban.substring(4) + iban.substring(0, 4);
        
        // Заменя буквите с цифри (A=10, B=11, ..., Z=35)
        StringBuilder numericString = new StringBuilder();
        for (char c : rearranged.toCharArray()) {
            if (Character.isDigit(c)) {
                numericString.append(c);
            } else {
                numericString.append(c - 'A' + 10);
            }
        }

        // Проверява mod 97
        try {
            BigInteger number = new BigInteger(numericString.toString());
            return number.mod(BigInteger.valueOf(97)).equals(BigInteger.ONE);
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Нормализира ДДС номер (добавя BG префикс ако липсва)
     */
    public String normalizeVatNumber(String vatNumber) {
        if (vatNumber == null || vatNumber.trim().isEmpty()) {
            return null;
        }

        String normalized = vatNumber.trim().toUpperCase();
        if (!normalized.startsWith("BG")) {
            normalized = "BG" + normalized;
        }

        return normalized;
    }

    /**
     * Нормализира телефонен номер (добавя +359 префикс ако липсва)
     */
    public String normalizePhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return null;
        }

        String normalized = phone.trim().replaceAll("[\\s\\-\\(\\)]", "");
        
        if (normalized.startsWith("0")) {
            normalized = "+359" + normalized.substring(1);
        } else if (!normalized.startsWith("+359")) {
            normalized = "+359" + normalized;
        }

        return normalized;
    }
}