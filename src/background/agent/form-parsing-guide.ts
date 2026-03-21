/**
 * Form Error Parsing Guide
 * Improved system prompt instructions for reading and responding to form validation messages
 */

export const FORM_PARSING_INSTRUCTIONS = `
# Form Validation & Error Handling

When interacting with forms, be aware of validation error messages. These may appear in several locations:

## Common Error Locations:
1. **Inline field errors**: Red text below/next to the input field
2. **Toast/Alert messages**: Pop-ups at the top/bottom of the page
3. **Error summary**: List of errors near the form top
4. **Input aria-invalid**: Check input element's aria-invalid="true" attribute
5. **Placeholder text**: Sometimes shows "This field is required" type messages

## Detection Strategy:
- Always take a snapshot after form submission or when you think an error occurred
- Look for:
  - Red colored text (usually #e53e3e, #dc2626, or similar)
  - Text containing: "error", "invalid", "required", "must", "please"
  - Elements with role="alert" or aria-live="polite"
  - Changed input styles (red border, background)

## Response to Errors:
1. **First occurrence**: Take a fresh snapshot to see the error message clearly
2. **Extract the message**: Use get_page_content or evaluate_script to extract exact error text
3. **Parse requirements**: Identify what the field needs:
   - Format errors: "Email must contain @"
   - Length errors: "Password must be 8+ characters"
   - Type errors: "Please enter a valid number"
   - Required: "This field is required"
4. **Fix and retry**: Correct the input and submit again
5. **Max 3 attempts**: If form keeps rejecting after 3 attempts, report the issue to user

## Common Patterns to Look For:
- "Invalid [field]" → Check field format/content
- "Required" → Field cannot be empty
- "Already exists/taken" → Value already in system
- "Does not match" → Password confirmation, matching fields
- "Too short/long" → Length constraint violation
- "Invalid format" → Expected specific format (email, phone, etc.)

## Example Commands:
\`\`\`
// Find all error messages on page
evaluate_script("Array.from(document.querySelectorAll('[role=alert], [color=error], .error')).map(e => e.textContent)")

// Check input validity
evaluate_script("document.getElementById('fieldName').validity.valid")

// Get all aria-invalid elements
evaluate_script("Array.from(document.querySelectorAll('[aria-invalid=true]')).map(e => ({name: e.name, value: e.value}))")
\`\`\`

## Never:
- Ignore validation errors and keep submitting
- Modify form HTML to bypass validation
- Submit incomplete forms expecting backend to handle
- Click submit more than once if disabled
`

/**
 * Enhanced system prompt suffix for form handling
 */
export function getFormHandlingInstructions(): string {
  return `

## Form Interaction Best Practices:

${FORM_PARSING_INSTRUCTIONS}

When a form submission fails:
1. DON'T retry immediately - take a snapshot first to read the error
2. DON'T assume the error is obvious - extract the exact message
3. DO examine the field carefully for constraints
4. DO use evaluate_script to read aria-invalid and validation messages if snapshot doesn't show them clearly
5. DO report the specific error message to the user if you can't fix it

Remember: Form validation errors are information about what the form needs. Read them carefully before retrying.
`
}
