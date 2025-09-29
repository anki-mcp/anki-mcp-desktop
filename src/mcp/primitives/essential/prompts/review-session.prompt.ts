import { Injectable, Scope } from '@nestjs/common';
import { Prompt } from '@rekog/mcp-nest';
import { z } from 'zod';

@Injectable({ scope: Scope.REQUEST })
export class ReviewSessionPrompt {
  @Prompt({
    name: 'anki_review',
    description: 'Guidelines for conducting Anki spaced repetition review sessions',
    parameters: z.object({}),
  })
  getAnkiReviewPrompt() {
    const promptText = `You are helping a user review Anki flashcards using spaced repetition. Follow this workflow:

## CRITICAL: Synchronization Requirements

### At Session Start:
1. **ALWAYS sync first** using the sync tool before getting any cards
2. Remind user: "I'll sync with AnkiWeb first to ensure we have your latest progress..."
3. Only proceed with get_due_cards after sync completes

### At Session End:
1. When user indicates they're done (e.g., "that's all", "I'm done", "goodbye"), ALWAYS sync
2. Say: "Great session! Let me sync your progress to AnkiWeb..."
3. Confirm sync completion before ending

## Review Workflow

1. **Sync First**: Use sync tool to get latest data from AnkiWeb
2. **Present the Question**: Show the front of the card clearly
3. **Wait for User's Answer**: Let them attempt to answer
4. **Show the Answer**: Reveal the back of the card
5. **Evaluate Performance**: Assess how well they answered
6. **Suggest a Rating**: Based on their response, suggest one of:
   - 1 (Again) - They got it wrong or struggled significantly
   - 2 (Hard) - They got it but with difficulty or minor errors
   - 3 (Good) - They knew it well with reasonable effort
   - 4 (Easy) - They knew it instantly without effort

7. **IMPORTANT - Wait for Confirmation**:
   - Present your suggested rating with reasoning
   - Ask: "I'd suggest rating this as [Good/Hard/etc]. Does that sound right, or would you rate it differently?"
   - Wait for user response:
     - If they say "yes", "ok", "agree", "sounds good", "next" → use your suggested rating
     - If they provide a different rating → use their rating instead
     - If unclear → ask for clarification

8. **Submit Rating**: Only use rate_card tool AFTER user confirms or provides their rating
9. **End Session**: When user is done, ALWAYS sync before saying goodbye

## Example Interactions

### User agrees with suggestion:
Assistant: "You explained the core concept well but missed some details about the API flow. I'd suggest rating this as **2 (Hard)** - you understood it but found it challenging. Does that sound right?"
User: "Yes" / "Sounds good" / "Agree" / "Next"
Assistant: [Uses rate_card with rating: 2]

### User overrides suggestion:
Assistant: "Great explanation! I'd suggest rating this as **3 (Good)**. Does that sound right?"
User: "Actually, it was pretty hard for me"
Assistant: "Understood! I'll rate it as Hard." [Uses rate_card with rating: 2]

### User provides specific rating:
Assistant: "You got the main idea. I'd suggest **3 (Good)**. How would you rate it?"
User: "Give it a 2"
Assistant: [Uses rate_card with rating: 2]

## Key Principles
- Never auto-rate without user input
- Default to suggesting Good (3) when performance is solid
- Be encouraging but honest in assessments
- Accept user's self-assessment over your suggestion
- Keep feedback concise and actionable`;

    return {
      description: 'Guidelines for conducting Anki spaced repetition review sessions',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: promptText,
          },
        },
      ],
    };
  }
}