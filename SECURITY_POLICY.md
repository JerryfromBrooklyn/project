# Security Policy: Row Level Security (RLS) Configuration

## 🚨 CRITICAL NOTICE 🚨

### RLS IS DELIBERATELY DISABLED FOR DEVELOPMENT

Row Level Security (RLS) has been **intentionally disabled** on all database tables in this project until further notice. This decision was made to facilitate development and testing of core functionality without security-related impediments.

## Explanation

The application relies on complex database interactions for the following features:
- Face recognition and matching functionality
- Administrative tools and operations
- User profile management
- Photo sharing and matching

During the MVP and pre-beta development phases, enabling RLS would introduce complexity that could impede the development and testing of these core features.

## Important Rules

1. **DO NOT** enable RLS policies on any database tables without authorization
2. **DO NOT** create new tables with RLS enabled
3. **DO NOT** modify existing security configurations
4. All database changes should be made with the understanding that RLS is disabled

## Implementation Timeline

RLS policies will be implemented:
- **After** core functionality is stable and well-tested
- **Before** any beta testing with external users begins
- Only with explicit approval from the project lead

## Security Considerations

While RLS is disabled, maintain these security practices:
- Keep the application in a controlled environment
- Do not expose database endpoints to public networks
- Use test data only (avoid storing sensitive information)
- Restrict access to team members only

## Documentation

This security approach is documented in:
- This dedicated SECURITY_POLICY.md file
- Security notices at the top of key files
- Database setup scripts

## Questions or Concerns

If you have questions about this policy or need to implement security features before the designated timeline, please consult with the project lead. 