package com.neo4flix.user.auth;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.GraphDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.utility.DockerImageName;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthProductionContextIT {

    private static final Neo4jContainer<?> NEO4J = new Neo4jContainer<>(
            DockerImageName.parse("neo4j:2026.07.1-community"))
            .withAdminPassword("test-password");
    private static final KeyPair KEY_PAIR = keyPair();
    private static final AtomicInteger EMAIL_SEQUENCE = new AtomicInteger();

    static {
        NEO4J.start();
        try (var driver = GraphDatabase.driver(
                NEO4J.getBoltUrl(), AuthTokens.basic("neo4j", "test-password"))) {
            driver.executableQuery("CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.normalizedEmail IS UNIQUE")
                    .execute();
            driver.executableQuery("CREATE CONSTRAINT session_id IF NOT EXISTS FOR (s:AuthSession) REQUIRE s.id IS UNIQUE")
                    .execute();
        }
    }

    @Autowired
    private TestRestTemplate restTemplate;
    @Autowired
    private WebApplicationContext applicationContext;
    private MockMvc mockMvc;

    @BeforeEach
    void configureMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext)
                .apply(springSecurity())
                .build();
    }

    @DynamicPropertySource
    static void productionProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.neo4j.uri", NEO4J::getBoltUrl);
        registry.add("spring.neo4j.authentication.username", () -> "neo4j");
        registry.add("spring.neo4j.authentication.password", () -> "test-password");
        registry.add("neo4flix.security.jwt.private-key", () -> pem("PRIVATE KEY", KEY_PAIR.getPrivate().getEncoded()));
        registry.add("neo4flix.security.jwt.public-key", () -> pem("PUBLIC KEY", KEY_PAIR.getPublic().getEncoded()));
        registry.add("neo4flix.security.password.bcrypt-strength", () -> "10");
    }

    @Test
    @Order(1)
    void configuredProductionContextMapsAndServesCoreAuthAndProfileRoutes() {
        var registration = restTemplate.postForEntity(
                "/api/v1/auth/register",
                Map.of("email", "wired@example.com", "displayName", "Wired", "password", "StrongPass1!"),
                Map.class);
        assertThat(registration.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        var login = restTemplate.postForEntity(
                "/api/v1/auth/login",
                Map.of("email", "wired@example.com", "password", "StrongPass1!"),
                Map.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(login.getBody()).isNotNull();
        String accessToken = login.getBody().get("accessToken").toString();
        String loginCookie = cookiePair(login.getHeaders().getFirst(HttpHeaders.SET_COOKIE));
        assertThat(accessToken).isNotBlank();
        assertThat(loginCookie).startsWith("neo4flix_refresh=");

        HttpHeaders bearer = new HttpHeaders();
        bearer.setBearerAuth(accessToken);
        var authMe = restTemplate.exchange(
                "/api/v1/auth/me", HttpMethod.GET, new HttpEntity<>(bearer), Map.class);
        var usersMe = restTemplate.exchange(
                "/api/v1/users/me", HttpMethod.GET, new HttpEntity<>(bearer), Map.class);
        assertThat(authMe.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(usersMe.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(authMe.getBody()).isEqualTo(usersMe.getBody());

        HttpHeaders refreshHeaders = new HttpHeaders();
        refreshHeaders.add(HttpHeaders.COOKIE, loginCookie);
        var refresh = restTemplate.exchange(
                "/api/v1/auth/refresh", HttpMethod.POST, new HttpEntity<>(refreshHeaders), Map.class);
        assertThat(refresh.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(refresh.getBody()).isNotNull();
        assertThat(refresh.getBody().get("accessToken").toString()).isNotBlank();
        assertThat(cookiePair(refresh.getHeaders().getFirst(HttpHeaders.SET_COOKIE)))
                .startsWith("neo4flix_refresh=")
                .isNotEqualTo(loginCookie);
    }

    @ParameterizedTest(name = "password policy violation {index} returns field validation problem")
    @MethodSource("invalidPasswords")
    @Order(2)
    void everyPasswordPolicyViolationReturnsFieldLevelBadRequest(String password) throws Exception {
        String email = "weak-" + EMAIL_SEQUENCE.incrementAndGet() + "@example.com";

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","displayName":"Weak","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.password").isNotEmpty());
    }

    static Stream<String> invalidPasswords() {
        return Stream.of(
                "Short1!",
                "lowercase1!",
                "UPPERCASE1!",
                "NoDigitsHere!",
                "NoSpecial123",
                "Strong Pass1!",
                "A1!" + "a".repeat(126));
    }

    @AfterAll
    static void stopNeo4j() {
        NEO4J.stop();
    }

    private static String cookiePair(String setCookie) {
        assertThat(setCookie).isNotBlank();
        return setCookie.substring(0, setCookie.indexOf(';'));
    }

    private static KeyPair keyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static String pem(String type, byte[] encoded) {
        return "-----BEGIN " + type + "-----\n"
                + Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(encoded)
                + "\n-----END " + type + "-----";
    }
}
