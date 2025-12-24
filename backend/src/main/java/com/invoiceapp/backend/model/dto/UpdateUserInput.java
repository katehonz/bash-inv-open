package com.invoiceapp.backend.model.dto;

import com.invoiceapp.backend.model.Role;

public record UpdateUserInput(
    Long id,
    String username,
    String email,
    Role role,
    Boolean isActive
) {}