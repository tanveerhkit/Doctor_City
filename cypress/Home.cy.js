describe('Home Page', () => {
  it('should load successfully and display the main hero heading', () => {
    // Visit the root of your application
    cy.visit('http://localhost:3000');

    cy.contains('h1', 'Report Local Issues.').should('be.visible');
  });
});

