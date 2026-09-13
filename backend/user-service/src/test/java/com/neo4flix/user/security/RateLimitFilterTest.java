package com.neo4flix.user.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import java.time.*;
import static org.assertj.core.api.Assertions.assertThat;

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
