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

function buildBasePrompt({ skillLine, level, formats, test, draft, struggling, category, sessionType, scoreSection }) {
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

  return `You are a ${isWriting ? 'writing' : 'math'} tutor assistant. Generate a student-facing practice worksheet.

Student-facing means: no answers, no answer key language, no meta-commentary about the worksheet appear in the WORKSHEET section. Keep each section cleanly separated.

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
NUMBER OF QUESTIONS: ${qty}
${testSection}${scoreSection || ''}${draftSection}${strugglingSection}
DIFFICULTY: ${difficultyLine}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULAR WORKFLOW — FOLLOW IN ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 0 — CLARIFY (MANDATORY — DO NOT SKIP)
• Before generating the worksheet, ask exactly 2 targeted clarifying questions.
• Questions must be specific and directly impact worksheet design (e.g., topic preference, reading length tolerance, timing, or test conditions).
• Do not generate any part of the worksheet until the user responds.
• If the user does not respond, ask again once. If still no response, proceed using defaults aligned with the student score.

STEP 1 — GENERATE QUESTIONS
• Generate all questions first, without answer choices or explanations.
• Questions must require active thinking — not just copying or filling in a word.
• Use realistic, college-level content (civic issues, workplace, academic writing, everyday scenarios).
• Do not invent sources or citations. Use placeholders if needed: [Source: peer-reviewed article on X].${testReq}
• When multiple questions share the same passage or source material, place that material once above the first question in the group with the header: "For questions [X–Y], use the following passage."

STEP 2 — PLAN DISTRACTORS (MULTIPLE CHOICE ONLY)
• For each MC question, before writing the answer choices:
  1. Identify the correct answer and why it is correct.
  2. Identify the specific error, misconception, or reasoning flaw each wrong answer will represent.
  3. No two distractors may stem from the same mistake.
  4. At least one distractor per question must be "second-best": it passes a quick read but is eliminated by a specific word, qualifier, or condition in the question or passage. Note what makes it wrong.
  5. Obvious tells are prohibited: the correct answer may not be the longest option, the most hedged option, or grammatically inconsistent with the question stem.
• Distribute correct answers across all option letters (A, B, C, D) throughout the worksheet. No letter may be correct more than twice consecutively.

STEP 3 — WRITE ANSWER CHOICES
• Write the answer choices for each MC question using the plan from Step 2.
• Assign the correct answer to a letter that maintains the required distribution.
• Ensure all options are parallel in structure and length where possible.

STEP 4 — INTERNAL AUDIT (STRICT — FIX BEFORE OUTPUTTING)
• Reconstruct the correct-answer sequence. Confirm no letter appears more than twice consecutively.
• Confirm no invented facts, sources, or citations appear anywhere.
• Confirm all questions match the skill(s) listed and the stated format.
• Confirm all distractors target distinct errors and at least one per MC question is genuinely second-best.
• Confirm shared passages or source material appear once above the first question in their group with a correct "For questions [X–Y]" header.
• Confirm total question count matches the requested quantity.
• Fix any failures before outputting. Do not include a visible audit section in the output.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — FINAL OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. WORKSHEET — student-facing questions only. No answers visible.
Close this section with: [Compliance: Worksheet — X questions, passage grouping applied Y/N, no answers visible Y/N]

2. ANSWER KEY — correct answer letter + one-sentence rule explanation per question. For MC, name the correct answer and explain in one sentence why each wrong answer is wrong.
Close this section with: [Compliance: Answer Key — X entries, rule named for each Y/N]

3. STUDY TIPS & SELF-CHECK — fits on up to two printed pages. Do not explain or teach the concept. Write directly to the student using "you" language.
   a. TIPS (3–5 items): One sentence each. Practical strategies for this specific skill only — what to do, look for, or try when stuck. No theory.
   b. SELF-CHECK (3–4 items): One sentence each. Questions the student asks themselves before submitting. Actionable and specific to this skill.
Close this section with: [Compliance: Study Tips — X tips, Y checklist items, student-facing language Y/N]

After all three sections, format the complete output as a Word document (.docx) and offer it for download.`;
}

function getScore() {
  const el = document.getElementById('score-input');
  return el ? el.value.trim() : '';
}

function buildScoreSection(scoreText, testConfig) {
  if (!scoreText) return '';
  return `\nSTUDENT SCORE: ${scoreText}
${testConfig.context}
Use this score to calibrate difficulty, prioritize the skill gaps most predictive of this score range, and weight question selection accordingly. If the score field is blank, rely on the skill level and difficulty settings above.\n`;
}
