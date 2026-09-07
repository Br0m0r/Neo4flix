package com.neo4flix.platform.common.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

public final class ProblemDetails {

    private ProblemDetails() {
    }

    public static ProblemDetail badRequest(String code, String requestId) {
        var problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setTitle("Bad Request");
        problemDetail.setProperty("code", code);
        problemDetail.setProperty("traceId", requestId);
        return problemDetail;
    }
}
