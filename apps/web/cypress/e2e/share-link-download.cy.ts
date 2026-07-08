describe('public share link download', () => {
  it('downloads a file without authentication', () => {
    cy.intercept('GET', '**/share-links/public-token', {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: {
        status: 'success',
        message: 'OK',
        data: createMetadata({
          token: 'public-token',
          fileName: 'public-document.pdf',
          isPasswordProtected: false,
        }),
      },
    }).as('metadata');
    cy.intercept('POST', '**/share-links/public-token/download', (request) => {
      expect(request.headers.authorization).to.equal(undefined);
      request.reply({
        statusCode: 200,
        headers: {
          'content-type': 'application/octet-stream',
        },
        body: 'public file content',
      });
    }).as('download');

    cy.visit('/share/public-token');
    cy.wait('@metadata');
    cy.contains('public-document.pdf').should('be.visible');
    cy.contains('button', /telecharger/i).should('not.be.disabled').click();

    cy.wait('@download');
    cy.contains(/telechargement demarre/i).should('be.visible');
  });

  it('downloads a file while authenticated', () => {
    seedAuthSession();
    cy.intercept('GET', '**/share-links/auth-token', {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: {
        status: 'success',
        message: 'OK',
        data: createMetadata({
          token: 'auth-token',
          fileName: 'authenticated-document.pdf',
          isPasswordProtected: true,
        }),
      },
    }).as('metadata');
    cy.intercept('POST', '**/share-links/auth-token/download', (request) => {
      expect(request.headers.authorization).to.equal('Bearer jwt-token');
      expect(request.body).to.deep.equal({ password: 'secret123' });
      request.reply({
        statusCode: 200,
        headers: {
          'content-type': 'application/octet-stream',
        },
        body: 'authenticated file content',
      });
    }).as('download');

    cy.visit('/share/auth-token');
    cy.wait('@metadata');
    cy.contains('authenticated-document.pdf').should('be.visible');
    cy.contains('button', /telecharger/i).should('be.disabled');
    cy.get('input[name="password"]').type('secret123');
    cy.contains('button', /telecharger/i).should('not.be.disabled').click();

    cy.wait('@download');
    cy.contains(/telechargement demarre/i).should('be.visible');
  });
});

function createMetadata(input: { token: string; fileName: string; isPasswordProtected: boolean }) {
  return {
    token: input.token,
    fileName: input.fileName,
    mimeType: 'application/pdf',
    size: 2048,
    uploadedAt: '2026-07-08T10:30:00.000Z',
    expiresAt: '2099-07-15T10:30:00.000Z',
    status: 'active',
    isPasswordProtected: input.isPasswordProtected,
  };
}

function seedAuthSession() {
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
}
