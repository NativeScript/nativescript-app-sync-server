import { Sequelize } from '@sequelize/core'
import { exec } from 'child_process'

import config from './core/config'

try {
    if (process.env.NODE_ENV === 'production') {
        const migrate = exec(
            'sequelize db:migrate',
            { env: process.env },
            err => console.log(err)
        );
        migrate.stdout?.pipe(process.stdout);
        migrate.stderr?.pipe(process.stderr);
    }
} catch (error) {
    console.log('Migration error:', error)
}


const sequelize = new Sequelize(config.db);

export { sequelize };
