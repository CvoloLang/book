import { readFieldRows, orderFields, type FieldControl, type FieldRow } from './field-editor.ts';
import { getControls } from './model.ts';

function escape(value: string) {
  return value.replace(/[&<>"']/g,(char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]!);
}

function labels(ru: boolean) {
  return ru ? {name:'Имя поля',type:'Тип',up:'Переместить вверх',down:'Переместить вниз',remove:'Удалить поле',
    add:'Добавить поле',optimize:'Упорядочить по выравниванию',reset:'Сбросить',invalid:'Допустимы уникальные идентификаторы до 24 символов.'}
    : {name:'Field name',type:'Type',up:'Move up',down:'Move down',remove:'Remove field',
      add:'Add field',optimize:'Order by alignment',reset:'Reset',invalid:'Use unique identifiers of up to 24 characters.'};
}

function icon(action: string) {
  const paths: Record<string,string> = {
    up:'M12 19V5m-6 6 6-6 6 6',down:'M12 5v14m-6-6 6 6 6-6',
    remove:'M5 12h14',add:'M12 5v14M5 12h14'
  };
  return '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + paths[action] + '"/></svg>';
}

function rowsHtml(control: FieldControl, rows: FieldRow[], ru: boolean) {
  const l = labels(ru);
  return rows.map((row,index) => {
    function button(action: 'up'|'down'|'remove',disabled: boolean) {
      return '<button type="button" data-field-action="' + action + '" aria-label="' + l[action] + '" title="' + l[action] + '"' + (disabled?' disabled':'') + '>' + icon(action) + '</button>';
    }
    return '<div class="book-field-row" data-field-row="' + index + '">' +
      '<input type="text" maxlength="24" autocomplete="off" spellcheck="false" data-field-name aria-label="' + l.name + ' ' + (index+1) + '" value="' + escape(row.name) + '">' +
      '<div class="book-field-types" role="group" aria-label="' + l.type + ' ' + (index+1) + '">' +
      control.types.map((type) => '<button type="button" data-field-action="type" data-field-type="' + escape(type.name) + '" aria-pressed="' + (row.type===type.name) + '" title="' + type.size + ' B · Align ' + type.alignment + '">' + escape(type.name) + '</button>').join('') +
      '</div><div class="book-field-row-actions">' + button('up',index===0) + button('down',index===rows.length-1) + button('remove',rows.length===1) + '</div></div>';
  }).join('');
}

export function renderFieldEditor(control: FieldControl,ru: boolean) {
  const l = labels(ru);
  return '<fieldset class="book-diagram-control book-field-editor" data-diagram-field-editor="' + escape(control.id) + '" data-field-locale="' + (ru?'ru':'en') + '"><legend>' + escape(control.label) + '</legend>' +
    '<input type="hidden" data-diagram-control="' + escape(control.id) + '" data-field-state value="' + escape(JSON.stringify(control.default)) + '">' +
    '<div class="book-field-rows" data-field-rows>' + rowsHtml(control,control.default,ru) + '</div>' +
    '<div class="book-field-actions"><button type="button" data-field-action="add"' + (control.default.length>=control.maxFields?' disabled':'') + '>' + icon('add') + escape(l.add) + '</button>' +
    '<button type="button" data-field-action="optimize">' + escape(l.optimize) + '</button><button type="button" data-field-action="reset">' + escape(l.reset) + '</button></div>' +
    '<div role="status" data-field-status></div></fieldset>';
}

export function enhanceFieldEditors(container: HTMLElement) {
  function context(target: Element) {
    const editor = target.closest<HTMLElement>('[data-diagram-field-editor]');
    const figure = editor?.closest<HTMLElement>('[data-diagram-source]');
    const state = editor?.querySelector<HTMLInputElement>('[data-field-state]');
    if (!editor || !figure?.dataset.diagramSource || !state || !container.contains(editor)) return;
    const control = getControls(figure.dataset.diagramSource).find((item) => item.id === editor.dataset.diagramFieldEditor);
    if (!control || control.kind !== 'fields') return;
    return {editor,state,control,rows:readFieldRows(control,JSON.parse(state.value)),ru:editor.dataset.fieldLocale==='ru'};
  }

  function publish(ctx: NonNullable<ReturnType<typeof context>>, rows: FieldRow[], refresh: boolean) {
    const validated = readFieldRows(ctx.control,rows);
    ctx.state.value = JSON.stringify(validated);
    if (refresh) {
      const list = ctx.editor.querySelector<HTMLElement>('[data-field-rows]');
      if (list) list.innerHTML = rowsHtml(ctx.control,validated,ctx.ru);
      const add = ctx.editor.querySelector<HTMLButtonElement>('[data-field-action="add"]');
      if (add) add.disabled = validated.length >= ctx.control.maxFields;
    }
    const status = ctx.editor.querySelector<HTMLElement>('[data-field-status]');
    if (status) status.textContent = '';
    ctx.state.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function onNameInput(event: Event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.hasAttribute('data-field-name')) return;
    const ctx = context(input);
    if (!ctx) return;
    const index = Number(input.closest<HTMLElement>('[data-field-row]')?.dataset.fieldRow);
    if (!ctx.rows[index]) return;
    const rows = ctx.rows.map((row,i) => i===index?{...row,name:input.value}:row);
    try { publish(ctx,rows,false); input.removeAttribute('aria-invalid'); }
    catch {
      input.setAttribute('aria-invalid','true');
      if (event.type === 'change') { input.value = ctx.rows[index].name; input.removeAttribute('aria-invalid'); }
      const status = ctx.editor.querySelector<HTMLElement>('[data-field-status]');
      if (status) status.textContent = labels(ctx.ru).invalid;
    }
  }

  function onClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('[data-field-action]');
    if (!button || button.disabled) return;
    const ctx = context(button);
    if (!ctx) return;
    let rows = ctx.rows;
    let index = Number(button.closest<HTMLElement>('[data-field-row]')?.dataset.fieldRow);
    const action = button.dataset.fieldAction;
    switch (action) {
      case 'add': {
        if (rows.length >= ctx.control.maxFields) return;
        let suffix=1;
        while (rows.some((row) => row.name==='Field'+suffix)) suffix++;
        rows.push({name:'Field'+suffix,type:ctx.control.types[0].name});
        index=rows.length-1;
        break;
      }
      case 'reset': rows=ctx.control.default; break;
      case 'optimize': rows=orderFields(ctx.control,rows); break;
      case 'type':
        if (!rows[index]) return;
        rows[index].type=button.dataset.fieldType ?? '';
        break;
      case 'remove':
        if (!rows[index] || rows.length===1) return;
        rows.splice(index,1);
        index=Math.min(index,rows.length-1);
        break;
      case 'up':
      case 'down': {
        const next=index+(action==='up'?-1:1);
        if (!rows[index] || !rows[next]) return;
        [rows[index],rows[next]]=[rows[next],rows[index]];
        index=next;
        break;
      }
      default: return;
    }
    publish(ctx,rows,true);
    if (Number.isInteger(index)) {
      const row=ctx.editor.querySelector<HTMLElement>('[data-field-row="'+index+'"]');
      const sameAction=action==='type'
        ? Array.from(row?.querySelectorAll<HTMLButtonElement>('[data-field-type]') ?? []).find((candidate)=>candidate.dataset.fieldType===button.dataset.fieldType)
        : row?.querySelector<HTMLButtonElement>('[data-field-action="'+action+'"]:not(:disabled)');
      (sameAction ?? row?.querySelector<HTMLInputElement>('[data-field-name]'))?.focus();
    }
  }
  container.addEventListener('input',onNameInput);
  container.addEventListener('change',onNameInput);
  container.addEventListener('click',onClick);
  return () => { container.removeEventListener('input',onNameInput); container.removeEventListener('change',onNameInput); container.removeEventListener('click',onClick); };
}
