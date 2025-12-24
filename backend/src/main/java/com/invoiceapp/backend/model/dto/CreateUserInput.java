package com.invoiceapp.backend.model.dto;

import com.invoiceapp.backend.model.Role;

public record CreateUserInput(
    String username,
    String email,
    String password,
    Role role,
    Long companyId,
    Boolean isActive
) {}
