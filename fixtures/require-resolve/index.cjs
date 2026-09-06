const packageName = 'axios';

require.resolve('lodash');
require.resolve('@testing-library/react');
require.resolve('date-fns/format');
require.resolve('picocolors', { paths: [process.cwd()] });
import('lodash', { with: { type: 'json' } });
require.resolve(packageName);
require.resolve(packageName, { paths: [process.cwd()] });
import(packageName, { with: { type: 'json' } });
resolver.resolve('axios');
