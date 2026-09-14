package com.aimentor.repository;

import com.aimentor.entity.MentorSession;
import com.aimentor.entity.User;
import com.aimentor.entity.enums.SessionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentorSessionRepository extends JpaRepository<MentorSession, Long> {

    List<MentorSession> findByUserOrderByCreatedAtDesc(User user);

    Page<MentorSession> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    long countByUser(User user);

    List<MentorSession> findByUserAndSessionTypeOrderByCreatedAtDesc(
        User user, SessionType sessionType);

    @Query("SELECT COUNT(s) FROM MentorSession s WHERE s.user = :user AND " +
           "FUNCTION('DATE', s.createdAt) = CURRENT_DATE")
    long countTodayByUser(@Param("user") User user);
}
