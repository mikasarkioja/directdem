import { describe, it, expect } from 'vitest';

describe('Matemaattiset perustestit', () => {
  it('summan laskeminen onnistuu', () => {
    expect(1 + 2).toBe(3);
  });
});

describe('Ympäristön varmistus', () => {
  it('jsdom on aktiivinen', () => {
    const element = document.createElement('div');
    element.innerHTML = 'Hello DirectDem';
    expect(element.innerHTML).toBe('Hello DirectDem');
  });
});


