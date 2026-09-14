package com.neo4flix.movie.catalog;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class CatalogModels {
    private CatalogModels() { }

    public record GenreSummary(String id, String name) { }

    public record MovieSummary(
            String id,
            String title,
            String overview,
            int releaseYear,
            LocalDate releaseDate,
            String posterUrl,
            List<GenreSummary> genres,
            double averageRating,
            long ratingCount) { }

    public record MovieDetail(
            String id,
            String title,
            String overview,
            int releaseYear,
            LocalDate releaseDate,
            Integer runtimeMinutes,
            String posterUrl,
            String externalSource,
            String externalId,
            Instant createdAt,
            Instant updatedAt,
            List<GenreSummary> genres,
            double averageRating,
            long ratingCount) { }

    public record MovieWrite(
            String title,
            String overview,
            int releaseYear,
            LocalDate releaseDate,
            Integer runtimeMinutes,
            String posterUrl,
            String externalSource,
            String externalId,
            List<String> genreIds) { }

    public record PageResult<T>(List<T> content, int page, int size, long totalElements, int totalPages) { }
}
