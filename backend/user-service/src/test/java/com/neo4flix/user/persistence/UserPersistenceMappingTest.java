package com.neo4flix.user.persistence;

import org.junit.jupiter.api.Test;
import org.springframework.data.annotation.Id;
import org.springframework.data.neo4j.core.schema.Node;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

class UserPersistenceMappingTest {

    @Test
    void userOwnedNodesDeclareTheirCanonicalLabelsAndStringIds() throws NoSuchFieldException {
        assertThat(UserNode.class.getAnnotation(Node.class).value()).containsExactly("User");
        assertThat(AuthSessionNode.class.getAnnotation(Node.class).value()).containsExactly("AuthSession");
        assertThat(AuthChallengeNode.class.getAnnotation(Node.class).value()).containsExactly("AuthChallenge");

        assertStringId(UserNode.class);
        assertStringId(AuthSessionNode.class);
        assertStringId(AuthChallengeNode.class);
    }

    private void assertStringId(Class<?> type) throws NoSuchFieldException {
        Field id = type.getDeclaredField("id");
        assertThat(id.getType()).isEqualTo(String.class);
        assertThat(id.isAnnotationPresent(Id.class)).isTrue();
    }
}
