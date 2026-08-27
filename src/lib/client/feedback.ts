export function initFeedbackWidget(): void {
  const yesBtn = document.getElementById('feedback-yes');
  const noBtn = document.getElementById('feedback-no');
  const promptContainer = document.getElementById('feedback-prompt');
  const ack = document.getElementById('feedback-ack');

  if (!promptContainer || !ack) return;

  const handleFeedback = () => {
    promptContainer.classList.add('hidden');
    ack.classList.remove('hidden');
    ack.classList.add('flex');
  };

  yesBtn?.addEventListener('click', handleFeedback);
  noBtn?.addEventListener('click', handleFeedback);
}