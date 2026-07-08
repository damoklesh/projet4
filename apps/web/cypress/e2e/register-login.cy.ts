describe('authentication flows', () => {
  it('logs in and opens Mon espace history', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 201,
      headers: {
        'content-type': 'application/json',
      },
      body: {
        status: 'success',
        message: 'Connexion reussie.',
        data: createAuthSession('user@example.com'),
      },
    }).as('login');
    cy.intercept('GET', '**/me/file-assets*', (request) => {
      expect(request.headers.authorization).to.equal('Bearer jwt-token');
      request.reply(createHistoryResponse([]));
    }).as('history');

    cy.visit('/login');
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('Password123');
    cy.contains('button', /^connexion$/i).click();

    cy.wait('@login');
    cy.location('pathname').should('eq', '/history');
    cy.wait('@history');
    cy.contains(/mes fichiers/i).should('be.visible');
    cy.contains(/aucun fichier/i).should('be.visible');
    cy.window().then((window) => {
      expect(window.localStorage.getItem('datashare.auth')).to.contain('jwt-token');
    });
  });

  it('registers a new user and opens Mon espace history', () => {
    cy.intercept('POST', '**/auth/register', {
      statusCode: 201,
      headers: {
        'content-type': 'application/json',
      },
      body: {
        status: 'success',
        message: 'Compte cree avec succes.',
        data: createAuthSession('new-user@example.com'),
      },
    }).as('register');
    cy.intercept('GET', '**/me/file-assets*', (request) => {
      expect(request.headers.authorization).to.equal('Bearer jwt-token');
      request.reply(createHistoryResponse([]));
    }).as('history');

    cy.visit('/register');
    cy.get('input[name="email"]').type('new-user@example.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('input[name="passwordConfirmation"]').type('Password123');
    cy.contains('button', /creer mon compte/i).click();

    cy.wait('@register');
    cy.location('pathname').should('eq', '/history');
    cy.wait('@history');
    cy.contains(/mes fichiers/i).should('be.visible');
  });
});

function createAuthSession(email: string) {
  return {
    accessToken: 'jwt-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: 'user-id',
      email,
      avatar: null,
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
