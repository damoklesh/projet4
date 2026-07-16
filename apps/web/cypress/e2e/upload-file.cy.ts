describe('US01 authenticated upload', () => {
  it('uploads a file with authentication and displays the public share link', () => {
    cy.intercept('POST', '**/file-assets', (request) => {
      expect(request.headers.authorization).to.equal('Bearer jwt-token');
      request.reply({
        statusCode: 201,
        headers: {
          'content-type': 'application/json',
        },
        body: {
          status: 'success',
          message: 'Fichier televerse avec succes.',
          data: createUploadResponse({
            fileName: 'authenticated.pdf',
            shareUrl: 'http://localhost:5173/share/authenticated-token',
            token: 'authenticated-token',
          }),
        },
      });
    }).as('anonymousUpload');

    cy.visit('/upload', {
      onBeforeLoad(window) {
        window.localStorage.setItem(
          'datashare.auth',
          JSON.stringify({
            accessToken: 'jwt-token',
            tokenType: 'Bearer',
            expiresIn: 3600,
            user: {
              id: 'user-id',
              email: 'user@example.com',
              avatar: null,
            },
          }),
        );
      },
    });
    cy.contains(/tu veux partager un fichier/i).should('be.visible');
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('authenticated file content'),
        fileName: 'authenticated.pdf',
        mimeType: 'application/pdf',
      },
      { force: true },
    );

    cy.contains('authenticated.pdf').should('be.visible');
    cy.get('input[name="password"]').type('secret1');
    cy.get('select[name="expirationDays"]').select('7');
    cy.contains('button', /televerser/i).click();

    cy.wait('@anonymousUpload');
    cy.contains(/felicitations/i).should('be.visible');
    cy.get('input[aria-label="Lien de partage"]').should('have.value', 'http://localhost:5173/share/authenticated-token');
  });
});

function createUploadResponse(input: { fileName: string; shareUrl: string; token: string }) {
  return {
    fileAsset: {
      id: `${input.token}-file-id`,
      fileName: input.fileName,
      mimeType: 'application/pdf',
      size: 22,
      uploadedAt: '2026-07-08T10:30:00.000Z',
      expiresAt: '2099-07-15T10:30:00.000Z',
      status: 'active',
      isPasswordProtected: true,
      tags: [],
    },
    shareLink: {
      url: input.shareUrl,
      token: input.token,
      expiresAt: '2099-07-15T10:30:00.000Z',
      isPasswordProtected: true,
    },
  };
}
