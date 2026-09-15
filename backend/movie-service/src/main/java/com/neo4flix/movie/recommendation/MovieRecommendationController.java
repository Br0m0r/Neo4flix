package com.neo4flix.movie.recommendation;

import java.util.LinkedHashMap;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/movies")
public class MovieRecommendationController {

    private final MovieRecommendationClient client;

    public MovieRecommendationController(MovieRecommendationClient client) {
        this.client = client;
    }

    @GetMapping("/recommended")
    public ResponseEntity<?> recommend(@ModelAttribute MovieRecommendationQueryParams params,
                                       HttpServletRequest request) {
        HttpHeaders headers = new HttpHeaders();
        copyHeader(request, headers, HttpHeaders.AUTHORIZATION);
        copyHeader(request, headers, "X-Request-Id");
        try {
            return client.fetch(headers, query(params));
        } catch (RecommendationUnavailableException exception) {
            String requestId = request.getHeader("X-Request-Id");
            var body = new LinkedHashMap<String, Object>();
            body.put("type", "https://neo4flix.dev/problems/recommendation-service-unavailable");
            body.put("title", "Recommendation service unavailable");
            body.put("status", 503);
            body.put("detail", "Recommendations are temporarily unavailable");
            body.put("code", "RECOMMENDATION_SERVICE_UNAVAILABLE");
            if (requestId != null && !requestId.isBlank()) {
                body.put("traceId", requestId);
            }
            return ResponseEntity.status(503)
                    .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                    .body(body);
        }
    }

    private static LinkedMultiValueMap<String, String> query(MovieRecommendationQueryParams params) {
        var query = new LinkedMultiValueMap<String, String>();
        add(query, "genre", params.genre());
        add(query, "fromYear", params.fromYear());
        add(query, "toYear", params.toYear());
        add(query, "minimumAverageRating", params.minimumAverageRating());
        add(query, "sort", params.sort());
        add(query, "page", params.page());
        add(query, "size", params.size());
        return query;
    }

    private static void add(LinkedMultiValueMap<String, String> query, String key, Object value) {
        if (value != null && (! (value instanceof String string) || !string.isBlank())) {
            query.add(key, value.toString());
        }
    }

    private static void copyHeader(HttpServletRequest request, HttpHeaders headers, String name) {
        String value = request.getHeader(name);
        if (value != null && !value.isBlank()) {
            headers.set(name, value);
        }
    }
}
