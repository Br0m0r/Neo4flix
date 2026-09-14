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
}
