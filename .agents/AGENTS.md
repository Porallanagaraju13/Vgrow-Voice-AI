# Project Rules

## AI Hallucinations
- **Zero Tolerance for Hallucinations**: When writing prompts for Voice AI agents or chatbots, ALWAYS include strict rules instructing the model to NEVER hallucinate tool calls or data.
- **Forced Tool Execution**: The AI must actually execute function calls (like `book_appointment` or `get_business_info`) instead of verbally confirming them without backend execution. Include warnings in the prompt such as: "You MUST ACTUALLY execute the tool! Do not just say you did it."
