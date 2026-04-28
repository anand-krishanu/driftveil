package com.server.driftveil.repository;

import com.server.driftveil.entity.FailureFingerprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FailureFingerprintRepository extends JpaRepository<FailureFingerprint, String> {
}
