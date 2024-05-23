const { AiServiceError, extractTask, postJson } = require('./aiGateway.service');

const originalFetch = global.fetch;

describe('AI gateway', () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockFetch({ ok = true, status = 200, body = {} } = {}) {
    global.fetch = jest.fn().mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
    });
  }

  it('posts to the AI service with the service token', async () => {
    mockFetch({ body: { task: { title: 'Prepare demo' } } });

    const task = await extractTask('prepare demo tomorrow', 'UTC');

    expect(task.title).toBe('Prepare demo');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/v1/tasks/extract');
    expect(options.headers['x-service-token']).toBeTruthy();
    expect(options.body).toContain('prepare demo tomorrow');
  });

  it('maps network failures to 503', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(postJson('/tasks/extract', {})).rejects.toMatchObject({
      name: 'AiServiceError',
      status: 503,
    });
  });

  it('maps provider errors to 502', async () => {
    mockFetch({ ok: false, status: 500 });

    await expect(postJson('/tasks/extract', {})).rejects.toMatchObject({
      name: 'AiServiceError',
      status: 502,
    });
  });

  it('surfaces the error class for controllers', () => {
    const err = new AiServiceError('AI service is unavailable', 503);
    expect(err.status).toBe(503);
    expect(err.message).toBe('AI service is unavailable');
  });
});
