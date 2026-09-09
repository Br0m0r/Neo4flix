package com.neo4flix.migrator;

import ac.simons.neo4j.migrations.core.Migrations;
import ac.simons.neo4j.migrations.core.MigrationsConfig;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.neo4j.driver.QueryConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

@SpringBootApplication
public class MigratorApplication implements CommandLineRunner {

    private static final Logger LOG = LoggerFactory.getLogger(MigratorApplication.class);
    private static final Duration QUERY_TIMEOUT = Duration.ofSeconds(10);
    private static final String DEFAULT_DATABASE = "neo4j";
    private static final String DEFAULT_LOCATION = "classpath:database/migrations";
    private static final Set<String> EXPECTED_VERSIONS = Set.of("001", "002", "003", "004", "005");
    private static final Set<String> EXPECTED_CONSTRAINTS = Set.of(
            "user_id_unique",
            "user_normalized_email_unique",
            "movie_id_unique",
            "genre_id_unique",
            "genre_normalized_name_unique",
            "rated_key_unique",
            "watchlisted_key_unique",
            "auth_session_id_unique",
            "auth_challenge_id_unique",
            "recommendation_share_id_unique",
            "recommendation_share_token_hash_unique");
    private static final Set<String> EXPECTED_INDEXES = Set.of(
            "movie_title_index",
            "movie_release_year_index",
            "genre_name_index");

    public static void main(String[] args) {
        SpringApplication.run(MigratorApplication.class, args);
    }

    @Override
    public void run(String... args) {
        MigrationCommand command = MigrationCommand.parse(args);
        if (command.mode().startsWith("seed-")) {
            throw new IllegalStateException("seed commands are introduced by the explicit seed-loader task");
        }

        String uri = requiredEnvironment("NEO4J_URI");
        String username = requiredEnvironment("NEO4J_USERNAME");
        String password = requiredEnvironment("NEO4J_PASSWORD");
        String database = environmentOrDefault("NEO4J_DATABASE", DEFAULT_DATABASE);
        String location = environmentOrDefault("NEO4J_MIGRATIONS_LOCATION", DEFAULT_LOCATION);

        LOG.info("Running database migrator mode={} database={} location={}", command.mode(), database, location);

        try (Driver driver = GraphDatabase.driver(uri, AuthTokens.basic(username, password))) {
            verifyGds(driver, database);

            Migrations migrations = new Migrations(
                    MigrationsConfig.builder()
                            .withDatabase(database)
                            .withLocationsToScan(location)
                            .withTransactionTimeout(Duration.ofSeconds(30))
                            .build(),
                    driver);

            if (command.mode().equals("migrate")) {
                migrations.apply();
            }

            verifyVersions(migrations);
            verifySchema(driver, database);
            LOG.info("Database migrator completed mode={} database={} versions={}",
                    command.mode(), database, EXPECTED_VERSIONS.size());
        }
    }

    private static void verifyGds(Driver driver, String database) {
        var result = driver.executableQuery("RETURN gds.version() AS version")
                .withConfig(queryConfig(database))
                .execute();
        if (result.records().size() != 1 || result.records().getFirst().get("version").isNull()) {
            throw new IllegalStateException("GDS verification returned no version");
        }
        LOG.info("GDS verification succeeded for database={} version={}",
                database, result.records().getFirst().get("version").asString());
    }

    private static void verifyVersions(Migrations migrations) {
        var chain = migrations.info();
        List<String> missing = EXPECTED_VERSIONS.stream()
                .filter(version -> !chain.isApplied(version))
                .sorted()
                .toList();
        if (!missing.isEmpty()) {
            throw new IllegalStateException("Missing migration versions: " + missing);
        }
    }

    private static void verifySchema(Driver driver, String database) {
        Set<String> constraints = schemaNames(
                driver,
                database,
                "SHOW CONSTRAINTS YIELD name WHERE name IN $names RETURN name",
                EXPECTED_CONSTRAINTS);
        Set<String> indexes = schemaNames(
                driver,
                database,
                "SHOW INDEXES YIELD name WHERE name IN $names RETURN name",
                EXPECTED_INDEXES);
        requireAllSchemaNames("constraints", EXPECTED_CONSTRAINTS, constraints);
        requireAllSchemaNames("indexes", EXPECTED_INDEXES, indexes);
    }

    private static Set<String> schemaNames(
            Driver driver, String database, String query, Set<String> expectedNames) {
        return driver.executableQuery(query)
                .withParameters(Map.of("names", expectedNames))
                .withConfig(queryConfig(database))
                .execute()
                .records()
                .stream()
                .map(record -> record.get("name").asString())
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    private static void requireAllSchemaNames(String type, Set<String> expected, Set<String> actual) {
        List<String> missing = expected.stream()
                .filter(name -> !actual.contains(name))
                .sorted()
                .toList();
        if (!missing.isEmpty()) {
            throw new IllegalStateException("Missing schema " + type + ": " + missing);
        }
    }

    private static QueryConfig queryConfig(String database) {
        return QueryConfig.builder()
                .withDatabase(database)
                .withTimeout(QUERY_TIMEOUT)
                .build();
    }

    private static String requiredEnvironment(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " must be set");
        }
        return value;
    }

    private static String environmentOrDefault(String name, String defaultValue) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? defaultValue : value;
    }
}
