// shared.js — common form logic for all worksheet prompt generator tool pages

let qty = 10;
let difficulty = 'mixed';

function setDifficulty(d) {
  difficulty = d;
  ['foundational','mixed','challenging'].forEach(v => {
    const el = document.getElementById('diff-' + v);
    if (el) el.classList.toggle('active', v === d);
  });
}

function changeQty(delta) {
  qty = Math.max(4, Math.min(20, qty + delta));
  document.getElementById('qty-display').textContent = qty;
}

function clearErr(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('error');
}

function getFormats() {
  return Array.from(document.querySelectorAll('.format-card.selected')).map(c => c.dataset.fmt);
}

function getLevel() {
  const sel = document.getElementById('select-level');
  const extra = document.getElementById('custom-level');
  const s = sel ? sel.value : '';
  const e = extra ? extra.value.trim() : '';
  if (!s) return e;
  return e ? `${s}; ${e}` : s;
}

function renderFormatCards(formats, gridId) {
  const grid = document.getElementById(gridId || 'format-grid');
  const hint = document.getElementById('format-hint');
  if (!grid) return;
  grid.innerHTML = '';
  if (!formats || !formats.length) {
    if (hint) hint.textContent = 'Select a skill above to see available formats.';
    return;
  }
  if (hint) hint.textContent = 'Select one or more.';
  const seen = new Set();
  formats.forEach((f, i) => {
    if (seen.has(f.fmt)) return;
    seen.add(f.fmt);
    const card = document.createElement('div');
    card.className = 'format-card' + (i === 0 ? ' selected' : '');
    card.dataset.fmt = f.fmt;
    card.onclick = () => {
      card.classList.toggle('selected');
      card.querySelector('.fc-check').textContent = card.classList.contains('selected') ? '✓' : '';
      clearErr('field-format');
    };
    card.innerHTML = `<div class="fc-top"><div class="fc-check">${i === 0 ? '✓' : ''}</div><div class="fc-name">${f.name}</div></div><div class="fc-desc">${f.desc}</div>`;
    grid.appendChild(card);
  });
  clearErr('field-format');
}

function toggleOtherSkills() {
  const section = document.getElementById('other-skills-section');
  const btn = document.getElementById('other-skills-btn');
  if (!section) return;
  const open = section.classList.toggle('open');
  if (btn) btn.textContent = open ? '▲ Hide other skills' : '▼ Other skills';
}

function buildOtherSkillsSection(skills, onChipClick) {
  const wrap = document.getElementById('other-skills-chips');
  if (!wrap) return;
  wrap.innerHTML = '';
  skills.forEach(s => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = s.label;
    chip.dataset.skill = s.skill;
    chip.onclick = () => onChipClick(chip);
    wrap.appendChild(chip);
  });
}

function copyPrompt() {
  const box = document.getElementById('prompt-output');
  const btn = document.getElementById('copy-btn');
  const hint = document.getElementById('copy-hint');
  if (!box) return;
  box.focus(); box.select(); box.setSelectionRange(0, 99999);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(box.value).then(() => {
      btn.textContent = '✓ Copied!'; btn.classList.add('copied');
      if (hint) hint.style.display = 'none';
      setTimeout(() => { btn.textContent = '📋 Copy Prompt'; btn.classList.remove('copied'); }, 2200);
    }).catch(() => {
      btn.textContent = '✓ Text selected'; btn.classList.add('copied');
      if (hint) hint.style.display = 'block';
      setTimeout(() => { btn.textContent = '📋 Copy Prompt'; btn.classList.remove('copied'); }, 3000);
    });
  } else {
    btn.textContent = '✓ Text selected'; btn.classList.add('copied');
    if (hint) hint.style.display = 'block';
    setTimeout(() => { btn.textContent = '📋 Copy Prompt'; btn.classList.remove('copied'); }, 3000);
  }
}

function showPrompt(promptText) {
  document.getElementById('empty-state').style.display = 'none';
  const box = document.getElementById('prompt-output');
  box.style.display = 'block';
  box.value = promptText;
  const btn = document.getElementById('copy-btn');
  btn.style.display = 'inline-flex';
  btn.textContent = '📋 Copy Prompt';
  btn.classList.remove('copied');
}

function buildBasePrompt({ skillLine, level, formats, test, draft, struggling, category, sessionType }) {
  const formatLine = formats.length === 1
    ? formats[0]
    : formats.slice(0, -1).join(', ') + ', and ' + formats[formats.length - 1];

  const testSection = test
    ? `\nTEST PREP TARGET: ${test}\nCalibrate question style, passage length, and difficulty to match this test's actual format and question stems.\n`
    : '';
  const draftSection = draft
    ? `\nSTUDENT'S DRAFT TEXT:\n"${draft}"\nBuild at least 3 questions directly around this text.\n`
    : '';
  const strugglingSection = struggling
    ? `\nSPECIFIC STRUGGLES:\n${struggling}\nPrioritize questions that directly address these patterns.\n`
    : '';
  const categoryLine = category ? `\nSKILL CATEGORY: ${category}` : '';

  const difficultyLine = {
    foundational: 'All questions should be foundational and confidence-building. Avoid tricky edge cases.',
    mixed: 'Progress from foundational questions to more challenging ones. Include a mix of difficulty.',
    challenging: 'Emphasize challenging questions and edge cases where the wrong answer is highly tempting.'
  }[difficulty];

  const testReq = test
    ? `\n• This is test prep for the ${test}. Questions must closely resemble actual test items in format, reading level, and question style.`
    : '';

  const isWriting = sessionType === 'writing';

  return `Before generating anything, ask me 2–3 clarifying questions about the student, their specific struggles, or their upcoming assessment. Wait for my answers before generating.

You are a ${isWriting ? 'writing' : 'math'} tutor assistant. Generate a student-facing practice worksheet. Do not complete the student's assignment or write answers on their behalf.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STUDENT SKILL LEVEL: ${level}
SESSION LENGTH: 60 minutes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORKSHEET DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${categoryLine}
SKILL(S): ${skillLine}
FORMAT: ${formatLine}
NUMBER OF QUESTIONS: ${qty} questions
${testSection}${draftSection}${strugglingSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Questions must require active thinking — not just copying or filling in a word.
• Multiple choice: one clearly correct answer and three plausible wrong answers, each failing for a specific stated reason.
• ${difficultyLine}
• Use realistic, college-level content (civic issues, workplace, academic writing, everyday scenarios).
• Do not invent sources or citations. Use placeholders if needed: [Source: peer-reviewed article on X].${testReq}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. WORKSHEET — student-facing questions only. No answers visible.

2. ANSWER KEY — correct answer + one-sentence rule explanation per question.

3. TUTOR TALK MOVES — 3–5 spoken questions tied to specific question numbers to prompt student thinking.

4. SELF-CHECK — confirm: no invented facts, no ghostwriting, all questions match the skill(s) listed. Flag anything uncertain.

After all four sections, produce a downloadable Word document (.docx) with clear headings for each section.`;
}
