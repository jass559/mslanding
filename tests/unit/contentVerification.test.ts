import { describe, expect, it } from 'vitest';

import {
  findVisibleBlocksOutsideFixture,
  validateContentFixture,
  verifyContentFixture,
} from '../../scripts/contentVerification';
import { Content_Fixture } from '../../client/src/content/contentFixture';

describe('Content_Fixture build verification', () => {
  it('accepts the approved fixture and all required content blocks', () => {
    expect(validateContentFixture(Content_Fixture)).toEqual([]);
  });

  it('reports a missing required fixture entry', () => {
    const fixture = structuredClone(Content_Fixture) as Record<string, any>;
    delete fixture.contact.form.submitLabel;

    expect(validateContentFixture(fixture)).toContain(
      'contact.form.submitLabel is required.',
    );
  });

  it('reports a fixture entry with the wrong runtime structure', () => {
    const fixture = structuredClone(Content_Fixture) as Record<string, any>;
    fixture.contact.form.labels = 'contact fields';

    expect(validateContentFixture(fixture)).toContain(
      'contact.form.labels must be an object.',
    );
  });

  it('rejects literal visible JSX blocks outside the fixture source', () => {
    const violations = findVisibleBlocksOutsideFixture([
      {
        filePath: 'client/src/pages/HomePage.tsx',
        source: '<section><h1>Texto fuera del fixture</h1></section>',
      },
    ]);

    expect(violations).toEqual([
      expect.objectContaining({
        filePath: 'client/src/pages/HomePage.tsx',
        kind: 'jsx-text',
        text: 'Texto fuera del fixture',
      }),
    ]);
  });

  it('rejects conditional literal copy in JSX expressions', () => {
    const violations = findVisibleBlocksOutsideFixture([
      {
        filePath: 'client/src/pages/HomePage.tsx',
        source: '<section><p>{ready ? \'Texto fuera del fixture\' : null}</p></section>',
      },
    ]);

    expect(violations).toEqual([
      expect.objectContaining({
        kind: 'jsx-expression',
        text: 'Texto fuera del fixture',
      }),
    ]);
  });

  it('ignores structural JSX expressions while checking visible copy', () => {
    const violations = findVisibleBlocksOutsideFixture([
      {
        filePath: 'client/src/pages/HomePage.tsx',
        source:
          '<section className={open ? "expanded" : "collapsed"} aria-live={open ? "polite" : "off"}><p>{open ? \'Texto fuera del fixture\' : null}</p></section>',
      },
    ]);

    expect(violations).toEqual([
      expect.objectContaining({
        kind: 'jsx-expression',
        text: 'Texto fuera del fixture',
      }),
    ]);
  });

  it('blocks an explicit verification run while approved copy is unavailable', () => {
    expect(() =>
      verifyContentFixture({
        rootDir: process.cwd(),
        approvedPageCopyAvailable: false,
      }),
    ).toThrow(/CONTENT_SOURCE_STATUS\.approvedPageCopyAvailable must be true/);
  });
});
