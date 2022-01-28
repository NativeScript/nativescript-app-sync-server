import moduleAlias from 'module-alias';
import path from 'path';

const IS_DEV = process.env.NODE_ENV !== 'production';
const rootPath = path.resolve(__dirname, '..');
const rootPathDev = path.resolve(rootPath, 'src');
const rootPathProd = path.resolve(rootPath, 'dist');
moduleAlias.addAliases({
  '~': IS_DEV ? rootPathDev : rootPathProd,
});