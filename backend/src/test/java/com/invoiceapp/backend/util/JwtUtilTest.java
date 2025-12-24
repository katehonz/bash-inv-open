package com.invoiceapp.backend.util;

import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class JwtUtilTest {

    @InjectMocks
    private JwtUtil jwtUtil;

    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(jwtUtil, "secret", "C1sWh2p3q4r5t6U7v8w9X0yZ1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9T0U");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 3600L);
        userDetails = new User("testuser", "password", new ArrayList<>());
    }

    @Test
    void testGenerateToken() {
        String token = jwtUtil.generateToken(userDetails);
        assertNotNull(token);
        assertEquals("testuser", jwtUtil.getUsernameFromToken(token));
    }

    @Test
    void testValidateToken() {
        String token = jwtUtil.generateToken(userDetails);
        assertTrue(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void testIsTokenExpired() {
        String token = jwtUtil.generateToken(userDetails);
        assertFalse(jwtUtil.isTokenExpired(token));
    }

    @Test
    void testGetUsernameFromToken() {
        String token = jwtUtil.generateToken(userDetails);
        assertEquals("testuser", jwtUtil.getUsernameFromToken(token));
    }
}
