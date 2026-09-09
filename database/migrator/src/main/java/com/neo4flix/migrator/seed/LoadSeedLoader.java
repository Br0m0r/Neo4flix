package com.neo4flix.migrator.seed;

import org.neo4j.driver.Driver;
import org.neo4j.driver.QueryConfig;

import java.time.Duration;
import java.util.Map;

/** Loads a small deterministic, credential-free scaffold for local load tooling. */
public final class LoadSeedLoader {

    private static final String MERGE_MOVIE = """
            UNWIND $movies AS fixture
            MERGE (movie:Movie {id: fixture.id})
            SET movie.title = fixture.title,
                movie.normalizedTitle = fixture.normalizedTitle,
                movie.releaseYear = fixture.releaseYear
            """;

    public void load(Driver driver, String database) {
        driver.executableQuery(MERGE_MOVIE)
                .withParameters(Map.of("movies", java.util.List.of(
                        Map.of("id", "load-movie-001", "title", "Load Fixture 001", "normalizedTitle", "load fixture 001", "releaseYear", 2020),
                        Map.of("id", "load-movie-002", "title", "Load Fixture 002", "normalizedTitle", "load fixture 002", "releaseYear", 2021),
                        Map.of("id", "load-movie-003", "title", "Load Fixture 003", "normalizedTitle", "load fixture 003", "releaseYear", 2022))))
                .withConfig(QueryConfig.builder().withDatabase(database).withTimeout(Duration.ofSeconds(10)).build())
                .execute();
    }
}
