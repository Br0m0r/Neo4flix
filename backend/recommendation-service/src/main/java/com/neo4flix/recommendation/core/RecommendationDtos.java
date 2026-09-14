package com.neo4flix.recommendation.core;

import java.util.List;

public final class RecommendationDtos {

    private RecommendationDtos() {
    }

    public enum Strategy {
        POPULARITY,
        CONTENT_PLUS_POPULARITY,
        HYBRID
    }

    public record Query(
            String userId,
            int limit,
            int minimumOverlap,
            int peerLimit,
            int candidateLimit,
            String genre,
            Integer fromYear,
            Integer toYear,
            Double minimumAverageRating) {
    }

    public record SignalRow(
            String movieId,
            String title,
            String overview,
            Integer releaseYear,
            String posterUrl,
            List<String> genres,
            double collaborativeScore,
            double contentScore,
            double popularityScore,
            int peerCount,
            int commonMovies,
            double averageRating,
            long ratingCount) {
    }

    public record Result(
            String movieId,
            String title,
            String overview,
            Integer releaseYear,
            String posterUrl,
            double score,
            Strategy strategy,
            String reason) {
    }
}
