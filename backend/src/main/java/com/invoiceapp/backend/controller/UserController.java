package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.Company;
import com.invoiceapp.backend.model.User;
import com.invoiceapp.backend.model.Role;
import com.invoiceapp.backend.model.dto.CreateUserInput;
import com.invoiceapp.backend.model.dto.UpdateUserInput;
import com.invoiceapp.backend.model.dto.ChangeUserPasswordInput;
import com.invoiceapp.backend.repository.CompanyRepository;
import com.invoiceapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Optional;

@Controller
public class UserController {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserController(UserRepository userRepository, CompanyRepository companyRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public User me(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or (hasRole('ADMIN') and @customPermissionEvaluator.isUserInCompany(authentication, #input.companyId))")
    public User createUser(@Argument CreateUserInput input) {
        User user = new User();
        user.setUsername(input.username());
        user.setEmail(input.email());
        user.setPassword(passwordEncoder.encode(input.password()));
        user.setRole(input.role());

        if (input.isActive() != null) {
            user.setIsActive(input.isActive());
        }

        if (input.role() == Role.SUPER_ADMIN) {
            user.setCompany(null);
        } else if (input.companyId() != null) {
            Company company = companyRepository.findById(input.companyId())
                    .orElseThrow(() -> new IllegalArgumentException("Company not found with ID: " + input.companyId()));

            if (company.getUsers().size() >= company.getUserLimit()) {
                throw new IllegalStateException("User limit for company '" + company.getName() + "' has been reached.");
            }
            user.setCompany(company);
        } else {
            user.setCompany(null);
        }

        return userRepository.save(user);
    }

    @QueryMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<User> allUsers() {
        return userRepository.findAll();
    }

    @QueryMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @customPermissionEvaluator.isUserInCompany(authentication, #companyId)")
    public List<User> usersByCompany(@Argument Long companyId) {
        return userRepository.findByCompanyId(companyId);
    }

    @QueryMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @customPermissionEvaluator.isSelf(authentication, #id)")
    public Optional<User> userById(@Argument Long id) {
        return userRepository.findById(id);
    }

    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public User updateUser(@Argument UpdateUserInput input) {
        User user = userRepository.findById(input.id())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (input.username() != null) {
            user.setUsername(input.username());
        }
        if (input.email() != null) {
            user.setEmail(input.email());
        }
        if (input.role() != null) {
            user.setRole(input.role());
        }
        if (input.isActive() != null) {
            user.setIsActive(input.isActive());
        }

        return userRepository.save(user);
    }

    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @customPermissionEvaluator.isSelf(authentication, #input.userId)")
    public Boolean changeUserPassword(@Argument ChangeUserPasswordInput input) {
        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPassword(passwordEncoder.encode(input.newPassword()));
        userRepository.save(user);
        
        return true;
    }

    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public User activateUser(@Argument Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setIsActive(true);
        return userRepository.save(user);
    }

    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public User deactivateUser(@Argument Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setIsActive(false);
        return userRepository.save(user);
    }

    @MutationMapping
    public Boolean initializeSuperAdmin() {
        List<User> superAdmins = userRepository.findByRole(Role.SUPER_ADMIN);
        
        if (superAdmins.isEmpty()) {
            User superAdmin = new User();
            superAdmin.setUsername("superadministrator");
            superAdmin.setEmail("admin@invoiceapp.com");
            superAdmin.setPassword(passwordEncoder.encode("admin123"));
            superAdmin.setRole(Role.SUPER_ADMIN);
            superAdmin.setIsActive(true);
            superAdmin.setCompany(null);
            
            userRepository.save(superAdmin);
            return true;
        }
        
        return false;
    }

    @MutationMapping
    public Boolean resetSuperAdminPassword() {
        List<User> superAdmins = userRepository.findByRole(Role.SUPER_ADMIN);
        
        if (!superAdmins.isEmpty()) {
            User superAdmin = superAdmins.get(0);
            superAdmin.setPassword(passwordEncoder.encode("admin123"));
            userRepository.save(superAdmin);
            return true;
        }
        
        return false;
    }
}
