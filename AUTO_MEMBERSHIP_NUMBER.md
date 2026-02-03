# Automatic Membership Number Generation

## Implementation Complete! ✅

Membership numbers are now automatically generated based on the membership type chosen by the user.

## Membership Number Format

| Membership Type | Prefix | Example Numbers |
|----------------|--------|-----------------|
| **Lifetime** | LM | LM001, LM002, LM003... |
| **5-Yearly** | 5YL | 5YL001, 5YL002, 5YL003... |
| **Yearly** | YL | YL001, YL002, YL003... |
| **Student** | ST | ST001, ST002, ST003... |
| **Honorary** | HN | HN001, HN002, HN003... |
| **Standard** (default) | STD | STD001, STD002, STD003... |

## How It Works

### When User Registers:

1. User selects membership type (e.g., "Yearly (Student)")
2. User completes payment
3. Backend automatically:
   - Detects membership type from the name
   - Determines appropriate prefix (YL for Yearly)
   - Finds the last used number for that prefix
   - Generates next sequential number (e.g., YL015)
   - Assigns to user's account

### Example Flow:

```
User chooses: "Yearly (Passout)"
↓
System detects: "YEARLY" in type name
↓
Prefix determined: YL
↓
Last YL number: YL014
↓
Generated: YL015
↓
Assigned to user
```

## Prefix Detection Logic

The system checks the membership type name (case-insensitive) in this order:

1. **Lifetime/Life** → LM
2. **5-Yearly/5 Yearly** → 5YL (checked before Yearly to avoid confusion)
3. **Yearly/Annual** → YL
4. **Student** → ST
5. **Honorary** → HN
6. **Default** → STD

## Sequential Numbering

- Each prefix has its own sequence
- Numbers are padded to 3 digits (001, 002, etc.)
- System automatically finds the last number and increments
- No gaps in sequence

### Examples:
- First Lifetime member: **LM001**
- Second Lifetime member: **LM002**
- First Yearly member: **YL001**
- 15th Yearly member: **YL015**
- 100th 5-Yearly member: **5YL100**

## Where It's Used

### 1. Membership Registration (payment.routes.js)
- When user completes membership payment
- Number is generated and assigned immediately
- Stored in both `users` table and `membership_registrations` table

### 2. Seminar Registration (registration.controller.js)
- When BOA member registers for seminar
- If they don't have a membership number yet
- Number is generated based on their membership type

## Files Modified

- `backend/routes/payment.routes.js` - Added generateMembershipNo function and auto-assignment
- `backend/controllers/registration.controller.js` - Updated generateMembershipNo function

## Testing

### Test Scenarios:

1. **New Lifetime Member**
   - Register with "Lifetime" membership
   - Should get: LM001 (or next in sequence)

2. **New Yearly Member**
   - Register with "Yearly (Student)" or "Yearly (Passout)"
   - Should get: YL001 (or next in sequence)

3. **New 5-Yearly Member**
   - Register with "5-Yearly (Student)" or "5-Yearly (Passout)"
   - Should get: 5YL001 (or next in sequence)

4. **Sequential Numbers**
   - Register multiple Yearly members
   - Should get: YL001, YL002, YL003...

5. **Different Types Don't Interfere**
   - Register: Lifetime (gets LM001)
   - Register: Yearly (gets YL001, not YL002)
   - Each type has independent sequence

## Admin Panel

- Admin can see the auto-generated membership number
- Admin can manually change it if needed (in edit dialog)
- But new registrations will always auto-generate

## Benefits

✅ **Consistent Format**: All numbers follow same pattern
✅ **No Duplicates**: System ensures unique numbers
✅ **Easy Identification**: Prefix shows membership type at a glance
✅ **Sequential**: No gaps, easy to track
✅ **Automatic**: No manual work required

## Notes

- Membership numbers are assigned when payment is completed
- If user already has a membership number, it won't be changed
- Admin can manually assign/change numbers if needed
- The prefix is determined by the membership type name, not the payment type (Student/Passout)

## Next Steps

**Restart your backend** to apply changes:
```bash
cd Boa-Org/backend
# Stop backend (Ctrl+C)
npm start
```

Then test by creating new memberships and checking the auto-generated numbers!
