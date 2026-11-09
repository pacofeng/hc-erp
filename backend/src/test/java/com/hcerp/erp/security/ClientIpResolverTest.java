package com.hcerp.erp.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientIpResolverTest {
    private final ClientIpResolver resolver = new ClientIpResolver("127.0.0.1,::1");

    @Test
    void acceptsForwardedAddressFromTrustedReverseProxy() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.24");

        assertEquals("203.0.113.24", resolver.resolve(request));
    }

    @Test
    void ignoresForwardedAddressFromUntrustedClient() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.8");
        request.addHeader("X-Forwarded-For", "203.0.113.24");

        assertEquals("198.51.100.8", resolver.resolve(request));
    }

    @Test
    void ignoresMalformedForwardedAddress() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "not-an-ip");

        assertEquals("127.0.0.1", resolver.resolve(request));
    }
}
