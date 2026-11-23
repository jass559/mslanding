import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

import {
  CONTENT_SOURCE_STATUS,
  Content_Fixture,
  COPY_SOURCE,
} from '../client/src/content/contentFixture';

const PUBLIC_PATHS = ['/', '/nosotros', '/servicios', '/faq', '/contacto'] as const;
const SOURCE_FIXTURE_PATH = 'client/src/content/contentFixture.ts';
const CONTENT_ATTRIBUTES = new Set(['alt', 'aria-label', 'aria-description', 'placeholder', 'title']);

type RecordValue = Record<string, unknown>;

export interface ContentVerificationOptions {
  rootDir?: string;
  fixture?: unknown;
  copySource?: unknown;
  unavailableBlocks?: readonly string[];
  approvedPageCopyAvailable?: boolean;
}

export interface VisibleBlockViolation {
  filePath: string;
  line: number;
  column: number;
  kind: 'jsx-text' | 'jsx-expression' | 'content-attribute';
  text: string;
}

export interface ContentVerificationResult {
  sourceFilesChecked: number;
  visibleBlockViolations: VisibleBlockViolation[];
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function objectWithExactKeys(
  value: unknown,
  path: string,
  expectedKeys: readonly string[],
  errors: string[],
): value is RecordValue {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return false;
  }

  const expected = new Set(expectedKeys);
  for (const key of expectedKeys) {
    if (!(key in value)) {
      errors.push(`${path}.${key} is required.`);
    }
  }

  for (const key of Object.keys(value)) {
    if (!expected.has(key)) {
      errors.push(`${path}.${key} is not part of the ContentFixture type.`);
    }
  }

  return true;
}

function isEmptyAllowed(
  _path: string,
  _unavailableBlocks: ReadonlySet<string>,
  _approvedPageCopyAvailable: boolean,
): boolean {
  // An unavailable source is a build blocker, not permission to publish blanks.
  return false;
}

function checkString(
  parent: RecordValue,
  key: string,
  path: string,
  errors: string[],
  emptyAllowed: boolean,
): void {
  if (!(key in parent)) {
    errors.push(`${path} is required.`);
    return;
  }

  const value = parent[key];
  if (typeof value !== 'string') {
    errors.push(`${path} must be a string.`);
    return;
  }

  if (!emptyAllowed && value.trim() === '') {
    errors.push(`${path} must contain an approved literal entry.`);
  }
}

function checkLiteral(
  parent: RecordValue,
  key: string,
  path: string,
  expected: string,
  errors: string[],
): void {
  checkString(parent, key, path, errors, false);
  if (parent[key] !== expected) {
    errors.push(`${path} must equal ${JSON.stringify(expected)}.`);
  }
}

function checkArray(
  parent: RecordValue,
  key: string,
  path: string,
  errors: string[],
  emptyAllowed: boolean,
): unknown[] | undefined {
  if (!(key in parent)) {
    errors.push(`${path} is required.`);
    return undefined;
  }

  const value = parent[key];
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return undefined;
  }

  if (!emptyAllowed && value.length === 0) {
    errors.push(`${path} must contain at least one required entry.`);
  }

  return value;
}

function checkPublicPath(parent: RecordValue, key: string, path: string, errors: string[]): void {
  checkString(parent, key, path, errors, false);
  const value = parent[key];
  if (
    typeof value === 'string' &&
    !PUBLIC_PATHS.includes(value as (typeof PUBLIC_PATHS)[number]) &&
    !/^https:\/\/wa\.me\/\d+$/.test(value)
  ) {
    errors.push(`${path} must be a canonical public path or WhatsApp URL.`);
  }
}

function checkCta(value: unknown, path: string, errors: string[]): void {
  if (!objectWithExactKeys(value, path, ['label', 'href'], errors)) {
    return;
  }

  checkString(value, 'label', `${path}.label`, errors, false);
  checkPublicPath(value, 'href', `${path}.href`, errors);
}

function checkNav(value: unknown, errors: string[]): void {
  if (
    !objectWithExactKeys(
      value,
      'nav',
      [
        'home',
        'about',
        'services',
        'faq',
        'contact',
        'items',
        'openMenuLabel',
        'closeMenuLabel',
        'mainNavLabel',
      ],
      errors,
    )
  ) {
    return;
  }

  const navFields = [
    ['home', 'Inicio'],
    ['about', 'Quiénes Somos'],
    ['services', 'Servicios'],
    ['faq', 'FAQ'],
    ['contact', 'Contacto'],
  ] as const;

  for (const [key, expectedLabel] of navFields) {
    checkString(value, key, `nav.${key}`, errors, false);
    if (value[key] !== expectedLabel) {
      errors.push(`nav.${key} must preserve the canonical navigation label.`);
    }
  }

  const items = checkArray(value, 'items', 'nav.items', errors, false);
  if (!items) {
    return;
  }

  if (items.length !== PUBLIC_PATHS.length) {
    errors.push('nav.items must contain exactly the five public navigation entries.');
  }

  items.forEach((item, index) => {
    const itemPath = `nav.items[${index}]`;
    if (!objectWithExactKeys(item, itemPath, ['label', 'href'], errors)) {
      return;
    }

    checkString(item, 'label', `${itemPath}.label`, errors, false);
    checkPublicPath(item, 'href', `${itemPath}.href`, errors);
    const expectedPath = PUBLIC_PATHS[index];
    if (item.href !== expectedPath) {
      errors.push(`${itemPath}.href must be ${JSON.stringify(expectedPath)}.`);
    }
  });

  checkString(value, 'openMenuLabel', 'nav.openMenuLabel', errors, false);
  checkString(value, 'closeMenuLabel', 'nav.closeMenuLabel', errors, false);
  checkString(value, 'mainNavLabel', 'nav.mainNavLabel', errors, false);
}

function checkHome(
  value: unknown,
  errors: string[],
  unavailableBlocks: ReadonlySet<string>,
  approvedPageCopyAvailable: boolean,
): void {
  if (
    !objectWithExactKeys(
      value,
      'home',
      [
        'hero',
        'proposition',
        'benefits',
        'featuredServices',
        'cta',
        'ctaTitle',
        'ctaDescription',
      ],
      errors,
    )
  ) {
    return;
  }

  if (objectWithExactKeys(
    value.hero,
    'home.hero',
    ['eyebrow', 'title', 'description', 'cta', 'secondaryCta'],
    errors,
  )) {
    checkString(value.hero, 'eyebrow', 'home.hero.eyebrow', errors, false);
    checkString(value.hero, 'title', 'home.hero.title', errors, false);
    checkString(
      value.hero,
      'description',
      'home.hero.description',
      errors,
      isEmptyAllowed('home.hero.description', unavailableBlocks, approvedPageCopyAvailable),
    );
    checkCta(value.hero.cta, 'home.hero.cta', errors);
    checkCta(value.hero.secondaryCta, 'home.hero.secondaryCta', errors);
  }

  checkString(
    value,
    'proposition',
    'home.proposition',
    errors,
    isEmptyAllowed('home.proposition', unavailableBlocks, approvedPageCopyAvailable),
  );

  const benefits = checkArray(
    value,
    'benefits',
    'home.benefits',
    errors,
    isEmptyAllowed('home.benefits', unavailableBlocks, approvedPageCopyAvailable),
  );
  benefits?.forEach((benefit, index) => {
    const path = `home.benefits[${index}]`;
    if (!objectWithExactKeys(benefit, path, ['id', 'title', 'description'], errors)) {
      return;
    }
    checkString(benefit, 'id', `${path}.id`, errors, false);
    checkString(benefit, 'title', `${path}.title`, errors, false);
    checkString(benefit, 'description', `${path}.description`, errors, false);
  });

  const featuredServices = checkArray(
    value,
    'featuredServices',
    'home.featuredServices',
    errors,
    isEmptyAllowed('home.featuredServices', unavailableBlocks, approvedPageCopyAvailable),
  );
  featuredServices?.forEach((service, index) => {
    const path = `home.featuredServices[${index}]`;
    if (!objectWithExactKeys(service, path, ['id', 'title', 'description', 'cta'], errors)) {
      return;
    }
    checkString(service, 'id', `${path}.id`, errors, false);
    checkString(service, 'title', `${path}.title`, errors, false);
    checkString(service, 'description', `${path}.description`, errors, false);
    checkCta(service.cta, `${path}.cta`, errors);
  });

  checkCta(value.cta, 'home.cta', errors);
  checkString(value, 'ctaTitle', 'home.ctaTitle', errors, false);
  checkString(value, 'ctaDescription', 'home.ctaDescription', errors, false);
}

function checkAbout(
  value: unknown,
  errors: string[],
  unavailableBlocks: ReadonlySet<string>,
  approvedPageCopyAvailable: boolean,
): void {
  if (!objectWithExactKeys(value, 'about', ['title', 'identity', 'history', 'values'], errors)) {
    return;
  }

  checkString(value, 'title', 'about.title', errors, false);
  checkString(
    value,
    'identity',
    'about.identity',
    errors,
    isEmptyAllowed('about.identity', unavailableBlocks, approvedPageCopyAvailable),
  );
  checkString(
    value,
    'history',
    'about.history',
    errors,
    isEmptyAllowed('about.history', unavailableBlocks, approvedPageCopyAvailable),
  );

  const values = checkArray(
    value,
    'values',
    'about.values',
    errors,
    isEmptyAllowed('about.values', unavailableBlocks, approvedPageCopyAvailable),
  );
  values?.forEach((item, index) => {
    const path = `about.values[${index}]`;
    if (!objectWithExactKeys(item, path, ['id', 'title', 'description'], errors)) {
      return;
    }
    checkString(item, 'id', `${path}.id`, errors, false);
    checkString(item, 'title', `${path}.title`, errors, false);
    checkString(item, 'description', `${path}.description`, errors, false);
  });
}

function checkServices(
  value: unknown,
  errors: string[],
  unavailableBlocks: ReadonlySet<string>,
  approvedPageCopyAvailable: boolean,
): void {
  if (!Array.isArray(value)) {
    errors.push('services must be an array.');
    return;
  }
  if (
    value.length === 0 &&
    !isEmptyAllowed('services', unavailableBlocks, approvedPageCopyAvailable)
  ) {
    errors.push('services must contain at least one required entry.');
  }

  value.forEach((service, index) => {
    const path = `services[${index}]`;
    if (!objectWithExactKeys(service, path, ['id', 'title', 'description', 'cta', 'ctaHref'], errors)) {
      return;
    }
    checkString(service, 'id', `${path}.id`, errors, false);
    checkString(service, 'title', `${path}.title`, errors, false);
    checkString(service, 'description', `${path}.description`, errors, false);
    checkString(service, 'cta', `${path}.cta`, errors, false);
    checkPublicPath(service, 'ctaHref', `${path}.ctaHref`, errors);
  });
}

function checkFaq(
  value: unknown,
  errors: string[],
  unavailableBlocks: ReadonlySet<string>,
  approvedPageCopyAvailable: boolean,
): void {
  if (!objectWithExactKeys(value, 'faq', ['title', 'items'], errors)) {
    return;
  }

  checkString(value, 'title', 'faq.title', errors, false);
  const items = checkArray(
    value,
    'items',
    'faq.items',
    errors,
    isEmptyAllowed('faq.items', unavailableBlocks, approvedPageCopyAvailable),
  );
  items?.forEach((item, index) => {
    const path = `faq.items[${index}]`;
    if (!objectWithExactKeys(item, path, ['id', 'question', 'answer'], errors)) {
      return;
    }
    checkString(item, 'id', `${path}.id`, errors, false);
    checkString(item, 'question', `${path}.question`, errors, false);
    checkString(item, 'answer', `${path}.answer`, errors, false);
  });
}

function checkContact(
  value: unknown,
  errors: string[],
  unavailableBlocks: ReadonlySet<string>,
  approvedPageCopyAvailable: boolean,
): void {
  if (
    !objectWithExactKeys(
      value,
      'contact',
      ['title', 'description', 'corporateData', 'channels', 'whatsappCta', 'form'],
      errors,
    )
  ) {
    return;
  }

  checkString(value, 'title', 'contact.title', errors, false);
  checkString(
    value,
    'description',
    'contact.description',
    errors,
    isEmptyAllowed('contact.description', unavailableBlocks, approvedPageCopyAvailable),
  );

  if (
    objectWithExactKeys(
      value.corporateData,
      'contact.corporateData',
      [
        'companyName',
        'whatsappLabel',
        'whatsappNumber',
        'whatsappDisplay',
        'whatsappUrl',
        'schedule',
      ],
      errors,
    )
  ) {
    checkString(value.corporateData, 'companyName', 'contact.corporateData.companyName', errors, false);
    checkString(value.corporateData, 'whatsappLabel', 'contact.corporateData.whatsappLabel', errors, false);
    checkString(value.corporateData, 'whatsappNumber', 'contact.corporateData.whatsappNumber', errors, false);
    checkString(value.corporateData, 'whatsappDisplay', 'contact.corporateData.whatsappDisplay', errors, false);
    checkString(value.corporateData, 'whatsappUrl', 'contact.corporateData.whatsappUrl', errors, false);
    checkString(value.corporateData, 'schedule', 'contact.corporateData.schedule', errors, false);
    if (value.corporateData.whatsappUrl !== 'https://wa.me/584162459941') {
      errors.push('contact.corporateData.whatsappUrl must preserve the canonical WhatsApp URL.');
    }
  }

  const channels = checkArray(value, 'channels', 'contact.channels', errors, false);
  channels?.forEach((channel, index) => {
    const path = `contact.channels[${index}]`;
    if (!objectWithExactKeys(channel, path, ['label', 'href'], errors)) {
      return;
    }
    checkString(channel, 'label', `${path}.label`, errors, false);
    checkString(channel, 'href', `${path}.href`, errors, false);
    if (typeof channel.href === 'string' && !/^https:\/\/wa\.me\/\d+$/.test(channel.href)) {
      errors.push(`${path}.href must be a WhatsApp URL.`);
    }
  });

  checkCta(value.whatsappCta, 'contact.whatsappCta', errors);

  if (
    objectWithExactKeys(
      value.form,
      'contact.form',
      [
        'title',
        'helperText',
        'labels',
        'serviceOptions',
        'requiredFields',
        'optionalFields',
        'requiredMarker',
        'optionalLabel',
        'submitLabel',
        'submittingLabel',
        'successMessage',
      ],
      errors,
    )
  ) {
    checkString(value.form, 'title', 'contact.form.title', errors, false);
    checkString(value.form, 'helperText', 'contact.form.helperText', errors, false);
    checkString(value.form, 'requiredMarker', 'contact.form.requiredMarker', errors, false);
    checkString(value.form, 'optionalLabel', 'contact.form.optionalLabel', errors, false);
    checkString(value.form, 'submittingLabel', 'contact.form.submittingLabel', errors, false);
    checkString(value.form, 'successMessage', 'contact.form.successMessage', errors, false);

    if (!Array.isArray(value.form.serviceOptions)) {
      errors.push('contact.form.serviceOptions must be an array.');
    } else if (value.form.serviceOptions.length === 0) {
      errors.push('contact.form.serviceOptions must contain at least one required entry.');
    } else {
      value.form.serviceOptions.forEach((option: unknown, index: number) => {
        if (typeof option !== 'string' || option.trim() === '') {
          errors.push(`contact.form.serviceOptions[${index}] must contain an approved literal entry.`);
        }
      });
    }

    if (
      objectWithExactKeys(
        value.form.labels,
        'contact.form.labels',
        ['fullName', 'email', 'phone', 'service', 'message'],
        errors,
      )
    ) {
      for (const field of ['fullName', 'email', 'phone', 'service', 'message']) {
        checkString(value.form.labels, field, `contact.form.labels.${field}`, errors, false);
      }
    }

    checkString(
      value.form,
      'submitLabel',
      'contact.form.submitLabel',
      errors,
      isEmptyAllowed('contact.form.submitLabel', unavailableBlocks, approvedPageCopyAvailable),
    );

    if (!Array.isArray(value.form.requiredFields)) {
      errors.push('contact.form.requiredFields must be an array.');
    } else if (
      JSON.stringify(value.form.requiredFields) !==
      JSON.stringify(['fullName', 'email', 'service', 'message'])
    ) {
      errors.push('contact.form.requiredFields must preserve the canonical field order.');
    }

    if (!Array.isArray(value.form.optionalFields)) {
      errors.push('contact.form.optionalFields must be an array.');
    } else if (JSON.stringify(value.form.optionalFields) !== JSON.stringify(['phone'])) {
      errors.push('contact.form.optionalFields must preserve phone as the only optional field.');
    }
  }
}

function checkFooter(value: unknown, errors: string[], unavailableBlocks: ReadonlySet<string>, approvedPageCopyAvailable: boolean): void {
  if (!objectWithExactKeys(
    value,
    'footer',
    ['companyName', 'links', 'description', 'navLabel'],
    errors,
  )) {
    return;
  }

  checkString(value, 'companyName', 'footer.companyName', errors, false);
  checkString(
    value,
    'description',
    'footer.description',
    errors,
    isEmptyAllowed('footer.description', unavailableBlocks, approvedPageCopyAvailable),
  );
  checkString(value, 'navLabel', 'footer.navLabel', errors, false);

  const links = checkArray(value, 'links', 'footer.links', errors, false);
  links?.forEach((link, index) => {
    const path = `footer.links[${index}]`;
    if (!objectWithExactKeys(link, path, ['label', 'href'], errors)) {
      return;
    }
    checkString(link, 'label', `${path}.label`, errors, false);
    checkPublicPath(link, 'href', `${path}.href`, errors);
  });
}

function checkMessages(value: unknown, errors: string[]): void {
  if (!objectWithExactKeys(value, 'messages', ['api', 'formStates'], errors)) {
    return;
  }

  const apiMessages = {
    contactCreated: 'CONTACT_CREATED',
    validationError: 'VALIDATION_ERROR',
    methodNotAllowed: 'METHOD_NOT_ALLOWED',
    rateLimited: 'RATE_LIMITED',
    persistenceError: 'PERSISTENCE_ERROR',
    internalError: 'INTERNAL_ERROR',
  } as const;
  if (objectWithExactKeys(value.api, 'messages.api', Object.keys(apiMessages), errors)) {
    for (const [key, expected] of Object.entries(apiMessages)) {
      checkLiteral(value.api, key, `messages.api.${key}`, expected, errors);
    }
  }

  const formStates = {
    idle: 'idle',
    editing: 'editing',
    validating: 'validating',
    submitting: 'submitting',
    validationError: 'validationError',
    serverError: 'serverError',
    networkError: 'networkError',
    success: 'success',
  } as const;
  if (objectWithExactKeys(value.formStates, 'messages.formStates', Object.keys(formStates), errors)) {
    for (const [key, expected] of Object.entries(formStates)) {
      checkLiteral(value.formStates, key, `messages.formStates.${key}`, expected, errors);
    }
  }
}

/**
 * Validates the runtime shape and required entries of the typed fixture.
 * Empty blocks always fail the completeness gate. The explicit source-status
 * flag is checked by verifyContentFixture so unavailable copy cannot be shipped.
 */
export function validateContentFixture(
  fixture: unknown,
  options: Omit<ContentVerificationOptions, 'rootDir' | 'fixture'> = {},
): string[] {
  const errors: string[] = [];
  const unavailableBlocks = new Set(
    options.unavailableBlocks ?? CONTENT_SOURCE_STATUS.unavailableBlocks,
  );
  const approvedPageCopyAvailable =
    options.approvedPageCopyAvailable ?? CONTENT_SOURCE_STATUS.approvedPageCopyAvailable;

  if (!objectWithExactKeys(
    fixture,
    'Content_Fixture',
    ['brand', 'nav', 'home', 'about', 'services', 'faq', 'contact', 'footer', 'messages'],
    errors,
  )) {
    return errors;
  }

  checkString(fixture, 'brand', 'brand', errors, false);
  checkNav(fixture.nav, errors);
  checkHome(fixture.home, errors, unavailableBlocks, approvedPageCopyAvailable);
  checkAbout(fixture.about, errors, unavailableBlocks, approvedPageCopyAvailable);
  checkServices(fixture.services, errors, unavailableBlocks, approvedPageCopyAvailable);
  checkFaq(fixture.faq, errors, unavailableBlocks, approvedPageCopyAvailable);
  checkContact(fixture.contact, errors, unavailableBlocks, approvedPageCopyAvailable);
  checkFooter(fixture.footer, errors, unavailableBlocks, approvedPageCopyAvailable);
  checkMessages(fixture.messages, errors);

  return errors;
}

function literalTextsFromExpression(expression: ts.Expression): string[] {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return [expression.text];
  }

  if (ts.isTemplateExpression(expression)) {
    const text = [
      expression.head.text,
      ...expression.templateSpans.map((span) => span.literal.text),
    ].join('');
    return text.trim() === '' ? [] : [text];
  }

  if (ts.isParenthesizedExpression(expression)) {
    return literalTextsFromExpression(expression.expression);
  }

  if (ts.isConditionalExpression(expression)) {
    return [
      ...literalTextsFromExpression(expression.whenTrue),
      ...literalTextsFromExpression(expression.whenFalse),
    ];
  }

  if (ts.isBinaryExpression(expression)) {
    const logicalOperators = new Set([
      ts.SyntaxKind.AmpersandAmpersandToken,
      ts.SyntaxKind.BarBarToken,
      ts.SyntaxKind.QuestionQuestionToken,
    ]);
    if (logicalOperators.has(expression.operatorToken.kind)) {
      return [
        ...literalTextsFromExpression(expression.left),
        ...literalTextsFromExpression(expression.right),
      ];
    }
  }

  return [];
}

function collectSourceFiles(directory: string, rootDir: string, files: SourceFile[]): void {
  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      collectSourceFiles(absolutePath, rootDir, files);
      continue;
    }

    if (!/\.tsx?$/.test(entry) || /\.(test|spec)\.[^.]+$/.test(entry)) {
      continue;
    }

    const relativePath = relative(rootDir, absolutePath).replaceAll('\\', '/');
    if (relativePath === SOURCE_FIXTURE_PATH || entry.endsWith('.d.ts')) {
      continue;
    }

    files.push({
      filePath: relativePath,
      source: readFileSync(absolutePath, 'utf8'),
    });
  }
}

interface SourceFile {
  filePath: string;
  source: string;
}

function addViolation(
  violations: VisibleBlockViolation[],
  sourceFile: SourceFile,
  source: ts.SourceFile,
  node: ts.Node,
  kind: VisibleBlockViolation['kind'],
  text: string,
): void {
  const position = source.getLineAndCharacterOfPosition(node.getStart(source));
  const normalizedText = text.trim();
  if (normalizedText === '') {
    return;
  }

  violations.push({
    filePath: sourceFile.filePath,
    line: position.line + 1,
    column: position.character + 1,
    kind,
    text: normalizedText,
  });
}

/**
 * Finds literal JSX copy in production client sources outside Content_Fixture.
 * Components must consume fixture fields instead of defining visible blocks inline.
 */
export function findVisibleBlocksOutsideFixture(
  sourceFiles: ReadonlyArray<SourceFile>,
): VisibleBlockViolation[] {
  const violations: VisibleBlockViolation[] = [];

  for (const sourceFile of sourceFiles) {
    const source = ts.createSourceFile(
      sourceFile.filePath,
      sourceFile.source,
      ts.ScriptTarget.Latest,
      true,
      sourceFile.filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    const visit = (node: ts.Node): void => {
      if (ts.isJsxText(node)) {
        addViolation(violations, sourceFile, source, node, 'jsx-text', node.text);
      }

      // JSX attributes are analyzed separately below. Treating every JSX
      // expression as visible copy would incorrectly flag className, aria-live,
      // role, and other structural values as publishable content.
      if (
        ts.isJsxExpression(node) &&
        node.expression &&
        !ts.isJsxAttribute(node.parent)
      ) {
        for (const text of literalTextsFromExpression(node.expression)) {
          addViolation(violations, sourceFile, source, node, 'jsx-expression', text);
        }
      }

      if (ts.isJsxAttribute(node)) {
        const attributeName = node.name.text;
        if (CONTENT_ATTRIBUTES.has(attributeName) && node.initializer) {
          if (ts.isStringLiteral(node.initializer)) {
            addViolation(
              violations,
              sourceFile,
              source,
              node,
              'content-attribute',
              node.initializer.text,
            );
          } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
            for (const text of literalTextsFromExpression(node.initializer.expression)) {
              addViolation(violations, sourceFile, source, node, 'content-attribute', text);
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(source);
  }

  return violations;
}

/**
 * Runs the build-time content gate against the current fixture and client source.
 */
export function verifyContentFixture(options: ContentVerificationOptions = {}): ContentVerificationResult {
  const rootDir = options.rootDir ?? process.cwd();
  const fixture = options.fixture ?? Content_Fixture;
  const fixtureErrors = validateContentFixture(fixture, options);
  const sourceFiles: SourceFile[] = [];
  collectSourceFiles(join(rootDir, 'client', 'src'), rootDir, sourceFiles);
  const visibleBlockViolations = findVisibleBlocksOutsideFixture(sourceFiles);

  const errors = [
    ...((options.copySource ?? COPY_SOURCE) !== COPY_SOURCE
      ? [`COPY_SOURCE must equal ${JSON.stringify(COPY_SOURCE)}.`]
      : []),
    ...(CONTENT_SOURCE_STATUS.source !== COPY_SOURCE
      ? [`CONTENT_SOURCE_STATUS.source must equal ${JSON.stringify(COPY_SOURCE)}.`]
      : []),
    ...((options.unavailableBlocks ?? CONTENT_SOURCE_STATUS.unavailableBlocks).length > 0
      ? ['CONTENT_SOURCE_STATUS.unavailableBlocks must be empty before publishing content.']
      : []),
    ...(options.approvedPageCopyAvailable ?? CONTENT_SOURCE_STATUS.approvedPageCopyAvailable
      ? []
      : [
          'CONTENT_SOURCE_STATUS.approvedPageCopyAvailable must be true before publishing content.',
        ]),
    ...fixtureErrors,
    ...visibleBlockViolations.map(
      (violation) =>
        `${violation.filePath}:${violation.line}:${violation.column} contains literal ${violation.kind} outside Content_Fixture: ${JSON.stringify(violation.text)}`,
    ),
  ];

  if (errors.length > 0) {
    throw new Error(['Content verification failed:', ...errors.map((error) => `- ${error}`)].join('\n'));
  }

  return {
    sourceFilesChecked: sourceFiles.length,
    visibleBlockViolations,
  };
}

export { COPY_SOURCE };
