const faker = require('@faker-js/faker').faker;

module.exports = {
  // Generate random data for API tests
  $randomString: function() {
    return faker.company.name() + ' ' + faker.word.noun();
  },

  $randomNumber: function(min, max) {
    return faker.number.int({ min, max });
  },

  $randomEmail: function() {
    return faker.internet.email({ provider: 'vextrus.bd' });
  },

  $randomFullName: function() {
    return faker.person.fullName();
  },

  $timestamp: function() {
    return Date.now();
  },

  $futureTimestamp: function(offsetSeconds) {
    return new Date(Date.now() + offsetSeconds * 1000).toISOString();
  },

  // Generate test data for specific scenarios
  generateProjectData: function(context, ee, next) {
    context.vars.projectName = faker.company.name() + ' Construction';
    context.vars.projectBudget = faker.number.int({ min: 1000000, max: 100000000 });
    context.vars.projectType = faker.helpers.arrayElement(['Infrastructure', 'Residential', 'Commercial', 'Industrial']);
    context.vars.projectLocation = faker.helpers.arrayElement(['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi']);
    return next();
  },

  // Process response data
  captureAuthToken: function(requestParams, response, context, ee, next) {
    if (response.body && typeof response.body === 'string') {
      try {
        const body = JSON.parse(response.body);
        if (body.token) {
          context.vars.authToken = body.token;
        }
      } catch (e) {
        // Silent fail
      }
    }
    return next();
  },

  // Validate response structure
  validateProjectResponse: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 200 || response.statusCode === 201) {
      try {
        const body = JSON.parse(response.body);
        if (!body.id || !body.name || !body.budget) {
          ee.emit('error', 'Invalid project response structure');
        }
      } catch (e) {
        ee.emit('error', 'Failed to parse project response');
      }
    }
    return next();
  }
};