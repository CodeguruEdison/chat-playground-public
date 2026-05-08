import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.AttributesMapper;
import org.springframework.ldap.filter.AndFilter;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.stereotype.Service;

import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import javax.naming.directory.SearchControls;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdGroupService {

    private final LdapTemplate ldapTemplate;

    public AdGroupService(LdapTemplate ldapTemplate) {
        this.ldapTemplate = ldapTemplate;
    }

    /**
     * Returns a HashMap<String, AdGroupMember> where key = sAMAccountName (member ID)
     *
     * @param groupName - The AD group CN (e.g., "MyTeamGroup")
     * @return HashMap of memberId -> AdGroupMember
     */
    public Map<String, AdGroupMember> getMembersByGroupName(String groupName) {
        Map<String, AdGroupMember> memberMap = new HashMap<>();

        // Step 1: Resolve the group's DN
        String groupDn = resolveGroupDn(groupName);
        if (groupDn == null) {
            throw new IllegalArgumentException("AD group not found: " + groupName);
        }

        // Step 2: Query all users who are members of this group
        AndFilter filter = new AndFilter();
        filter.and(new EqualsFilter("objectClass", "user"));
        filter.and(new EqualsFilter("memberOf", groupDn));

        SearchControls controls = new SearchControls();
        controls.setSearchScope(SearchControls.SUBTREE_SCOPE);
        controls.setReturningAttributes(new String[]{"sAMAccountName", "displayName", "distinguishedName"});

        List<AdGroupMember> members = ldapTemplate.search(
            "",  // search from base defined in properties
            filter.encode(),
            controls,
            (AttributesMapper<AdGroupMember>) attrs -> {
                String id = getAttr(attrs, "sAMAccountName");
                String display = getAttr(attrs, "displayName");
                String dn = getAttr(attrs, "distinguishedName");
                return (id != null) ? new AdGroupMember(id, display, dn) : null;
            }
        );

        // Step 3: Build the HashMap
        for (AdGroupMember member : members) {
            if (member != null) {
                memberMap.put(member.getMemberId(), member);
            }
        }

        return memberMap;
    }

    private String resolveGroupDn(String groupName) {
        AndFilter filter = new AndFilter();
        filter.and(new EqualsFilter("objectClass", "group"));
        filter.and(new EqualsFilter("cn", groupName));

        List<String> results = ldapTemplate.search(
            "",
            filter.encode(),
            (AttributesMapper<String>) attrs -> getAttr(attrs, "distinguishedName")
        );

        return results.isEmpty() ? null : results.get(0);
    }

    private String getAttr(Attributes attrs, String name) {
        try {
            var attr = attrs.get(name);
            return (attr != null) ? (String) attr.get() : null;
        } catch (NamingException e) {
            return null;
        }
    }
}
