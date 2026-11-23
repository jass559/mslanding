import { describe, expect, it } from 'vitest';

import { App } from '../client/src/app/App';
import { createApp } from '../server/src/index';

describe('initial application scaffold', () => {
  it('exposes the React entry component', () => {
    expect(App).toBeTypeOf('function');
  });

  it('creates the Express application without listening', () => {
    expect(createApp()).toBeDefined();
  });
});
