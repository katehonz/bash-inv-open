package com.invoiceapp.backend.service;

import com.invoiceapp.backend.model.Client;
import com.invoiceapp.backend.model.Document;
import com.invoiceapp.backend.model.Role;
import com.invoiceapp.backend.model.User;
import com.invoiceapp.backend.repository.ClientRepository;
import com.invoiceapp.backend.repository.DocumentRepository;
import com.invoiceapp.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("customPermissionEvaluator")
public class CustomPermissionEvaluator {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final ClientRepository clientRepository;

    public CustomPermissionEvaluator(UserRepository userRepository, DocumentRepository documentRepository, ClientRepository clientRepository) {
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.clientRepository = clientRepository;
    }

    /**
     * Проверява дали потребителят има достъп до документ по ID
     * Връща false ако документът не съществува или потребителят няма достъп
     */
    public boolean canAccessDocument(Authentication authentication, Long documentId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        if (documentId == null) {
            return false;
        }
        Optional<Document> docOpt = documentRepository.findById(documentId);
        if (docOpt.isEmpty()) {
            return false;
        }
        Document doc = docOpt.get();
        if (doc.getCompany() == null) {
            return false;
        }
        return isUserInCompany(authentication, doc.getCompany().getId());
    }

    /**
     * Проверява дали потребителят има достъп до клиент по ID
     * Връща false ако клиентът не съществува или потребителят няма достъп
     */
    public boolean canAccessClient(Authentication authentication, Long clientId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        if (clientId == null) {
            return false;
        }
        Optional<Client> clientOpt = clientRepository.findById(clientId);
        if (clientOpt.isEmpty()) {
            return false;
        }
        Client client = clientOpt.get();
        if (client.getCompany() == null) {
            return false;
        }
        return isUserInCompany(authentication, client.getCompany().getId());
    }

    public boolean isUserInCompany(Authentication authentication, Long companyId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return false;
        }
        // SUPER_ADMIN има достъп до всички компании
        if (user.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        if (user.getCompany() == null) {
            return false;
        }
        return user.getCompany().getId().equals(companyId);
    }

    public boolean isSelf(Authentication authentication, Long userId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return false;
        }
        return user.getId().equals(userId);
    }
}
