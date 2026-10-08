package com.hcerp.erp.dashboard;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DashboardPreferenceRepository extends JpaRepository<DashboardPreference, UUID> {
}
