package com.hcerp.erp.preference;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TablePreferenceRepository extends JpaRepository<TablePreference, UUID> {
}
