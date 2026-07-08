describe('authenticated file management', () => {
  beforeEach(() => {
    seedAuthSession();
  });

  it('uploads a file with authentication', () => {
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
          data: createUploadResponse(),
        },
      });
    }).as('authenticatedUpload');

    cy.visit('/upload');
    cy.contains(/mon espace/i).should('be.visible');
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('authenticated file content'),
        fileName: 'authenticated.pdf',
        mimeType: 'application/pdf',
      },
      { force: true },
    );
    cy.get('select[name="expirationDays"]').select('3');
    cy.contains('button', /televerser/i).click();

    cy.wait('@authenticatedUpload');
    cy.contains(/felicitations/i).should('be.visible');
    cy.get('input[aria-label="Lien de partage"]').should('have.value', 'http://localhost:5173/share/auth-upload-token');
  });

  it('shows history and deletes a file from history', () => {
    cy.intercept('GET', '**/me/file-assets*', (request) => {
      expect(request.headers.authorization).to.equal('Bearer jwt-token');
      request.reply(createHistoryResponse([createHistoryItem()]));
    }).as('history');
    cy.intercept('DELETE', '**/file-assets/file-id', (request) => {
      expect(request.headers.authorization).to.equal('Bearer jwt-token');
      request.reply({
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
        },
        body: {
          status: 'success',
          message: 'Fichier supprime avec succes.',
          data: {
            id: 'file-id',
            status: 'deleted',
          },
        },
      });
    }).as('deleteFile');

    cy.visit('/history');
    cy.wait('@history');
    cy.contains(/mes fichiers/i).should('be.visible');
    cy.contains('history-document.pdf').should('be.visible');
    cy.contains(/protege/i).should('be.visible');

    cy.contains('button', /supprimer/i).click();
    cy.get('[role="dialog"]').should('contain.text', 'Supprimer le fichier');
    cy.get('[role="dialog"]').contains('button', /^supprimer$/i).click();

    cy.wait('@deleteFile');
    cy.contains('history-document.pdf').should('not.exist');
  });
});

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

function createUploadResponse() {
  return {
    fileAsset: {
      id: 'auth-file-id',
      fileName: 'authenticated.pdf',
      mimeType: 'application/pdf',
      size: 26,
      uploadedAt: '2026-07-08T10:30:00.000Z',
      expiresAt: '2099-07-11T10:30:00.000Z',
      status: 'active',
      isPasswordProtected: false,
      tags: [],
    },
    shareLink: {
      url: 'http://localhost:5173/share/auth-upload-token',
      token: 'auth-upload-token',
      expiresAt: '2099-07-11T10:30:00.000Z',
      isPasswordProtected: false,
    },
  };
}

function createHistoryItem() {
  return {
    id: 'file-id',
    fileName: 'history-document.pdf',
    mimeType: 'application/pdf',
    size: 245760,
    uploadedAt: '2026-07-08T10:30:00.000Z',
    expiresAt: '2099-07-15T10:30:00.000Z',
    status: 'active',
    isPasswordProtected: true,
    tags: [{ id: 'tag-id', name: 'facture' }],
    shareLink: {
      url: 'http://localhost:5173/share/history-token',
      token: 'history-token',
      expiresAt: '2099-07-15T10:30:00.000Z',
      isPasswordProtected: true,
    },
  };
}

function createHistoryResponse(items: unknown[]) {
  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
    body: {
      status: 'success',
      message: 'OK',
      data: {
        items,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: items.length,
          totalPages: items.length > 0 ? 1 : 0,
        },
      },
    },
  };
}
