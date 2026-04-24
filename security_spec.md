# Security Specification - Python Oasis

## 1. Data Invariants
- A lesson must have a title and a valid category (arabic or english).
- Only admins (defined in `/admins/{userId}`) can create, update, or delete lessons.
- Anyone can read lessons (public access for viewing).
- Students can be read by admins only.
- Admnins are restricted to users present in the `/admins/` collection.

## 2. The "Dirty Dozen" Payloads (Red Team)
1. **Unauthorized Create**: authenticated but non-admin user trying to create a lesson.
2. **Identity Spoofing**: admin trying to create a lesson with a mismatched `authorId` (if we had one, but we use a flat structure for simplicity here).
3. **Invalid Level**: creating a lesson with level "GodMode".
4. **Invalid Category**: creating a lesson with category "spanish".
5. **PDF URL Poisoning**: injecting a 2MB string into `pdfUrl`.
6. **Immutable Field Attack**: trying to change `createdAt` on update.
7. **Bypassing Server Timestamp**: client providing a past date as `createdAt`.
8. **Admin Self-Promotion**: non-admin trying to create an entry in `/admins/`.
9. **Student Data Leak**: unauthenticated user trying to list all students.
10. **Shadow Field Injection**: adding `isFeatured: true` to a lesson update without schema support.
11. **Malicious ID**: using a 2KB string as `lessonId`.
12. **Recursive Cost Attack**: spamming list queries without authentication.

## 3. Test Runner Concept
The `firestore.rules` will be validated against these scenarios.
