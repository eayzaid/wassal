package com.wassal.usermanagement.repository;

import com.wassal.usermanagement.entity.PasswordResetCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {

    Optional<PasswordResetCode> findFirstByUserIdAndUsedFalseOrderByCreatedAtDesc(Long userId);

    Optional<PasswordResetCode> findByResetToken(String resetToken);

    @Modifying
    @Query("UPDATE PasswordResetCode p SET p.used = true WHERE p.userId = :userId")
    void markAllUsedByUserId(@Param("userId") Long userId);
}
