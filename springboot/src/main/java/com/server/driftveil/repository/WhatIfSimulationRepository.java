package com.server.driftveil.repository;

import com.server.driftveil.entity.WhatIfSimulation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WhatIfSimulationRepository extends JpaRepository<WhatIfSimulation, String> {
}
