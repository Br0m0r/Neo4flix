package com.neo4flix.rating.persistence;

import org.junit.jupiter.api.Test;
import org.springframework.data.neo4j.core.schema.Property;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

class RatingPersistenceMappingTest {

    @Test
    void ratedRelationshipDeclaresPersistedKeyProperty() throws NoSuchFieldException {
        Field key = RatedRelationship.class.getDeclaredField("key");

        assertThat(RatedRelationship.class.isAnnotationPresent(RelationshipProperties.class)).isTrue();
        assertThat(key.getType()).isEqualTo(String.class);
        assertThat(key.isAnnotationPresent(Property.class)).isTrue();
    }
}
