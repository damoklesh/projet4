const apiBaseUrl = 'http://localhost:3000';

describe('real API authenticated upload flow', () => {
  it('registers, uploads, lists, downloads, and deletes a file through the real Nest API', () => {
    const runId = `${Date.now()}-${Cypress._.random(1000, 9999)}`;
    const email = `cypress-${runId}@example.com`;
    const password = 'Password123';
    const fileName = `real-flow-${runId}.txt`;
    const fileContents = `real cypress flow ${runId}`;

    cy.visit('/register');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="passwordConfirmation"]').type(password);
    cy.contains('button', /creer mon compte/i).click();

    cy.location('pathname').should('eq', '/history');
    cy.contains(email).should('be.visible');

    cy.visit('/upload');
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from(fileContents),
        fileName,
        mimeType: 'text/plain',
      },
      { force: true },
    );
    cy.get('select[name="expirationDays"]').select('3');
    cy.contains('button', /televerser/i).click();

    cy.contains(/felicitations/i).should('be.visible');
    cy.get('input[aria-label="Lien de partage"]')
      .invoke('val')
      .then((value) => {
        const shareUrl = String(value);
        const token = shareUrl.split('/').filter(Boolean).at(-1);

        expect(token, 'share token').to.be.a('string');
        expect(token, 'share token').not.to.equal('');

        cy.request(`${apiBaseUrl}/share-links/${token}`).then((response) => {
          expect(response.status).to.equal(200);
          expect(response.body.data.fileName).to.equal(fileName);
          expect(response.body.data.isPasswordProtected).to.equal(false);
        });

        cy.request({
          method: 'POST',
          url: `${apiBaseUrl}/share-links/${token}/download`,
          body: {},
        }).then((response) => {
          expect(response.status).to.equal(200);
          expect(response.body).to.equal(fileContents);
        });
      });

    cy.visit('/history');
    cy.contains(fileName).should('be.visible');
    cy.contains('.history-row', fileName).contains('button', /^supprimer$/i).click();
    cy.get('[role="dialog"]').contains('button', /^supprimer$/i).click();
    cy.contains(fileName).should('not.exist');
  });
});
