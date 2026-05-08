package com.example.adgroup.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;

@Configuration
public class LdapConfig {

    @Bean
    public LdapContextSource contextSource(
            @Value("${spring.ldap.urls}") String url,
            @Value("${spring.ldap.base}") String base,
            @Value("${spring.ldap.username}") String username,
            @Value("${spring.ldap.password}") String password) {

        LdapContextSource source = new LdapContextSource();
        source.setUrl(url);
        source.setBase(base);
        source.setUserDn(username);
        source.setPassword(password);

        // Force binary handling for these attributes
        source.setBaseEnvironmentProperties(Map.of(
            "java.naming.ldap.attributes.binary", "objectGUID objectSid"
        ));

        return source;
    }

    @Bean
    public LdapTemplate ldapTemplate(LdapContextSource contextSource) {
        return new LdapTemplate(contextSource);
    }
}

private String convertObjectGuidToString(Attributes attrs) {
    try {
        var attr = attrs.get("objectGUID");
        if (attr == null) return null;

        Object value = attr.get();
        if (value == null) return null;

        byte[] bytes;

        // Handle both possible return types from LDAP provider
        if (value instanceof byte[]) {
            bytes = (byte[]) value;
        } else if (value instanceof String) {
            // Some LDAP providers return it as a raw binary string
            bytes = ((String) value).getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);
        } else {
            throw new IllegalArgumentException("Unexpected objectGUID type: " + value.getClass().getName());
        }

        if (bytes.length != 16) {
            throw new IllegalArgumentException("objectGUID must be 16 bytes, got: " + bytes.length);
        }

        // Reorder bytes: AD uses mixed-endian, UUID needs big-endian
        byte[] reordered = new byte[]{
            bytes[3], bytes[2], bytes[1], bytes[0],  // Data1: reverse
            bytes[5], bytes[4],                       // Data2: reverse
            bytes[7], bytes[6],                       // Data3: reverse
            bytes[8], bytes[9],                       // Data4: as-is
            bytes[10], bytes[11], bytes[12],
            bytes[13], bytes[14], bytes[15]
        };

        ByteBuffer bb = ByteBuffer.wrap(reordered);
        long high = bb.getLong();
        long low  = bb.getLong();

        return new UUID(high, low).toString();

    } catch (NamingException e) {
        throw new RuntimeException("Failed to read objectGUID from LDAP attributes", e);
    }
}

package com.example.adgroup.model;

public class AdGroupMember {

    private String memberId;      // sAMAccountName
    private String displayName;
    private String dn;
    private String objectId;      // objectGUID converted to UUID — matches JWT "oid"

    public AdGroupMember() {}

    public AdGroupMember(String memberId, String displayName, String dn, String objectId) {
        this.memberId    = memberId;
        this.displayName = displayName;
        this.dn          = dn;
        this.objectId    = objectId;
    }

    public String getMemberId()    { return memberId; }
    public String getDisplayName() { return displayName; }
    public String getDn()          { return dn; }
    public String getObjectId()    { return objectId; }

    public void setMemberId(String memberId)       { this.memberId = memberId; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public void setDn(String dn)                   { this.dn = dn; }
    public void setObjectId(String objectId)       { this.objectId = objectId; }

    @Override
    public String toString() {
        return "AdGroupMember{memberId='" + memberId + "', displayName='" + displayName +
               "', objectId='" + objectId + "'}";
    }
}



package com.example.adgroup.service;

import com.example.adgroup.model.AdGroupMember;
import org.springframework.ldap.core.AttributesMapper;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.filter.AndFilter;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.stereotype.Service;

import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import javax.naming.directory.SearchControls;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AdGroupService {

    private final LdapTemplate ldapTemplate;

    public AdGroupService(LdapTemplate ldapTemplate) {
        this.ldapTemplate = ldapTemplate;
    }

    /**
     * Returns a HashMap<objectId, AdGroupMember> for all members of the given AD group.
     * Key is the objectGUID (UUID string) which matches the JWT "oid" claim.
     *
     * @param groupName  AD group CN (e.g. "MyTeamGroup")
     * @return HashMap of objectId -> AdGroupMember
     */
    public Map<String, AdGroupMember> getMembersByGroupName(String groupName) {
        Map<String, AdGroupMember> memberMap = new HashMap<>();

        // Step 1: Resolve group's distinguishedName
        String groupDn = resolveGroupDn(groupName);
        if (groupDn == null) {
            throw new IllegalArgumentException("AD group not found: " + groupName);
        }

        // Step 2: Search all users in the group
        AndFilter filter = new AndFilter();
        filter.and(new EqualsFilter("objectClass", "user"));
        filter.and(new EqualsFilter("memberOf", groupDn));

        SearchControls controls = new SearchControls();
        controls.setSearchScope(SearchControls.SUBTREE_SCOPE);
        controls.setReturningAttributes(new String[]{
            "sAMAccountName",
            "displayName",
            "distinguishedName",
            "objectGUID"
        });

        List<AdGroupMember> members = ldapTemplate.search(
            "",
            filter.encode(),
            controls,
            (AttributesMapper<AdGroupMember>) this::mapAttributes
        );

        // Step 3: Build HashMap keyed by objectId (matches JWT "oid")
        for (AdGroupMember member : members) {
            if (member != null && member.getObjectId() != null) {
                memberMap.put(member.getObjectId(), member);
            }
        }

        return memberMap;
    }

    /**
     * Checks if the given objectId (from JWT "oid" claim) is a member of the AD group.
     *
     * @param groupName  AD group CN
     * @param objectId   JWT "oid" claim value
     * @return true if user is a member
     */
    public boolean isUserInGroup(String groupName, String objectId) {
        Map<String, AdGroupMember> members = getMembersByGroupName(groupName);
        return members.containsKey(objectId);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private String resolveGroupDn(String groupName) {
        AndFilter filter = new AndFilter();
        filter.and(new EqualsFilter("objectClass", "group"));
        filter.and(new EqualsFilter("cn", groupName));

        List<String> results = ldapTemplate.search(
            "",
            filter.encode(),
            (AttributesMapper<String>) attrs -> getStringAttr(attrs, "distinguishedName")
        );

        return results.isEmpty() ? null : results.get(0);
    }

    private AdGroupMember mapAttributes(Attributes attrs) throws NamingException {
        String memberId    = getStringAttr(attrs, "sAMAccountName");
        String displayName = getStringAttr(attrs, "displayName");
        String dn          = getStringAttr(attrs, "distinguishedName");
        String objectId    = convertObjectGuidToString(attrs);

        if (memberId == null && objectId == null) {
            return null;
        }

        return new AdGroupMember(memberId, displayName, dn, objectId);
    }

    /**
     * Converts AD's binary objectGUID to a UUID string matching the JWT "oid" claim.
     * AD stores the first 3 GUID components in little-endian — must reorder to big-endian.
     */
    private String convertObjectGuidToString(Attributes attrs) {
        try {
            var attr = attrs.get("objectGUID");
            if (attr == null) return null;

            byte[] bytes = (byte[]) attr.get();
            if (bytes == null || bytes.length != 16) return null;

            // Reorder bytes: AD uses mixed-endian, UUID needs big-endian
            byte[] reordered = new byte[]{
                bytes[3], bytes[2], bytes[1], bytes[0],  // Data1: reverse
                bytes[5], bytes[4],                       // Data2: reverse
                bytes[7], bytes[6],                       // Data3: reverse
                bytes[8], bytes[9],                       // Data4: as-is
                bytes[10], bytes[11], bytes[12],
                bytes[13], bytes[14], bytes[15]
            };

            ByteBuffer bb = ByteBuffer.wrap(reordered);
            long high = bb.getLong();
            long low  = bb.getLong();

            return new UUID(high, low).toString();

        } catch (NamingException | ClassCastException e) {
            return null;
        }
    }

    private String getStringAttr(Attributes attrs, String name) {
        try {
            var attr = attrs.get(name);
            return (attr != null) ? (String) attr.get() : null;
        } catch (NamingException e) {
            return null;
        }
    }
}


