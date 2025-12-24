package com.invoiceapp.backend.model.dto;

public record ChangeUserPasswordInput(
    Long userId,
    String newPassword
) {}