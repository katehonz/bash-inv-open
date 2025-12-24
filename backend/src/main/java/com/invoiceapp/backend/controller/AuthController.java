package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.User;
import com.invoiceapp.backend.model.dto.LoginInput;
import com.invoiceapp.backend.model.dto.AuthResponse;
import com.invoiceapp.backend.repository.UserRepository;
import com.invoiceapp.backend.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;

@Controller
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @MutationMapping
    public AuthResponse login(@Argument LoginInput input) {
        // Find user by username or email
        User user = userRepository.findByUsername(input.getUsername())
                .orElse(userRepository.findByEmail(input.getUsername()).orElse(null));

        if (user == null) {
            throw new RuntimeException("Потребителят не е намерен");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Потребителят е деактивиран");
        }

        // Check password
        if (!passwordEncoder.matches(input.getPassword(), user.getPassword())) {
            throw new RuntimeException("Невалидна парола");
        }

        // Generate JWT token
        String token = jwtService.generateToken(
                user.getUsername(),
                user.getId(),
                user.getRole().toString(),
                user.getCompany() != null ? user.getCompany().getId() : null
        );

        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().toString(),
                user.getCompany() != null ? user.getCompany().getId() : null,
                user.getCompany() != null ? user.getCompany().getName() : null
        );
    }

    @MutationMapping
    public String logout() {
        // For JWT-based auth, logout is typically handled on the frontend
        // by removing the token from storage
        return "Излязохте успешно";
    }
}