// Test unitario para dashboardController
const dashboardController = require('../controllers/dashboardController');

describe('dashboardController', () => {
  it('debe manejar correctamente la petición y respuesta (mock)', async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await dashboardController.getDashboardData(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
