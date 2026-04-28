package com.server.driftveil.repository;

import com.server.driftveil.entity.SensorReading;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReading, String> {
    List<SensorReading> findByMachineIdOrderByTimeAsc(String machineId);
    List<SensorReading> findTop200ByMachineIdOrderByTimeAsc(String machineId);

    /** Fetch latest `limit` rows for a machine, ordered DESC (newest first). */
    @Query("SELECT s FROM SensorReading s WHERE s.machineId = :machineId ORDER BY s.time DESC LIMIT :limit")
    List<SensorReading> findTopByMachineIdOrderByTimeDesc(@Param("machineId") String machineId,
                                                          @Param("limit") int limit);
}
