package com.wassal.usermanagement.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wassal.usermanagement.dto.ContactDto;
import com.wassal.usermanagement.dto.ErrorResponse;
import com.wassal.usermanagement.entity.AccountStatus;
import com.wassal.usermanagement.entity.User;
import com.wassal.usermanagement.repository.UserRepository;
import com.wassal.usermanagement.service.ContactService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ContactService contactService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                Long userId = jwtTokenProvider.getUserIdFromToken(jwt);

                // BR-5: Live DB verification on every authenticated request
                Optional<User> userOpt = userRepository.findById(userId);

                if (userOpt.isPresent()) {
                    User user = userOpt.get();

                    if (user.isBlocked()) {
                        log.warn("Blocked user {} attempted to access {}", userId, request.getRequestURI());
                        ContactDto contact = contactService.resolveAdminContact();
                        writeErrorResponse(response, HttpStatus.FORBIDDEN, new ErrorResponse(
                                "ACCOUNT_BLOCKED",
                                "Your account has been blocked. Contact an administrator.",
                                contact
                        ));
                        return;
                    }

                    if (user.getAccountStatus() == AccountStatus.PENDING_APPROVAL) {
                        writeErrorResponse(response, HttpStatus.FORBIDDEN, new ErrorResponse(
                                "ACCOUNT_PENDING_APPROVAL",
                                "Your account is awaiting admin approval."
                        ));
                        return;
                    }

                    if (user.getAccountStatus() == AccountStatus.REJECTED) {
                        ContactDto contact = contactService.resolveAdminContact();
                        writeErrorResponse(response, HttpStatus.FORBIDDEN, new ErrorResponse(
                                "ACCOUNT_REJECTED",
                                "Your registration was rejected. Contact an administrator to request reconsideration.",
                                contact
                        ));
                        return;
                    }

                    UserPrincipal userPrincipal = UserPrincipal.create(user);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private void writeErrorResponse(HttpServletResponse response, HttpStatus status, ErrorResponse errorResponse) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
}
