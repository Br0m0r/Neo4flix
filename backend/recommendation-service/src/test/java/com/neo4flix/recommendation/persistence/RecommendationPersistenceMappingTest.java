package com.neo4flix.recommendation.persistence;

import org.junit.jupiter.api.Test;
import org.springframework.data.annotation.Id;
import org.springframework.data.neo4j.core.schema.Node;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

class RecommendationPersistenceMappingTest {

    @Test
    void recommendationShareDeclaresItsCanonicalLabelAndStringId() throws NoSuchFieldException {
        assertThat(RecommendationShareNode.class.getAnnotation(Node.class).value())
                .containsExactly("RecommendationShare");

        Field id = RecommendationShareNode.class.getDeclaredField("id");
        assertThat(id.getType()).isEqualTo(String.class);
        assertThat(id.isAnnotationPresent(Id.class)).isTrue();
    }
}
