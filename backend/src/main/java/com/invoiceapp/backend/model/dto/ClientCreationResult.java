package com.invoiceapp.backend.model.dto;

import com.invoiceapp.backend.model.Client;
import com.invoiceapp.backend.service.ViesService.ViesCompanyData;

/**
 * GraphQL response DTO за резултат от създаване на клиент
 */
public record ClientCreationResult(
    boolean success,
    Client client,
    boolean fromVies,
    boolean requiresManualEntry,
    String errorMessage,
    String errorType,
    ViesCompanyData viesData
) {
    public static ClientCreationResult success(Client client, boolean fromVies) {
        return new ClientCreationResult(true, client, fromVies, false, null, null, null);
    }

    public static ClientCreationResult manualEntry(Client client) {
        return new ClientCreationResult(true, client, false, true, null, null, null);
    }

    public static ClientCreationResult validationError(String message) {
        return new ClientCreationResult(false, null, false, false, message, "VALIDATION_ERROR", null);
    }

    public static ClientCreationResult viesError(String message) {
        return new ClientCreationResult(false, null, false, false, message, "VIES_ERROR", null);
    }

    public static ClientCreationResult viesInvalid(String message) {
        return new ClientCreationResult(false, null, false, false, message, "VIES_INVALID", null);
    }

    public static ClientCreationResult alreadyExists(Client client) {
        return new ClientCreationResult(false, client, false, false, "Client already exists", "ALREADY_EXISTS", null);
    }

    public static ClientCreationResult viesPreview(ViesCompanyData viesData) {
        return new ClientCreationResult(true, null, true, false, null, null, viesData);
    }
}