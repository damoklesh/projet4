import { defineConfig } from 'cypress';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on) {
      on('after:run', (results) => {
        const reportsDir = resolve('../../reports/web/cypress');
        mkdirSync(reportsDir, { recursive: true });

        const report = {
          status: results.totalFailed > 0 ? 'failed' : 'passed',
          browserName: results.browserName,
          browserVersion: results.browserVersion,
          osName: results.osName,
          osVersion: results.osVersion,
          cypressVersion: results.cypressVersion,
          totals: {
            duration: results.totalDuration,
            suites: results.totalSuites,
            tests: results.totalTests,
            passed: results.totalPassed,
            failed: results.totalFailed,
            pending: results.totalPending,
            skipped: results.totalSkipped,
          },
          runs: results.runs.map((run) => ({
            spec: run.spec.relative,
            stats: run.stats,
            tests: run.tests.map((test) => ({
              title: test.title,
              state: test.state,
              duration: test.duration,
              displayError: test.displayError,
            })),
            error: run.error,
          })),
        };

        writeFileSync(resolve(reportsDir, 'cypress.json'), JSON.stringify(report, null, 2));
      });
    },
  },
});
