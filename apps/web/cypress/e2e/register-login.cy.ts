describe('US03 account creation', () => {
  it('creates an account and accesses the authenticated personal area', () => {
    cy.intercept('POST', '**/auth/register', {
      statusCode: 201,
      headers: {
        'content-type': 'application/json',
      },
      body: {
        status: 'success',
        message: 'Compte créé avec succès.',
        data: {
          accessToken: 'jwt-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 'user-id',
            email: 'user@example.com',
            avatar: null,
          },
        },
      },
    }).as('register');
    cy.intercept('GET', '**/me/file-assets*', {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: {
        status: 'success',
        message: 'OK',
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
        },
      },
    }).as('history');

    cy.visit('/register');
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@register');
    cy.location('pathname').should('match', /\/(history|upload)$/);
    cy.window().then((window) => {
      expect(window.localStorage.getItem('datashare.auth')).to.contain('jwt-token');
    });
  });

  it('displays duplicate email errors', () => {
    cy.intercept('POST', '**/auth/register', {
      statusCode: 409,
      headers: {
        'content-type': 'application/problem+json',
      },
      body: {
        type: 'https://datashare.local/problems/409',
        title: 'Conflict',
        status: 409,
        detail: 'Un compte existe déjà pour cet email.',
        instance: '/auth/register',
      },
    }).as('registerDuplicate');

    cy.visit('/register');
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@registerDuplicate');
    cy.contains(/compte existe déjà/i).should('be.visible');
  });
});
