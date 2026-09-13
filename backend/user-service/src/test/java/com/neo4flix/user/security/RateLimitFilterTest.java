package com.neo4flix.user.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RateLimitFilterTest {
    @Test void capsRequestsAndIdentitiesWithoutTrustingForwardedHeaders() throws Exception {
        var filter = new RateLimitFilter(Clock.systemUTC(), 2, 60, 1, "https://app.example");
        assertThat(call(filter, "/api/v1/auth/login", null, null, "a").getStatus()).isEqualTo(204);
        assertThat(call(filter, "/api/v1/auth/login", null, null, "a").getStatus()).isEqualTo(204);
        var limited = call(filter, "/api/v1/auth/login", null, null, "a");
        assertThat(limited.getStatus()).isEqualTo(429);
        assertThat(Integer.parseInt(limited.getHeader("Retry-After"))).isBetween(1, 60);
        assertThat(call(filter, "/api/v1/auth/login", null, null, "b").getStatus()).isEqualTo(429);
        assertThat(call(filter, "/api/v1/users/me", null, null, "a").getStatus()).isEqualTo(204);
    }

    @Test void cookieEndpointsRequireExactAllowlistedOriginOrReferer() throws Exception {
        var filter = new RateLimitFilter(Clock.systemUTC(), 100, 60, 100, "https://app.example");
        for (String endpoint : new String[]{"refresh", "logout"}) {
            String path = "/api/v1/auth/" + endpoint;
            assertThat(call(filter, path, null, null, "a").getStatus()).isEqualTo(403);
            assertThat(call(filter, path, "https://evil.example", "https://app.example/profile", "a").getStatus()).isEqualTo(403);
            assertThat(call(filter, path, "null", null, "a").getStatus()).isEqualTo(403);
            assertThat(call(filter, path, "https://app.example.evil", null, "a").getStatus()).isEqualTo(403);
            assertThat(call(filter, path, "https://app.example", null, "a").getStatus()).isEqualTo(204);
            assertThat(call(filter, path, null, "https://app.example/profile", "a").getStatus()).isEqualTo(204);
        }
    }

    @Test void permitsNewWindowAfterExpiry() throws Exception {
        var clock = new Clock() {
            Instant now = Instant.parse("2026-09-13T12:00:00Z");
            public ZoneId getZone() { return ZoneOffset.UTC; }
            public Clock withZone(ZoneId zone) { return this; }
            public Instant instant() { return now; }
        };
        var filter = new RateLimitFilter(clock, 1, 60, 1, "https://app.example");
        assertThat(call(filter, "/api/v1/auth/register", null, null, "a").getStatus()).isEqualTo(204);
        assertThat(call(filter, "/api/v1/auth/register", null, null, "a").getStatus()).isEqualTo(429);
        clock.now = clock.now.plusSeconds(60);
        assertThat(call(filter, "/api/v1/auth/register", null, null, "b").getStatus()).isEqualTo(204);
    }

    @Test void percentEncodedLoginAndTwoFactorPathsShareCanonicalRateLimits() throws Exception {
        MockMvc mvc = mvc(new RateLimitFilter(Clock.systemUTC(), 1, 60, 100, "https://app.example"));

        mvc.perform(post("/api/v1/auth/login")).andExpect(status().isNoContent());
        mvc.perform(post(URI.create("/api/v1/auth/%6cogin")))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));

        mvc.perform(post("/api/v1/auth/2fa/setup")).andExpect(status().isNoContent());
        mvc.perform(post(URI.create("/api/v1/auth/2fa/%63onfirm")))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test void percentEncodedRefreshAndLogoutPathsStillRequireAllowedOrigin() throws Exception {
        MockMvc mvc = mvc(new RateLimitFilter(Clock.systemUTC(), 100, 60, 100, "https://app.example"));

        mvc.perform(post(URI.create("/api/v1/auth/%72efresh"))).andExpect(status().isForbidden());
        mvc.perform(post(URI.create("/api/v1/auth/%6cogout"))).andExpect(status().isForbidden());
    }

    @Test void rejectsAmbiguousEncodedTraversalAndSeparatorPaths() throws Exception {
        MockMvc mvc = mvc(new RateLimitFilter(Clock.systemUTC(), 100, 60, 100, "https://app.example"));

        for (String path : new String[]{
                "/api/v1/auth/%2e%2e/login",
                "/api/v1/auth/%2flogin",
                "/api/v1/auth/%5clogin",
                "/api/v1/auth//login",
                "/api/v1/auth/login;ignored=true"}) {
            mvc.perform(post(URI.create(path))).andExpect(status().isBadRequest());
        }
    }

    private static MockMvc mvc(RateLimitFilter filter) {
        return MockMvcBuilders.standaloneSetup(new ProbeController()).addFilters(filter).build();
    }

    @RestController
    private static final class ProbeController {
        @PostMapping({"/api/v1/auth/login", "/api/v1/auth/refresh", "/api/v1/auth/logout",
                "/api/v1/auth/2fa/setup", "/api/v1/auth/2fa/confirm"})
        ResponseEntity<Void> probe() {
            return ResponseEntity.noContent().build();
        }
    }

    private MockHttpServletResponse call(RateLimitFilter filter, String path, String origin, String referer, String address) throws Exception {
        var request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr(address);
        request.addHeader("X-Forwarded-For", java.util.UUID.randomUUID().toString());
        if (origin != null) request.addHeader("Origin", origin);
        if (referer != null) request.addHeader("Referer", referer);
        var response = new MockHttpServletResponse();
        filter.doFilter(request, response, (req, res) -> ((jakarta.servlet.http.HttpServletResponse) res).setStatus(204));
        return response;
    }
}
