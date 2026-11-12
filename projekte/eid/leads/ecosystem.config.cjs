module.exports = {
  apps: [{ name: 'eid-leads', script: 'server.js', cwd: __dirname, env: { NODE_ENV: 'production' }, out_file: 'logs/out.log', error_file: 'logs/err.log', max_memory_restart: '200M' }]
};
