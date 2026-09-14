package com.neo4flix.recommendation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.neo4flix.recommendation.core.RecommendationConfiguration;

@SpringBootApplication(scanBasePackages = {"com.neo4flix.recommendation", "com.neo4flix.platform.common"})
@EnableConfigurationProperties(RecommendationConfiguration.class)
public class RecommendationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(RecommendationServiceApplication.class, args);
    }
}
