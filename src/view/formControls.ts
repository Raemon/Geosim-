export function labelledRow(text: string, control: HTMLElement): HTMLLabelElement {
  const label = document.createElement('label');
  label.append(text, control);
  return label;
}

export function fieldset(legendText: string, ...children: HTMLElement[]): HTMLFieldSetElement {
  const group = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = legendText;
  group.append(legend, ...children);
  return group;
}

export function selector(
  options: readonly string[],
  selected: string,
  onChange: (value: string) => void,
): HTMLSelectElement {
  const select = document.createElement('select');
  for (const option of options) {
    const item = document.createElement('option');
    item.value = option;
    item.textContent = option;
    select.append(item);
  }
  select.value = selected;
  select.addEventListener('change', () => onChange(select.value));
  return select;
}

export function numberField(value: number, onCommit: (value: number) => void): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'number';
  input.value = String(value);
  input.size = 6;
  input.addEventListener('change', () => onCommit(Number(input.value)));
  return input;
}

export function button(text: string, onClick: () => void): HTMLButtonElement {
  const element = document.createElement('button');
  element.textContent = text;
  element.addEventListener('click', onClick);
  return element;
}

export function row(...children: HTMLElement[]): HTMLDivElement {
  const element = document.createElement('div');
  element.className = 'buttons';
  element.append(...children);
  return element;
}
