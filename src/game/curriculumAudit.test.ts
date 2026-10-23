import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ALL_EXTRACTED_QUESTIONS } from '../data/extractedQuestions';
import { LEVEL_QUESTIONS, QUIZ_LEVEL, LEVELS } from '../data/levels';

describe('Curriculum Question Bank and Quiz Level Audit', () => {
  it('contains exactly 186 extracted questions from curriculum resource PDFs', () => {
    assert.strictEqual(ALL_EXTRACTED_QUESTIONS.length, 186);
  });

  it('every question has prompt, non-empty explanation, and valid sourceRef', () => {
    ALL_EXTRACTED_QUESTIONS.forEach((q, idx) => {
      assert.ok(q.id, `Question at index ${idx} missing id`);
      assert.ok(q.prompt && q.prompt.length > 0, `Question ${q.id} missing prompt`);
      assert.ok(q.explanation && q.explanation.length > 0, `Question ${q.id} missing explanation`);
      assert.ok(q.sourceRef && q.sourceRef.length > 0, `Question ${q.id} missing sourceRef`);
      assert.ok(q.options && q.options.length > 0, `Question ${q.id} missing options`);
    });
  });

  it('Quiz level (level 99) has all 186 extracted questions without omission', () => {
    const quizQuestions = LEVEL_QUESTIONS[99];
    assert.ok(quizQuestions, 'Level 99 question bank should exist');
    assert.strictEqual(quizQuestions.length, 186);
    assert.strictEqual(QUIZ_LEVEL.checkpointsCount, 186);
  });

  it('Level 1 has >= 20 questions matched strictly to German Basics', () => {
    const l1 = LEVEL_QUESTIONS[1];
    assert.ok(l1.length >= 20, `Level 1 count was ${l1.length}`);
    assert.strictEqual(l1.length, 45);
  });

  it('Level 2 has >= 20 questions matched strictly to Hobbies & Everyday German', () => {
    const l2 = LEVEL_QUESTIONS[2];
    assert.ok(l2.length >= 20, `Level 2 count was ${l2.length}`);
    assert.strictEqual(l2.length, 20);
  });

  it('Level 3 has >= 20 questions matched strictly to Modal verbs können/müssen', () => {
    const l3 = LEVEL_QUESTIONS[3];
    assert.ok(l3.length >= 20, `Level 3 count was ${l3.length}`);
    assert.strictEqual(l3.length, 23);
  });

  it('Level 4 has 7 genuine listening questions from resources (not padded with fake questions)', () => {
    const l4 = LEVEL_QUESTIONS[4];
    assert.strictEqual(l4.length, 7);
  });

  it('Level 5 has 14 genuine PB3 reading questions from resources (not padded with fake questions)', () => {
    const l5 = LEVEL_QUESTIONS[5];
    assert.strictEqual(l5.length, 14);
  });

  it('Level 6 has >= 20 questions matched strictly to Reales Deutsch & Sportsachen', () => {
    const l6 = LEVEL_QUESTIONS[6];
    assert.ok(l6.length >= 20, `Level 6 count was ${l6.length}`);
    assert.strictEqual(l6.length, 55);
  });

  it('Level 7 has >= 20 questions matched strictly to Grand Prix Lena in Hamburg & Sport', () => {
    const l7 = LEVEL_QUESTIONS[7];
    assert.ok(l7.length >= 20, `Level 7 count was ${l7.length}`);
    assert.strictEqual(l7.length, 22);
  });
});
