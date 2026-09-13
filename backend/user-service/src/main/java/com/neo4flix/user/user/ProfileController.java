package com.neo4flix.user.user;

import com.neo4flix.user.api.PublicUser;
import com.neo4flix.user.api.UpdateProfileRequest;
import com.neo4flix.user.auth.AuthApplicationService;
import com.neo4flix.user.security.JwtKeyConfiguration;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Conditional;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me")
@Conditional(JwtKeyConfiguration.PrivateKeyConfigured.class)
public class ProfileController {

    private final AuthApplicationService auth;

    public ProfileController(AuthApplicationService auth) {
        this.auth = auth;
    }

    @GetMapping
    public PublicUser me(@AuthenticationPrincipal Jwt jwt) {
        return auth.currentUser(jwt.getSubject());
    }

    @PatchMapping
    public PublicUser update(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateProfileRequest request) {
        return auth.updateProfile(jwt.getSubject(), request);
    }
}
