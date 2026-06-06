package com.hcerp.erp.security;

import java.util.Collection;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.hcerp.erp.account.Account;
import com.hcerp.erp.common.Enums.AccountStatus;

public record ErpUserDetails(Account account, Collection<? extends GrantedAuthority> authorities) implements UserDetails {
    public UUID accountId() {
        return account.id;
    }

    @Override
    public String getPassword() {
        return account.passwordHash;
    }

    @Override
    public String getUsername() {
        return account.username;
    }

    @Override
    public boolean isAccountNonLocked() {
        return account.status != AccountStatus.LOCKED;
    }

    @Override
    public boolean isEnabled() {
        return account.status == AccountStatus.ACTIVE && account.deletedAt == null;
    }
}
