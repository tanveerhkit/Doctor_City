describe('Application Navigation', () => {
  it('should load the home page successfully', () => {
    // Visit the base URL of the frontend application
    cy.visit('http://localhost:3000');

    // Assert that the main heading is visible on the page
    cy.contains('h1', 'Report Local Issues.').should('be.visible');
  });
});

