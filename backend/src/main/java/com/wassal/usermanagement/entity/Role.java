package com.wassal.usermanagement.entity;

import java.util.ArrayList;
import java.util.List;

public enum Role {
    PRESIDENT,
    VICE_PRESIDENT,
    RH,
    TEAM_LEADER,
    MEMBER;

    public boolean isAdminTier() {
        return this == PRESIDENT || this == VICE_PRESIDENT || this == RH;
    }

    public List<String> getAuthorities() {
        List<String> authorities = new ArrayList<>();
        authorities.add("ROLE_" + this.name());
        if (isAdminTier()) {
            authorities.add("ROLE_ADMIN");
        }
        return authorities;
    }
}
