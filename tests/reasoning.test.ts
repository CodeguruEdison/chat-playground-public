import { ChatPage } from './pages/chat';
import { test, expect } from '@playwright/test';

test.describe('chat activity with reasoning', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.createNewChat();
  });

  test.skip('send user message and generate response with reasoning', async () => {
    await chatPage.sendUserMessage('Why is the sky blue?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain("The sky appears blue because of Rayleigh scattering");

    expect(assistantMessage.reasoning).toBe(
      'The sky is blue because of rayleigh scattering!',
    );
  });

  test.skip('toggle reasoning visibility', async () => {
    await chatPage.sendUserMessage('Why is the sky blue?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    const reasoningElement =
      assistantMessage.element.getByTestId('message-reasoning');
    expect(reasoningElement).toBeVisible();

    await assistantMessage.toggleReasoningVisibility();
    await expect(reasoningElement).not.toBeVisible();

    await assistantMessage.toggleReasoningVisibility();
    await expect(reasoningElement).toBeVisible();
  });

  test.skip('edit message and resubmit', async () => {
    await chatPage.sendUserMessage('Why is the sky blue?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    const reasoningElement =
      assistantMessage.element.getByTestId('message-reasoning');
    expect(reasoningElement).toBeVisible();

    const userMessage = await chatPage.getRecentUserMessage();

    await userMessage.edit('Why is grass green?');
    await chatPage.isGenerationComplete();

    const updatedAssistantMessage = await chatPage.getRecentAssistantMessage();

    expect(updatedAssistantMessage.content).toContain("Grass is green because it contains chlorophyll");

    expect(updatedAssistantMessage.reasoning).toBe(
      'Grass is green because of chlorophyll absorption!',
    );
  });
});
