package com.neo4flix.user.auth;

import com.neo4flix.user.api.AuthResponse;
import com.neo4flix.user.api.ChangePasswordRequest;
import com.neo4flix.user.api.LoginRequest;
import com.neo4flix.user.api.PublicUser;
import com.neo4flix.user.api.RegisterRequest;
import com.neo4flix.user.api.TwoFactorChallenge;
import com.neo4flix.user.security.JwtKeyConfiguration;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Conditional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/auth")
@Conditional(JwtKeyConfiguration.PrivateKeyConfigured.class)
public class AuthController {

    private final AuthApplicationService auth;
    private final RefreshCookieFactory cookies;

    public AuthController(AuthApplicationService auth, RefreshCookieFactory cookies) {
        this.auth = auth;
        this.cookies = cookies;
    }

    @PostMapping("/register")
    public ResponseEntity<PublicUser> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auth.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        AuthApplicationService.LoginOutcome outcome = auth.login(request);
        if (outcome instanceof AuthApplicationService.RequiresTwoFactor) {
            return ResponseEntity.accepted().body(new TwoFactorChallenge(true, null, 0));
        }
        return authenticated((AuthApplicationService.Authenticated) outcome);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        return authenticated(auth.refresh(refreshToken(request)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        auth.logout(optionalRefreshToken(request));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookies.clear().toString())
                .build();
    }

    @GetMapping("/me")
    public PublicUser me(@AuthenticationPrincipal Jwt jwt) {
        return auth.currentUser(jwt.getSubject());
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ChangePasswordRequest request) {
        auth.changePassword(jwt.getSubject(), request);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<AuthResponse> authenticated(AuthApplicationService.Authenticated authenticated) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookies.issue(authenticated.refreshToken()).toString())
                .body(authenticated.response());
    }

    private String refreshToken(HttpServletRequest request) {
        String token = optionalRefreshToken(request);
        if (token == null) {
            throw new AuthApplicationService.InvalidRefreshTokenException();
        }
        return token;
    }

    private String optionalRefreshToken(HttpServletRequest request) {
        Cookie[] requestCookies = request.getCookies();
        if (requestCookies == null) {
            return null;
        }
        return Arrays.stream(requestCookies)
                .filter(cookie -> cookies.name().equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
