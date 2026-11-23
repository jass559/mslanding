import { verifyContentFixture } from './contentVerification';

try {
  const result = verifyContentFixture();
  console.log(
    `Content fixture verified: ${result.sourceFilesChecked} production source files checked.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
