import { describe, expect, it } from 'vitest';
import { esc } from './html';

describe('esc', () => {
  it('escapa & < > e aspas', () => {
    expect(esc(`a & b <i> "c"`)).toBe('a &amp; b &lt;i&gt; &quot;c&quot;');
  });
  it('mantém texto comum', () => {
    expect(esc('Sequência para soltar')).toBe('Sequência para soltar');
  });
});
