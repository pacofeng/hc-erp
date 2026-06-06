package com.hcerp.erp.security;

import java.util.ArrayList;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.hcerp.erp.account.Account;
import com.hcerp.erp.account.AccountRepository;

@Service
public class ErpUserDetailsService implements UserDetailsService {
    private final AccountRepository accounts;

    public ErpUserDetailsService(AccountRepository accounts) {
        this.accounts = accounts;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Account account = accounts.findByUsernameAndDeletedAtIsNull(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
        var authorities = new ArrayList<SimpleGrantedAuthority>();
        accounts.findRoleCodes(account.id).forEach(code -> authorities.add(new SimpleGrantedAuthority("ROLE_" + code)));
        accounts.findPermissionCodes(account.id).forEach(code -> authorities.add(new SimpleGrantedAuthority(code)));
        return new ErpUserDetails(account, authorities);
    }
}
