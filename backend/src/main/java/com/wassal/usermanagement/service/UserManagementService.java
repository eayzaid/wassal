package com.wassal.usermanagement.service;

import com.wassal.usermanagement.dto.ChangeRoleRequest;
import com.wassal.usermanagement.dto.ContactDto;
import com.wassal.usermanagement.dto.UserSummaryDto;
import com.wassal.usermanagement.entity.AccountStatus;
import com.wassal.usermanagement.entity.Role;
import com.wassal.usermanagement.entity.User;
import com.wassal.usermanagement.exception.InsufficientPrivilegeException;
import com.wassal.usermanagement.exception.InvalidOperationException;
import com.wassal.usermanagement.exception.ResourceNotFoundException;
import com.wassal.usermanagement.repository.RefreshTokenRepository;
import com.wassal.usermanagement.repository.UserRepository;
import com.wassal.usermanagement.security.UserPrincipal;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailService emailService;
    private final ContactService contactService;

    @Transactional(readOnly = true)
    public Page<UserSummaryDto> listUsers(AccountStatus status, Role role, Boolean blocked, String q, Pageable pageable) {
        Specification<User> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("accountStatus"), status));
            }
            if (role != null) {
                predicates.add(criteriaBuilder.equal(root.get("role"), role));
            }
            if (blocked != null) {
                predicates.add(criteriaBuilder.equal(root.get("blocked"), blocked));
            }
            if (StringUtils.hasText(q)) {
                String searchPattern = "%" + q.toLowerCase().trim() + "%";
                Predicate searchPredicate = criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), searchPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("lastName")), searchPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), searchPattern)
                );
                predicates.add(searchPredicate);
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable).map(UserSummaryDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getUserById(Long id) {
        User user = findUserById(id);
        return UserSummaryDto.fromEntity(user);
    }

    @Transactional
    public UserSummaryDto approveUser(Long targetId, UserPrincipal actor) {
        User target = findUserById(targetId);

        // BR-8: No user may approve themself
        validateNotSelf(actor, target, "approve");

        // Allow PENDING_APPROVAL or previously REJECTED accounts to be approved
        if (target.getAccountStatus() != AccountStatus.PENDING_APPROVAL && target.getAccountStatus() != AccountStatus.REJECTED) {
            throw new InvalidOperationException("Only accounts with PENDING_APPROVAL or REJECTED status can be approved.");
        }

        target.setAccountStatus(AccountStatus.APPROVED);
        User saved = userRepository.save(target);

        // Send confirmation email
        emailService.sendAccountApprovedEmail(saved);

        return UserSummaryDto.fromEntity(saved);
    }

    @Transactional
    public UserSummaryDto rejectUser(Long targetId, UserPrincipal actor) {
        User target = findUserById(targetId);

        // BR-8: No user may reject themself
        validateNotSelf(actor, target, "reject");

        // BR-10: Target must be PENDING_APPROVAL
        if (target.getAccountStatus() != AccountStatus.PENDING_APPROVAL) {
            throw new InvalidOperationException("Only accounts with PENDING_APPROVAL status can be rejected.");
        }

        target.setAccountStatus(AccountStatus.REJECTED);
        User saved = userRepository.save(target);

        // Send rejection notice with contact info
        ContactDto contact = contactService.resolveAdminContact();
        emailService.sendAccountRejectedEmail(saved, contact);

        return UserSummaryDto.fromEntity(saved);
    }

    @Transactional
    public UserSummaryDto changeUserRole(Long targetId, ChangeRoleRequest request, UserPrincipal actor) {
        User target = findUserById(targetId);
        Role newRole = request.role();

        // BR-8: No user may change role on themself
        validateNotSelf(actor, target, "change the role of");

        // Assignment of PRESIDENT role:
        // Only the current PRESIDENT can assign the PRESIDENT role to another member.
        // This action strips the current PRESIDENT of their role (demoting them to MEMBER),
        // because only one PRESIDENT is allowed in the whole application.
        if (newRole == Role.PRESIDENT) {
            if (actor.getRole() != Role.PRESIDENT) {
                throw new InsufficientPrivilegeException("Only the President can assign the President role.");
            }
            if (target.getAccountStatus() != AccountStatus.APPROVED || target.isBlocked()) {
                throw new InvalidOperationException("President role can only be assigned to an active, approved member.");
            }

            // Strip the current president(s) of their role (demote to MEMBER)
            List<User> existingPresidents = userRepository.findAllByRole(Role.PRESIDENT);
            for (User p : existingPresidents) {
                if (!p.getId().equals(target.getId())) {
                    p.setRole(Role.MEMBER);
                    userRepository.save(p);
                }
            }
        }

        // BR-9: If target's current role is PRESIDENT or VICE_PRESIDENT, actor must be PRESIDENT
        if (target.getRole() == Role.PRESIDENT || target.getRole() == Role.VICE_PRESIDENT) {
            if (actor.getRole() != Role.PRESIDENT) {
                throw new InsufficientPrivilegeException("Only the President can perform this action on this user.");
            }
        }

        // BR-13: RH cannot set any user's role to PRESIDENT, VICE_PRESIDENT, or RH
        if (actor.getRole() == Role.RH && (newRole == Role.PRESIDENT || newRole == Role.VICE_PRESIDENT || newRole == Role.RH)) {
            throw new InsufficientPrivilegeException("RH administrators cannot assign top-tier roles.");
        }

        // BR-6: TEAM_LEADER is only reachable via an admin role-change action on an existing MEMBER
        if (newRole == Role.TEAM_LEADER && target.getRole() != Role.MEMBER) {
            throw new InvalidOperationException("TEAM_LEADER role can only be assigned to an existing MEMBER.");
        }

        target.setRole(newRole);
        User saved = userRepository.save(target);
        return UserSummaryDto.fromEntity(saved);
    }

    @Transactional
    public UserSummaryDto blockUser(Long targetId, UserPrincipal actor) {
        User target = findUserById(targetId);

        // BR-8: No user may block themself
        validateNotSelf(actor, target, "block");

        // BR-9: If target's current role is PRESIDENT or VICE_PRESIDENT, actor must be PRESIDENT
        if (target.getRole() == Role.PRESIDENT || target.getRole() == Role.VICE_PRESIDENT) {
            if (actor.getRole() != Role.PRESIDENT) {
                throw new InsufficientPrivilegeException("Only the President can perform this action on this user.");
            }
        }

        target.setBlocked(true);
        User saved = userRepository.save(target);

        // Invalidate active sessions
        refreshTokenRepository.revokeAllByUserId(target.getId());

        return UserSummaryDto.fromEntity(saved);
    }

    @Transactional
    public UserSummaryDto unblockUser(Long targetId, UserPrincipal actor) {
        User target = findUserById(targetId);

        // BR-8: No user may unblock themself
        validateNotSelf(actor, target, "unblock");

        // BR-9: If target's current role is PRESIDENT or VICE_PRESIDENT, actor must be PRESIDENT
        if (target.getRole() == Role.PRESIDENT || target.getRole() == Role.VICE_PRESIDENT) {
            if (actor.getRole() != Role.PRESIDENT) {
                throw new InsufficientPrivilegeException("Only the President can perform this action on this user.");
            }
        }

        target.setBlocked(false);
        User saved = userRepository.save(target);
        return UserSummaryDto.fromEntity(saved);
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private void validateNotSelf(UserPrincipal actor, User target, String action) {
        if (actor.getId().equals(target.getId())) {
            throw new InvalidOperationException("You cannot " + action + " yourself.");
        }
    }
}
