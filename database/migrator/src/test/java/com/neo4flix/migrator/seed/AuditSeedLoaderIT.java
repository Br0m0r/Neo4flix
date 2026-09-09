package com.neo4flix.migrator.seed;

import ac.simons.neo4j.migrations.core.Migrations;
import ac.simons.neo4j.migrations.core.MigrationsConfig;
import org.junit.jupiter.api.Test;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AuditSeedLoaderIT {

    private static final String USERNAME = "neo4j";
    private static final String PASSWORD = "test-password";
    private static final String DATABASE = "neo4j";

    @Test
    void loadsTheFixedAuditGraphIdempotently() {
        try (Neo4jContainer<?> container = new Neo4jContainer<>(
                DockerImageName.parse("neo4j:2026.07.1-community"))
                .withAdminPassword(PASSWORD)) {
            container.start();
            try (Driver driver = GraphDatabase.driver(
                    container.getBoltUrl(), AuthTokens.basic(USERNAME, PASSWORD))) {
                applyMigrations(driver);

                new AuditSeedLoader().load(driver, DATABASE);

                assertThat(count(driver, "MATCH (:User) RETURN count(*) AS count"))
                        .isEqualTo(3L);
                assertThat(score(driver, "audit-alice", "audit-matrix"))
                        .isEqualTo(5L);

                new AuditSeedLoader().load(driver, DATABASE);

                assertThat(count(driver, "MATCH ()-[rated:RATED]->() RETURN count(rated) AS count"))
                        .isEqualTo(10L);
            }
        }
    }

    private static void applyMigrations(Driver driver) {
        new Migrations(
                MigrationsConfig.builder()
                        .withDatabase(DATABASE)
                        .withLocationsToScan("classpath:database/migrations")
                        .withTransactionTimeout(Duration.ofSeconds(30))
                        .build(),
                driver)
                .apply();
    }

    private static long count(Driver driver, String query) {
        return driver.executableQuery(query)
                .execute()
                .records()
                .getFirst()
                .get("count")
                .asLong();
    }

    private static long score(Driver driver, String userSlug, String movieSlug) {
        return driver.executableQuery("""
                        MATCH (:User {slug: $userSlug})-[rated:RATED]->(:Movie {slug: $movieSlug})
                        RETURN rated.score AS score
                        """)
                .withParameters(Map.of("userSlug", userSlug, "movieSlug", movieSlug))
                .execute()
                .records()
                .getFirst()
                .get("score")
                .asLong();
    }
}
