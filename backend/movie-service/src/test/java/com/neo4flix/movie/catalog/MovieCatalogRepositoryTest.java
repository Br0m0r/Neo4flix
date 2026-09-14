package com.neo4flix.movie.catalog;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class MovieCatalogRepositoryTest {

    @Test
    void queryNormalizesTextAndBoundsPageSize() {
        MovieQuery query = MovieQuery.from(
                "  Alien  ", null, null, null, null, "createdAt", "desc", 3, 500);

        assertThat(query.title()).isEqualTo("Alien");
        assertThat(query.page()).isEqualTo(3);
        assertThat(query.size()).isEqualTo(100);
        assertThat(query.sortCypher()).isEqualTo("m.createdAt");
        assertThat(query.parameters()).containsEntry("title", "Alien");
    }

    @Test
    void queryAlwaysProvidesNullableCypherParametersAndSafeSortDefaults() {
        MovieQuery query = MovieQuery.from(" ", " ", null, null, null, "drop table", "sideways", -4, 0);

        assertThat(query.title()).isNull();
        assertThat(query.genre()).isNull();
        assertThat(query.page()).isZero();
        assertThat(query.size()).isEqualTo(1);
        assertThat(query.direction()).isEqualTo("desc");
        assertThat(query.sortCypher()).isEqualTo("m.createdAt");
        assertThat(query.parameters()).containsKeys("title", "genre", "minYear", "maxYear", "skip", "limit");
        assertThat(query.parameters().get("title")).isNull();
    }
}
