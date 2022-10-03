import _ from 'lodash'
import log4js from 'log4js'
import validationRouter from '~/core/router'

const log = log4js.getLogger("cps:account")
const router = validationRouter()

router.get('/', (req, res) => {
  var userInfo = {
    email: req.users.email,
    linkedProviders: [],
    name: req.users.username,
  };
  log.debug(userInfo);
  res.send({ account: userInfo });
});

export default router;
