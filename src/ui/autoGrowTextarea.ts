/** Resize a textarea to fit its content (no internal scrollbars). */
export function fitAutoGrowTextarea(el: HTMLTextAreaElement) {
  el.style.height = "0";
  el.style.height = `${el.scrollHeight}px`;
}

export function attachAutoGrowTextarea(el: HTMLTextAreaElement) {
  const onInput = () => fitAutoGrowTextarea(el);
  el.addEventListener("input", onInput);
  requestAnimationFrame(onInput);
  return onInput;
}

export function fitAutoGrowFields(root: ParentNode) {
  root.querySelectorAll<HTMLTextAreaElement>(".milestone-auto-grow").forEach((el) => {
    fitAutoGrowTextarea(el);
  });
}
